import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';
import { getTool, needsApproval } from './tool-registry.js';

const PACK_LABELS = {
  hospital: 'المستشفيات', restaurant: 'المطاعم', hotel: 'الفنادق', enterprise: 'الشركات', government: 'الجهات الحكومية',
  retail: 'التجزئة', ecommerce: 'التجارة الإلكترونية', finance: 'المالية', sales: 'المبيعات', customer_service: 'خدمة العملاء', hr: 'الموارد البشرية',
  marketing: 'التسويق', operations: 'العمليات',
};
const SAFE_PERMISSIONS = new Set(['read_workspace', 'read_tasks', 'read_knowledge']);
const asArray = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

export async function listIndustryPacks() {
  const result = await query(`
    select sector as id, max(sector_label) as label,
      count(*)::int as roles,
      count(*) filter (where provision_by_default=true)::int as employees,
      count(distinct department_name) filter (where provision_by_default=true)::int as departments
    from employee_role_templates
    where active=true
    group by sector
    having count(*) filter (where provision_by_default=true) > 0
    order by sector
  `);
  const packs = result.rows.map(row => ({ ...row, label: row.label || PACK_LABELS[row.id] || row.id, ready: true }));
  const retail = packs.find(pack => pack.id === 'retail');
  return retail ? [...packs, { ...retail, id: 'ecommerce', label: PACK_LABELS.ecommerce }].sort((a, b) => a.id.localeCompare(b.id)) : packs;
}

export async function provisionIndustryPack({ workspaceId, pack, actorUserId }) {
  const label = PACK_LABELS[pack];
  if (!label) throw Object.assign(new Error(`Unknown industry pack: ${pack}`), { status: 400 });
  const catalogSector = pack === 'ecommerce' ? 'retail' : pack;

  return withTransaction(async client => {
    const workspace = await client.query('select id from public.workspaces where id=$1 for update', [workspaceId]);
    if (!workspace.rowCount) throw Object.assign(new Error('Workspace not found'), { status: 404 });
    const subscription = await client.query(`
      select s.plan_id,s.status,p.max_employees
      from workspace_subscriptions s
      join billing_plans p on p.id=s.plan_id
      where s.workspace_id=$1
      for update of s
    `, [workspaceId]);
    if (!subscription.rowCount) throw Object.assign(new Error('Workspace subscription is not configured'), { status: 409, code: 'SUBSCRIPTION_NOT_CONFIGURED' });
    if (!['active', 'trialing'].includes(subscription.rows[0].status)) {
      throw Object.assign(new Error('Workspace subscription is not active'), { status: 402, code: 'SUBSCRIPTION_INACTIVE' });
    }

    const templates = await client.query(`
      select * from employee_role_templates
      where sector=$1 and active=true and provision_by_default=true
      order by department_name,sort_order,name
    `, [catalogSector]);
    if (!templates.rowCount) throw Object.assign(new Error('No starter roles configured for this sector'), { status: 404 });

    const existing = await client.query("select id from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2 limit 1", [workspaceId, catalogSector]);
    if (existing.rowCount) {
      const expectedRoleCodes = templates.rows.map(role => role.role_code).filter(Boolean);
      const completeness = await client.query(`
        select count(distinct coalesce(role_code,policy->>'roleCode'))::int as count
        from public.ai_employees
        where workspace_id=$1 and policy->>'industryPack'=$2
          and coalesce(role_code,policy->>'roleCode')=any($3::text[])
      `, [workspaceId, catalogSector, expectedRoleCodes]);
      if (Number(completeness.rows[0]?.count || 0) < expectedRoleCodes.length) {
        throw Object.assign(new Error('An incomplete starter team from an earlier provisioning attempt needs reconciliation'), { status: 409, code: 'INDUSTRY_PACK_INCOMPLETE' });
      }
      const employees = await client.query("select count(*)::int as count from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2", [workspaceId, catalogSector]);
      const departments = await client.query("select count(distinct coalesce(department_id::text,policy->>'departmentId'))::int as count from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2", [workspaceId, catalogSector]);
      return { created: false, pack, label, employees: employees.rows[0].count, departments: departments.rows[0].count, existingEmployeeId: existing.rows[0].id };
    }

    const usage = await client.query('select count(*)::int as count from ai_employees where workspace_id=$1', [workspaceId]);
    const currentEmployees = Number(usage.rows[0]?.count || 0);
    const maxEmployees = Number(subscription.rows[0].max_employees);
    const available = Math.max(0, maxEmployees - currentEmployees);
    if (templates.rowCount > available) {
      throw Object.assign(new Error('The selected starter team exceeds the employee limit on this plan'), {
        status: 402, code: 'EMPLOYEE_LIMIT_EXCEEDED', required: templates.rowCount, available, planLimit: maxEmployees,
      });
    }

    await client.query(`
      insert into public.workspace_profiles(workspace_id,sector,industry,operating_model,onboarding_stage,settings,updated_at)
      values($1,$2,$3,'digital_workforce','ready',$4::jsonb,now())
      on conflict(workspace_id) do update set sector=excluded.sector,industry=excluded.industry,
        onboarding_stage='ready',settings=coalesce(public.workspace_profiles.settings,'{}'::jsonb)||excluded.settings,updated_at=now()
    `, [workspaceId, catalogSector, label, JSON.stringify({ readyWorkforce: true, governance: 'approval-gated', catalogVersion: '2026.10', operatingPrinciples: ['role-first', 'least-privilege', 'audit-every-action', 'human-approval-for-risk'] })]);

    const byDepartment = new Map();
    for (const role of templates.rows) {
      const departmentName = role.department_name || 'فريق التشغيل';
      if (!byDepartment.has(departmentName)) byDepartment.set(departmentName, []);
      byDepartment.get(departmentName).push(role);
    }

    const createdDepartments = [];
    const createdEmployees = [];
    for (const [departmentName, roles] of byDepartment) {
      const departmentId = randomUUID();
      await client.query('insert into public.departments(id,workspace_id,name,description) values($1,$2,$3,$4)', [departmentId, workspaceId, departmentName, `فريق افتتاحي للقوى العاملة الرقمية في قطاع ${label}`]);
      const employeeIds = [];
      for (const role of roles) {
        const tools = asArray(role.tools).filter(name => {
          const tool = getTool(name);
          return Boolean(tool) && tool.risk !== 'high' && !needsApproval(name);
        });
        if (!tools.length) throw new Error(`Starter template ${role.role_code} has no registered read-safe tools`);
        const permissions = asArray(role.permissions).filter(permission => SAFE_PERMISSIONS.has(permission));
        const employeeId = randomUUID();
        const policy = {
          industryPack: catalogSector,
          templateId: role.id,
          roleCode: role.role_code,
          departmentId,
          approvalMode: 'required',
          sensitiveActionsRequireApproval: true,
        };
        await client.query(`
          insert into public.ai_employees
            (id,workspace_id,department_id,role_code,name,role,goal,mission,responsibilities,skills,tools,permissions,memory_config,model,budget_cents,schedule,status,policy)
          values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15,$16::jsonb,$17,$18::jsonb)
        `, [
          employeeId, workspaceId, departmentId, role.role_code, role.name, role.name, role.default_goal,
          role.mission || role.description || role.default_goal, JSON.stringify(asArray(role.responsibilities)),
          JSON.stringify(asArray(role.skills)), JSON.stringify(tools), JSON.stringify(permissions),
          JSON.stringify({ enabled: true, retentionDays: 365, contextScope: 'workspace', memoryTypes: ['facts', 'decisions', 'preferences', 'task_results'] }),
          'default', Number(role.default_budget_cents) || 5000, JSON.stringify({ type: 'always', timezone: 'UTC' }), 'active', JSON.stringify(policy),
        ]);
        await client.query(`
          insert into public.employee_goals(id,workspace_id,employee_id,title,target,current_value,unit,period,status)
          values($1,$2,$3,$4,100,0,'نسبة','شهري','active')
        `, [randomUUID(), workspaceId, employeeId, role.default_goal || `تحقيق الهدف التشغيلي لدور ${role.name}`]);
        const knowledge = [
          `الهدف التشغيلي: ${role.default_goal}`,
          `رسالة الدور: ${role.mission || role.description || role.default_goal}`,
          `المسؤوليات: ${asArray(role.responsibilities).join('، ')}.`,
          'استخدم الأدوات المسموحة فقط، وثّق النتائج، وصعّد الإجراءات المالية أو الخارجية أو الحساسة إلى مدير المساحة.',
        ].join('\n');
        await client.query(`
          insert into public.employee_knowledge(id,workspace_id,employee_id,title,content,source,metadata)
          values($1,$2,$3,$4,$5,$6,$7::jsonb)
        `, [randomUUID(), workspaceId, employeeId, 'الهوية المهنية والدور', knowledge, 'ENJAZ ready workforce catalog', JSON.stringify({ industryPack: catalogSector, templateId: role.id, roleCode: role.role_code, departmentId })]);
        employeeIds.push(employeeId);
        createdEmployees.push({ id: employeeId, name: role.name, roleCode: role.role_code, departmentId });
      }
      await client.query('update public.departments set manager_employee_id=$1,updated_at=now() where id=$2 and workspace_id=$3', [employeeIds[0], departmentId, workspaceId]);
      createdDepartments.push({ id: departmentId, name: departmentName, managerEmployeeId: employeeIds[0] });
    }

    await client.query(`
      insert into public.audit_events(id,workspace_id,employee_id,event_type,actor_type,action,metadata)
      values($1,$2,$3,'industry.pack.provisioned','user','industry.provision',$4::jsonb)
    `, [randomUUID(), workspaceId, createdEmployees[0]?.id || null, JSON.stringify({ pack: catalogSector, actorUserId, employees: createdEmployees.length, departments: createdDepartments.length, readyTemplates: true, catalogVersion: '2026.10' })]);
    return { created: true, pack, label, employees: createdEmployees.length, departments: createdDepartments.length, createdDepartments, createdEmployees };
  });
}
