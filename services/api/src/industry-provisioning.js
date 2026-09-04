import { randomUUID } from 'node:crypto';
import { withTransaction } from './db.js';

const PACKS = {
  hospital: { label: 'المستشفيات', departments: [
    ['الإدارة التنفيذية','قيادة المستشفى والقرارات',['مدير المستشفى','مساعد مدير المستشفى']],
    ['العمليات والاستقبال','تشغيل اليوم والمواعيد والاستقبال',['مدير العمليات','موظف الاستقبال','منسق المواعيد']],
    ['خدمة المرضى والجودة','تجربة المرضى والجودة والامتثال',['مسؤول خدمة المرضى','مسؤول الجودة والامتثال']],
    ['المالية والموارد البشرية','المالية والقوى العاملة',['محلل مالي','مدير الموارد البشرية']],
    ['المشتريات والمخزون والتحليل','الإمداد والتحليل التشغيلي',['مسؤول المشتريات','مسؤول المخزون الطبي','محلل عمليات المستشفى']],
  ]},
  restaurant: { label: 'المطاعم', departments: [
    ['الإدارة والتشغيل','قيادة الفروع والأداء',['مدير المطعم','مدير الفروع']],
    ['الاستقبال وخدمة العملاء','الحجوزات والطلبات وتجربة العميل',['موظف الاستقبال والحجوزات','موظف خدمة العملاء','منسق الطلبات والتوصيل']],
    ['المشتريات والمخزون','التوريد والمخزون وتقليل الهدر',['موظف المشتريات','موظف المخزون']],
    ['المالية والموارد البشرية','المالية والقوى العاملة',['المحاسب','موظف الموارد البشرية']],
    ['التسويق والجودة','النمو والجودة وسلامة الغذاء',['مسؤول التسويق','مسؤول مراقبة الجودة']],
  ]},
  hotel: { label: 'الفنادق', departments: [
    ['الإدارة والتشغيل','قيادة الفندق والتشغيل',['مدير الفندق','مدير العمليات']],
    ['الحجوزات والاستقبال','الحجوزات والوصول والمغادرة',['موظف الحجوزات','موظف الاستقبال','موظف خدمة النزلاء']],
    ['الإشغال والتدبير والصيانة','الإشغال وجاهزية الغرف والصيانة',['مدير الإشغال','مدير التدبير الفندقي','منسق الصيانة']],
    ['المشتريات والمخزون','الإمداد والتوريد',['مسؤول المشتريات','مسؤول المخزون']],
    ['المالية والموارد البشرية والتسويق','الإيرادات والقوى العاملة والنمو',['مسؤول المالية','مسؤول الموارد البشرية','مسؤول التسويق']],
  ]},
  enterprise: { label: 'الشركات', departments: [
    ['الإدارة التنفيذية','الاستراتيجية ودعم القيادة',['CEO Assistant','المحلل التنفيذي']],
    ['العمليات والمشاريع','التشغيل وإدارة المشاريع',['مدير العمليات','Project Manager']],
    ['المبيعات ونجاح العملاء','الإيرادات والعملاء',['Sales Manager','Customer Success']],
    ['التسويق والبيانات','النمو والتحليل',['Marketing Manager','Data Analyst']],
    ['المالية والموارد البشرية والمشتريات','الوظائف المؤسسية',['Finance Manager','HR Manager','Procurement Manager']],
  ]},
  government: { label: 'الجهات الحكومية', departments: [
    ['الخدمات والمعاملات','الخدمات المقدمة للمستفيدين',['موظف خدمات','موظف معاملات']],
    ['الموارد البشرية والمشتريات','الدعم المؤسسي',['موظف موارد بشرية','موظف مشتريات']],
    ['البيانات والمتابعة','القياس والمتابعة',['محلل بيانات','مسؤول متابعة']],
    ['الشكاوى والجودة','تجربة المستفيد والجودة',['مسؤول شكاوى','مسؤول جودة']],
    ['العمليات والتدقيق','التشغيل والرقابة',['مدير عمليات','موظف تدقيق ومراجعة']],
  ]},
};

const ROLE_PROFILES = {
  'مدير المستشفى':['قيادة التشغيل','تحليل الأداء','إدارة المخاطر'], 'مدير المطعم':['إدارة الفروع','تحسين التشغيل','تحليل المبيعات'], 'مدير الفندق':['إدارة الضيافة','تحسين الإشغال','إدارة الجودة'],
  'مدير العمليات':['تصميم الإجراءات','إدارة الأولويات','تحسين الأداء'], 'مدير الفروع':['إدارة الفروع','تحليل الأداء','حل الاختناقات'], 'مدير الإشغال':['التنبؤ بالطلب','إدارة الإشغال','التسعير'],
  'CEO Assistant':['إدارة الأولويات','إعداد التقارير','تنسيق الاجتماعات'], 'Project Manager':['تخطيط المشاريع','إدارة الاعتماديات','إدارة المخاطر'], 'Sales Manager':['إدارة الفرص','التنبؤ بالمبيعات','إدارة العملاء'], 'Customer Success':['إدارة العملاء','حل المشكلات','قياس الرضا'],
  'Marketing Manager':['إدارة الحملات','تحليل القنوات','إدارة المحتوى'], 'Data Analyst':['تحليل البيانات','لوحات المؤشرات','استخراج الرؤى'], 'Finance Manager':['التحليل المالي','التقارير','الموازنات'], 'HR Manager':['إدارة المواهب','التوظيف','تخطيط القوى العاملة'], 'Procurement Manager':['إدارة الموردين','طلبات الشراء','تحليل التكلفة'],
  'محلل مالي':['التحليل المالي','التقارير','التنبؤ'], 'محلل عمليات المستشفى':['تحليل العمليات','قياس الأداء','تحسين التدفق'], 'محلل بيانات':['تحليل البيانات','التقارير','جودة البيانات'],
};
const defaultSkills=['إدارة المهام','تحليل البيانات','التعاون بين الأقسام','إعداد التقارير'];
const defaultTools=['data.analyze','report.create','knowledge.search','task.manage'];
const defaultPermissions=['read_workspace','read_tasks','create_tasks','read_knowledge','write_knowledge'];
const roleProfile=(role)=>ROLE_PROFILES[role]||[role,'إدارة الإجراءات','قياس الأداء'];
const isSensitive=(role)=>/مالية|مشتريات|تدقيق|مراجعة|جودة|موارد بشرية|مدير المستشفى|مدير الفندق|CEO|Finance|Procurement|HR/.test(role);

export function listIndustryPacks(){return Object.entries(PACKS).map(([id,p])=>({id,label:p.label,departments:p.departments.length,employees:p.departments.reduce((n,d)=>n+d[2].length,0)}));}

export async function provisionIndustryPack({workspaceId,pack,actorUserId}){
  const template=PACKS[pack];
  if(!template) throw Object.assign(new Error(`Unknown industry pack: ${pack}`),{status:400});
  return withTransaction(async client=>{
    const existing=await client.query("select id from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2 limit 1",[workspaceId,pack]);
    if(existing.rowCount){
      const count=await client.query("select count(*)::int employees from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2",[workspaceId,pack]);
      const departments=await client.query("select count(*)::int departments from public.departments where workspace_id=$1 and description ilike $2",[workspaceId,`%${template.label}%`]);
      return {created:false,pack,label:template.label,employees:count.rows[0].employees,departments:departments.rows[0].departments,existingEmployeeId:existing.rows[0].id};
    }
    const createdDepartments=[],createdEmployees=[];
    for(const [departmentName,description,roles] of template.departments){
      const departmentId=randomUUID();
      await client.query('insert into public.departments(id,workspace_id,name,description) values($1,$2,$3,$4)',[departmentId,workspaceId,departmentName,`${template.label} — ${description}`]);
      const ids=[];
      for(const role of roles){
        const id=randomUUID(), sensitive=isSensitive(role), skills=[...new Set([...roleProfile(role),...defaultSkills])];
        const policy={industryPack:pack,departmentId,readyTemplate:true,autonomy:sensitive?'supervised':'balanced',approvalMode:sensitive?'required':'required',sensitiveActionsRequireApproval:true};
        await client.query(`insert into public.ai_employees(id,workspace_id,name,role,goal,skills,tools,permissions,memory_config,model,budget_cents,schedule,status,policy) values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12::jsonb,$13,$14::jsonb)`,[id,workspaceId,role,role,`تشغيل ${role} بكفاءة ووفق سياسات المؤسسة`,JSON.stringify(skills),JSON.stringify(defaultTools),JSON.stringify(defaultPermissions),JSON.stringify({enabled:true,retentionDays:365,contextScope:'workspace'}),'default',5000,JSON.stringify({type:'always',timezone:'UTC'}),'active',JSON.stringify(policy)]);
        await client.query(`insert into public.employee_goals(id,workspace_id,employee_id,title,target,current_value,unit,period,status) values($1,$2,$3,$4,$5,0,$6,$7,'active')`,[randomUUID(),workspaceId,id,`مؤشر أداء ${role}`,100,'نسبة','شهري']);
        await client.query(`insert into public.employee_knowledge(id,workspace_id,employee_id,title,content,source,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,[randomUUID(),workspaceId,id,'ملف الوظيفة',`أنت ${role} رقمي جاهز للعمل ضمن ${template.label}. مسؤولياتك: ${skills.join('، ')}. استخدم الأدوات المسموح بها، تعاون مع الأقسام الأخرى، ولا تنفذ إجراءً حساسًا أو خارجيًا دون الموافقة المطلوبة.`,'ENJAZ ready workforce catalog',JSON.stringify({industryPack:pack,departmentId,readyTemplate:true,role})]);
        ids.push(id);createdEmployees.push({id,name:role,departmentId});
      }
      await client.query('update public.departments set manager_employee_id=$1,updated_at=now() where id=$2 and workspace_id=$3',[ids[0],departmentId,workspaceId]);
      createdDepartments.push({id:departmentId,name:departmentName,managerEmployeeId:ids[0]});
    }
    await client.query(`insert into public.audit_events(id,workspace_id,employee_id,event_type,actor_type,action,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,[randomUUID(),workspaceId,createdEmployees[0]?.id||null,'industry.pack.provisioned','user','industry.provision',JSON.stringify({pack,actorUserId,employees:createdEmployees.length,departments:createdDepartments.length,readyTemplates:true})]);
    return {created:true,pack,label:template.label,employees:createdEmployees.length,departments:createdDepartments.length,createdDepartments,createdEmployees};
  });
}
