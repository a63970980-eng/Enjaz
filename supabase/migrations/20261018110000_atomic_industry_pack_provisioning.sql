BEGIN;

CREATE OR REPLACE FUNCTION public.provision_industry_pack(
  p_workspace_id uuid,
  p_pack text,
  p_actor_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sector text;
  v_label text;
  v_subscription_status text;
  v_max_employees integer;
  v_existing_employee_id uuid;
  v_existing_employees integer;
  v_existing_departments integer;
  v_existing_role_count integer;
  v_current_employees integer;
  v_required_employees integer;
  v_department record;
  v_role record;
  v_department_id uuid;
  v_employee_id uuid;
  v_team_employee_ids uuid[];
  v_team_manager_id uuid;
  v_tools jsonb;
  v_permissions jsonb;
  v_policy jsonb;
  v_knowledge text;
  v_created_employees jsonb := '[]'::jsonb;
  v_created_departments jsonb := '[]'::jsonb;
  v_safe_tools text[] := ARRAY[
    'data.analyze','report.create','task.comment','task.handoff','tasks','quality.check',
    'finance.read','knowledge','approvals','crm','hr.read','inventory.read','revenue.analyze',
    'customer.service','audit.read','compliance.check','commerce.products.list','commerce.inventory.alerts',
    'commerce.analytics.summary','commerce.customer.lookup','commerce.orders.list'
  ];
  v_safe_permissions text[] := ARRAY['read_workspace','read_tasks','read_knowledge'];
BEGIN
  v_sector := CASE WHEN p_pack = 'ecommerce' THEN 'retail' ELSE p_pack END;
  v_label := CASE p_pack
    WHEN 'hospital' THEN 'المستشفيات'
    WHEN 'restaurant' THEN 'المطاعم'
    WHEN 'hotel' THEN 'الفنادق'
    WHEN 'enterprise' THEN 'الشركات'
    WHEN 'government' THEN 'الجهات الحكومية'
    WHEN 'retail' THEN 'التجزئة'
    WHEN 'ecommerce' THEN 'التجارة الإلكترونية'
    WHEN 'finance' THEN 'المالية'
    WHEN 'sales' THEN 'المبيعات'
    WHEN 'customer_service' THEN 'خدمة العملاء'
    WHEN 'hr' THEN 'الموارد البشرية'
    WHEN 'marketing' THEN 'التسويق'
    WHEN 'operations' THEN 'العمليات'
    ELSE NULL
  END;
  IF v_label IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='UNKNOWN_INDUSTRY_PACK';
  END IF;

  -- Serialize provisioning paths for this workspace before checking idempotency or quotas.
  PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='WORKSPACE_NOT_FOUND';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id=p_workspace_id AND user_id=p_actor_user_id AND role IN ('owner','admin','manager')
  ) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='MANAGER_PERMISSION_REQUIRED';
  END IF;

  SELECT s.status,p.max_employees INTO v_subscription_status,v_max_employees
  FROM public.workspace_subscriptions s
  JOIN public.billing_plans p ON p.id=s.plan_id
  WHERE s.workspace_id=p_workspace_id
  FOR UPDATE OF s;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='SUBSCRIPTION_NOT_CONFIGURED';
  END IF;
  IF v_subscription_status NOT IN ('active','trialing') THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='SUBSCRIPTION_INACTIVE';
  END IF;

  SELECT count(*)::integer INTO v_required_employees
  FROM public.employee_role_templates
  WHERE sector=v_sector AND active=true AND provision_by_default=true;
  IF v_required_employees=0 THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='NO_STARTER_ROLES_CONFIGURED';
  END IF;

  SELECT id INTO v_existing_employee_id
  FROM public.ai_employees
  WHERE workspace_id=p_workspace_id AND policy->>'industryPack'=v_sector
  ORDER BY created_at
  LIMIT 1;
  IF FOUND THEN
    SELECT count(DISTINCT COALESCE(e.role_code,e.policy->>'roleCode'))::integer
    INTO v_existing_role_count
    FROM public.ai_employees e
    JOIN public.employee_role_templates r ON r.sector=v_sector AND r.active=true AND r.provision_by_default=true
      AND r.role_code=COALESCE(e.role_code,e.policy->>'roleCode')
    WHERE e.workspace_id=p_workspace_id AND e.policy->>'industryPack'=v_sector;
    IF v_existing_role_count<v_required_employees THEN
      RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='INDUSTRY_PACK_INCOMPLETE';
    END IF;

    SELECT count(*)::integer,count(DISTINCT COALESCE(department_id::text,policy->>'departmentId'))::integer
    INTO v_existing_employees,v_existing_departments
    FROM public.ai_employees
    WHERE workspace_id=p_workspace_id AND policy->>'industryPack'=v_sector;
    RETURN jsonb_build_object(
      'created',false,'pack',p_pack,'label',v_label,'employees',v_existing_employees,
      'departments',v_existing_departments,'ready',true,'existingEmployeeId',v_existing_employee_id
    );
  END IF;

  SELECT count(*)::integer INTO v_current_employees
  FROM public.ai_employees WHERE workspace_id=p_workspace_id;
  IF v_current_employees+v_required_employees>v_max_employees THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='EMPLOYEE_LIMIT_EXCEEDED';
  END IF;

  FOR v_department IN
    SELECT COALESCE(department_name,'فريق التشغيل') AS name,MIN(sort_order) AS sort_order
    FROM public.employee_role_templates
    WHERE sector=v_sector AND active=true AND provision_by_default=true
    GROUP BY COALESCE(department_name,'فريق التشغيل')
    ORDER BY MIN(sort_order),COALESCE(department_name,'فريق التشغيل')
  LOOP
    v_department_id := gen_random_uuid();
    v_team_employee_ids := ARRAY[]::uuid[];
    INSERT INTO public.departments(id,workspace_id,name,description)
    VALUES(v_department_id,p_workspace_id,v_department.name,'فريق افتتاحي للقوى العاملة الرقمية في قطاع '||v_label);

    FOR v_role IN
      SELECT * FROM public.employee_role_templates
      WHERE sector=v_sector AND active=true AND provision_by_default=true
        AND COALESCE(department_name,'فريق التشغيل')=v_department.name
      ORDER BY sort_order,name
    LOOP
      SELECT COALESCE(jsonb_agg(to_jsonb(tool_name)),'[]'::jsonb) INTO v_tools
      FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(v_role.tools)='array' THEN v_role.tools ELSE '[]'::jsonb END
      ) AS allowed(tool_name)
      WHERE tool_name=ANY(v_safe_tools);
      IF jsonb_array_length(v_tools)=0 THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='STARTER_TEMPLATE_HAS_NO_SAFE_TOOLS';
      END IF;

      SELECT COALESCE(jsonb_agg(to_jsonb(permission_name)),'[]'::jsonb) INTO v_permissions
      FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(v_role.permissions)='array' THEN v_role.permissions ELSE '[]'::jsonb END
      ) AS allowed(permission_name)
      WHERE permission_name=ANY(v_safe_permissions);

      v_employee_id := gen_random_uuid();
      v_policy := jsonb_build_object(
        'industryPack',v_sector,'templateId',v_role.id,'roleCode',v_role.role_code,
        'departmentId',v_department_id,'approvalMode','required','sensitiveActionsRequireApproval',true
      );
      INSERT INTO public.ai_employees(
        id,workspace_id,department_id,role_code,name,role,goal,mission,responsibilities,skills,tools,
        permissions,memory_config,model,budget_cents,schedule,status,policy
      ) VALUES (
        v_employee_id,p_workspace_id,v_department_id,v_role.role_code,v_role.name,v_role.name,v_role.default_goal,
        COALESCE(NULLIF(v_role.mission,''),NULLIF(v_role.description,''),v_role.default_goal),
        CASE WHEN jsonb_typeof(v_role.responsibilities)='array' THEN v_role.responsibilities ELSE '[]'::jsonb END,
        CASE WHEN jsonb_typeof(v_role.skills)='array' THEN v_role.skills ELSE '[]'::jsonb END,
        v_tools,v_permissions,
        '{"enabled":true,"retentionDays":365,"contextScope":"workspace","memoryTypes":["facts","decisions","preferences","task_results"]}'::jsonb,
        'default',COALESCE(v_role.default_budget_cents,5000),'{"type":"always","timezone":"UTC"}'::jsonb,'active',v_policy
      );
      INSERT INTO public.employee_goals(id,workspace_id,employee_id,title,target,current_value,unit,period,status)
      VALUES(gen_random_uuid(),p_workspace_id,v_employee_id,COALESCE(NULLIF(v_role.default_goal,''),'تحقيق الهدف التشغيلي للدور'),100,0,'نسبة','شهري','active');
      v_knowledge := 'الهدف التشغيلي: '||COALESCE(v_role.default_goal,'')||E'\n'||
        'رسالة الدور: '||COALESCE(v_role.mission,v_role.description,v_role.default_goal,'')||E'\n'||
        'المسؤوليات: '||COALESCE(v_role.responsibilities::text,'[]')||E'\n'||
        'استخدم الأدوات المسموحة فقط، وثّق النتائج، وصعّد الإجراءات المالية أو الخارجية أو الحساسة إلى مدير المساحة.';
      INSERT INTO public.employee_knowledge(id,workspace_id,employee_id,title,content,source,metadata)
      VALUES(gen_random_uuid(),p_workspace_id,v_employee_id,'الهوية المهنية والدور',v_knowledge,'ENJAZ ready workforce catalog',
        jsonb_build_object('industryPack',v_sector,'templateId',v_role.id,'roleCode',v_role.role_code,'departmentId',v_department_id));

      v_team_employee_ids := array_append(v_team_employee_ids,v_employee_id);
      v_created_employees := v_created_employees || jsonb_build_array(jsonb_build_object(
        'id',v_employee_id,'name',v_role.name,'roleCode',v_role.role_code,'departmentId',v_department_id
      ));
    END LOOP;

    v_team_manager_id := v_team_employee_ids[1];
    UPDATE public.departments SET manager_employee_id=v_team_manager_id,updated_at=now()
    WHERE id=v_department_id AND workspace_id=p_workspace_id;
    v_created_departments := v_created_departments || jsonb_build_array(jsonb_build_object(
      'id',v_department_id,'name',v_department.name,'managerEmployeeId',v_team_manager_id
    ));
  END LOOP;

  INSERT INTO public.workspace_profiles(workspace_id,sector,industry,operating_model,onboarding_stage,settings,updated_at)
  VALUES(p_workspace_id,v_sector,v_label,'digital_workforce','ready',
    '{"readyWorkforce":true,"governance":"approval-gated","catalogVersion":"2026.10","operatingPrinciples":["role-first","least-privilege","audit-every-action","human-approval-for-risk"]}'::jsonb,now())
  ON CONFLICT(workspace_id) DO UPDATE SET sector=EXCLUDED.sector,industry=EXCLUDED.industry,
    onboarding_stage='ready',settings=COALESCE(public.workspace_profiles.settings,'{}'::jsonb)||EXCLUDED.settings,updated_at=now();

  INSERT INTO public.audit_events(id,workspace_id,employee_id,event_type,actor_type,action,metadata)
  VALUES(gen_random_uuid(),p_workspace_id,(v_created_employees->0->>'id')::uuid,
    'industry.pack.provisioned','user','industry.provision',
    jsonb_build_object('pack',v_sector,'actorUserId',p_actor_user_id,'employees',v_required_employees,
      'departments',jsonb_array_length(v_created_departments),'source','ready_workforce_catalog'));

  RETURN jsonb_build_object(
    'created',true,'pack',p_pack,'label',v_label,'employees',jsonb_array_length(v_created_employees),
    'departments',jsonb_array_length(v_created_departments),'createdDepartments',v_created_departments,
    'createdEmployees',v_created_employees,'ready',true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_industry_pack(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_industry_pack(uuid,text,uuid) TO service_role;

COMMIT;
