import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';

const PACKS = {
  hospital: {
    label: 'المستشفيات',
    departments: [
      ['الإدارة التنفيذية', 'إدارة المستشفى والقرارات التشغيلية', [['مدير المستشفى', 'قيادة التشغيل وتحقيق أهداف المستشفى'], ['محلل الأداء', 'قياس الأداء والجودة ورفع التقارير']]],
      ['العمليات وخدمة المرضى', 'المواعيد والاستقبال وتجربة المريض', [['مدير العمليات', 'تنسيق العمليات اليومية وتحسين تدفق الخدمة'], ['خدمة المرضى والمواعيد', 'إدارة المواعيد والاستفسارات ومتابعة الخدمة']]],
      ['المشتريات والمخزون', 'إدارة الإمدادات والمخزون والتوريد', [['مسؤول المشتريات', 'إدارة طلبات الشراء والموردين'], ['مسؤول المخزون', 'مراقبة المخزون والتنبيه إلى النقص']]],
      ['المالية والموارد البشرية', 'المالية والفوترة والموارد البشرية', [['مدير المالية', 'متابعة الفوترة والتكاليف والتقارير المالية'], ['مدير الموارد البشرية', 'إدارة القوى العاملة والحضور والاحتياجات البشرية']]],
    ],
  },
  restaurant: {
    label: 'المطاعم',
    departments: [
      ['الإدارة والتشغيل', 'إدارة المطعم والفروع والأداء', [['مدير المطعم', 'قيادة التشغيل وتحقيق أهداف الفرع'], ['منسق العمليات', 'متابعة سير العمل وحل الاختناقات']]],
      ['الطلبات وخدمة العملاء', 'إدارة الطلبات وتجربة العملاء', [['خدمة العملاء والطلبات', 'استقبال الطلبات وحل المشكلات ومتابعة العملاء'], ['منسق التوصيل', 'تنسيق الطلبات والتسليم ومتابعة التأخير']]],
      ['المخزون والمشتريات', 'التوريد والمخزون والهدر', [['مسؤول المخزون', 'مراقبة مستويات المخزون والهدر'], ['مسؤول المشتريات', 'إدارة الموردين وإعادة الطلبات']]],
      ['المالية والتسويق', 'الإيرادات والمصروفات والنمو', [['المحاسب', 'متابعة الإيرادات والمصروفات والتسويات'], ['مسؤول التسويق والمبيعات', 'تنمية المبيعات والحملات وقياس العائد']]],
    ],
  },
  hotel: {
    label: 'الفنادق',
    departments: [
      ['الإدارة والتشغيل', 'إدارة الفندق وجودة الخدمة', [['مدير الفندق', 'قيادة التشغيل وتحقيق أهداف الفندق'], ['مدير العمليات', 'تنسيق الأقسام ومراقبة جودة التشغيل']]],
      ['الحجوزات والاستقبال', 'الحجوزات والوصول والمغادرة وخدمة النزلاء', [['مدير الحجوزات والاستقبال', 'رفع الإشغال وتحسين دورة الحجز'], ['خدمة النزلاء', 'متابعة طلبات النزلاء وحل المشكلات']]],
      ['التدبير والصيانة', 'الغرف والنظافة والصيانة التشغيلية', [['مدير التدبير الفندقي', 'ضمان جاهزية الغرف وجودة النظافة'], ['منسق الصيانة', 'متابعة الأعطال وأعمال الصيانة']]],
      ['الإيرادات والمشتريات', 'التسعير والإيرادات والتوريد', [['مدير الإيرادات', 'تحسين الإشغال والإيراد لكل غرفة'], ['مسؤول المشتريات', 'إدارة التوريد والموردين والتكاليف']]],
    ],
  },
  enterprise: {
    label: 'الشركات',
    departments: [
      ['الإدارة التنفيذية', 'الاستراتيجية والقرارات التنفيذية', [['المدير التنفيذي', 'تنسيق أهداف الشركة وقراراتها الرئيسية'], ['المحلل التنفيذي', 'تحليل الأداء وإعداد تقارير الإدارة']]],
      ['العمليات', 'التشغيل وتحسين العمليات', [['مدير العمليات', 'رفع الكفاءة وإدارة العمليات العابرة للأقسام'], ['منسق المشاريع', 'متابعة الأعمال والمواعيد والاعتماديات']]],
      ['المبيعات والتسويق', 'اكتساب العملاء والنمو', [['مدير المبيعات', 'تنمية خط المبيعات وتحويل الفرص'], ['مسؤول التسويق', 'إدارة الحملات والمحتوى وقياس النمو']]],
      ['المالية والموارد البشرية', 'المالية والقوى العاملة', [['مدير المالية', 'إدارة الأداء المالي والتدفقات والتقارير'], ['مدير الموارد البشرية', 'إدارة المواهب والاحتياجات والقوى العاملة']]],
    ],
  },
  government: {
    label: 'الجهات الحكومية',
    departments: [
      ['الإدارة والخدمات', 'إدارة الخدمات والقرارات الإدارية', [['مدير الخدمة', 'قيادة الخدمة وتحسين تجربة المستفيد'], ['منسق العمليات', 'تنسيق الأعمال بين الوحدات']]],
      ['استقبال الطلبات', 'استقبال الطلبات وتصنيفها وتوجيهها', [['موظف استقبال الطلبات', 'استقبال الطلبات والتحقق من اكتمالها'], ['موظف التوجيه', 'توجيه المعاملات إلى الجهة المختصة']]],
      ['المعاملات والتقارير', 'متابعة المعاملات ومؤشرات الأداء', [['مدير المعاملات', 'متابعة دورة المعاملات وتقليل التأخير'], ['محلل التقارير', 'إعداد تقارير الأداء والخدمات']]],
      ['المراجعة والموافقة', 'الرقابة والمراجعة والقرارات الحساسة', [['مراجع الامتثال', 'مراجعة الالتزام والسياسات قبل التنفيذ'], ['منسق الموافقات', 'إدارة الموافقات البشرية وتصعيد الحالات الحساسة']]],
    ],
  },
};

const DEFAULT_TOOLS = ['data.analyze', 'report.create'];
const DEFAULT_PERMISSIONS = ['read_workspace', 'read_tasks', 'create_tasks', 'read_knowledge', 'write_knowledge'];

function assertPack(pack) {
  if (!PACKS[pack]) throw Object.assign(new Error(`Unknown industry pack: ${pack}`), { status: 400 });
  return PACKS[pack];
}

export function listIndustryPacks() {
  return Object.entries(PACKS).map(([id, pack]) => ({ id, label: pack.label, departments: pack.departments.length, employees: pack.departments.reduce((n, d) => n + d[2].length, 0) }));
}

export async function provisionIndustryPack({ workspaceId, pack, actorUserId }) {
  const template = assertPack(pack);
  return withTransaction(async client => {
    const existing = await client.query("select id,name,role,policy from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2 order by created_at limit 1", [workspaceId, pack]);
    if (existing.rowCount) {
      const count = await client.query("select count(*)::int as employees from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2", [workspaceId, pack]);
      const departments = await client.query("select count(*)::int as departments from public.departments where workspace_id=$1 and exists (select 1 from public.ai_employees e where e.id=departments.manager_employee_id and e.policy->>'industryPack'=$2)", [workspaceId, pack]);
      return { created: false, pack, label: template.label, employees: count.rows[0].employees, departments: departments.rows[0].departments, existingEmployeeId: existing.rows[0].id };
    }

    const createdDepartments = [];
    const createdEmployees = [];
    for (const [departmentName, description, employees] of template.departments) {
      const departmentId = randomUUID();
      await client.query(`insert into public.departments(id,workspace_id,name,description) values($1,$2,$3,$4)`, [departmentId, workspaceId, departmentName, description]);
      const deptEmployees = [];
      for (const [role, goal] of employees) {
        const employeeId = randomUUID();
        const policy = { industryPack: pack, departmentId, approvalMode: role.includes('مراجع') || role.includes('موافقة') ? 'required' : 'required', sensitiveActionsRequireApproval: true };
        const skills = [role, 'تحليل البيانات', 'إدارة المهام', 'التعاون بين الأقسام'];
        await client.query(`insert into public.ai_employees (id,workspace_id,name,role,goal,skills,tools,permissions,memory_config,model,budget_cents,schedule,status,policy)
          values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12::jsonb,$13,$14::jsonb)`, [
          employeeId, workspaceId, role, role, goal, JSON.stringify(skills), JSON.stringify(DEFAULT_TOOLS), JSON.stringify(DEFAULT_PERMISSIONS), JSON.stringify({ enabled: true, retentionDays: 365 }), 'default', 5000,
          JSON.stringify({ type: 'always', timezone: 'UTC' }), 'active', JSON.stringify(policy),
        ]);
        const goalId = randomUUID();
        await client.query(`insert into public.employee_goals(id,workspace_id,employee_id,title,target,current_value,unit,period,status) values($1,$2,$3,$4,$5,0,$6,$7,'active')`, [goalId, workspaceId, employeeId, 'تحقيق الهدف التشغيلي للدور', 100, 'نسبة', 'شهري']);
        await client.query(`insert into public.employee_knowledge(id,workspace_id,employee_id,title,content,source,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)`, [randomUUID(), workspaceId, employeeId, 'تعريف الدور', `أنت موظف رقمي في إنجاز. دورك: ${role}. هدفك الأساسي: ${goal}. اعمل ضمن الصلاحيات الممنوحة، واطلب موافقة بشرية قبل أي إجراء حساس أو خارجي.`, 'ENJAZ industry pack', JSON.stringify({ industryPack: pack, departmentId })]);
        deptEmployees.push(employeeId);
        createdEmployees.push({ id: employeeId, name: role, departmentId });
      }
      const managerId = deptEmployees[0];
      await client.query('update public.departments set manager_employee_id=$1,updated_at=now() where id=$2 and workspace_id=$3', [managerId, departmentId, workspaceId]);
      createdDepartments.push({ id: departmentId, name: departmentName, managerEmployeeId: managerId });
    }

    await client.query(`insert into public.audit_events(id,workspace_id,employee_id,event_type,actor_type,action,metadata)
      values($1,$2,$3,$4,$5,$6,$7::jsonb)`, [randomUUID(), workspaceId, createdEmployees[0]?.id || null, 'industry.pack.provisioned', 'user', 'industry.provision', JSON.stringify({ pack, actorUserId, employees: createdEmployees.length, departments: createdDepartments.length })]);

    return { created: true, pack, label: template.label, employees: createdEmployees.length, departments: createdDepartments.length, createdDepartments, createdEmployees };
  });
}
