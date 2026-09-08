import { randomUUID } from 'node:crypto';
import { withTransaction } from './db.js';

const PACKS={
 hospital:{label:'المستشفيات',departments:[['الإدارة التنفيذية','قيادة المستشفى والقرارات',['مدير المستشفى','مساعد مدير المستشفى']],['العمليات والاستقبال','تشغيل اليوم والمواعيد والاستقبال',['مدير العمليات','موظف الاستقبال','منسق المواعيد']],['المرضى والتأمين والجودة','تجربة المرضى والتأمين والجودة',['مسؤول خدمة المرضى','موظف مطالبات وتأمين','مسؤول الجودة']],['المالية والموارد البشرية','المالية والقوى العاملة',['محلل مالي','موظف موارد بشرية']],['المشتريات والمخزون والتحليل','الإمداد والتحليل التشغيلي',['موظف مشتريات','مسؤول مخزون طبي','محلل عمليات']]]},
 restaurant:{label:'المطاعم',departments:[['الإدارة والتشغيل','قيادة الفروع والأداء',['مدير مطعم','مدير فروع']],['الاستقبال وخدمة العملاء','الحجوزات والطلبات وتجربة العميل',['موظف استقبال وحجوزات','موظف خدمة العملاء','منسق الطلبات والتوصيل']],['المشتريات والمخزون','التوريد والمخزون وتقليل الهدر',['موظف المشتريات','موظف المخزون']],['المالية والموارد البشرية','المالية والقوى العاملة',['المحاسب','موظف الموارد البشرية']],['التسويق والجودة','النمو والجودة وسلامة الغذاء',['مسؤول التسويق','مسؤول مراقبة الجودة','محلل أداء المطاعم']]]},
 hotel:{label:'الفنادق',departments:[['الإدارة والتشغيل','قيادة الفندق والتشغيل',['مدير فندق','مدير عمليات']],['الحجوزات والاستقبال','الحجوزات والوصول والمغادرة',['موظف حجوزات','موظف استقبال','موظف خدمة النزلاء']],['الإشغال والتدبير والصيانة','الإشغال وجاهزية الغرف والصيانة',['مدير الإشغال','مدير التدبير الفندقي','منسق الصيانة']],['المشتريات والمخزون','الإمداد والتوريد',['مسؤول المشتريات','مسؤول المخزون']],['المالية والموارد البشرية والتسويق','الإيرادات والقوى العاملة والنمو',['مسؤول المالية','مسؤول الموارد البشرية','مسؤول التسويق']]]},
 enterprise:{label:'الشركات',departments:[['الإدارة التنفيذية','الاستراتيجية ودعم القيادة',['CEO Assistant','المحلل التنفيذي']],['العمليات والمشاريع','التشغيل وإدارة المشاريع',['مدير عمليات','Project Manager']],['المبيعات ونجاح العملاء','الإيرادات والعملاء',['Sales Manager','Customer Success']],['التسويق والبيانات','النمو والتحليل',['Marketing Manager','Data Analyst']],['الوظائف المؤسسية','المالية والموارد البشرية والمشتريات والقانون',['Finance Manager','HR Manager','Procurement Manager','Legal Operations']]]},
 government:{label:'الجهات الحكومية',departments:[['الخدمات والمعاملات','الخدمات المقدمة للمستفيدين',['موظف خدمات','موظف معاملات']],['الموارد البشرية والمشتريات','الدعم المؤسسي',['موظف موارد بشرية','موظف مشتريات']],['البيانات والمتابعة','القياس والمتابعة',['محلل بيانات','مسؤول متابعة','محلل التقارير الحكومية']],['الشكاوى والجودة','تجربة المستفيد والجودة',['مسؤول شكاوى','مسؤول جودة']],['العمليات والتدقيق','التشغيل والرقابة',['مدير عمليات','موظف تدقيق ومراجعة','محلل أداء الجهة']]]}
};

const roleSkills={
 'مدير المستشفى':['قيادة التشغيل','تحليل الأداء','إدارة المخاطر'],'مدير مطعم':['إدارة الفروع','تحليل المبيعات','تحسين التشغيل'],'مدير فندق':['إدارة الضيافة','الإشغال','الجودة'],
 'CEO Assistant':['إدارة الأولويات','التقارير التنفيذية','تنسيق الاجتماعات'],'المحلل التنفيذي':['تحليل المؤشرات','التقارير التنفيذية','دعم القرار'],'مدير عمليات':['تصميم الإجراءات','إدارة الأولويات','تحسين الأداء'],'Project Manager':['تخطيط المشاريع','إدارة الاعتماديات','إدارة المخاطر'],'Data Analyst':['تحليل البيانات','المؤشرات','استخراج الرؤى'],'Legal Operations':['إدارة العمليات القانونية','المستندات','المتابعة'],
 'موظف مطالبات وتأمين':['معالجة المطالبات','التحقق من المستندات','متابعة التأمين'],'مسؤول مراقبة الجودة':['التدقيق التشغيلي','مؤشرات الجودة','الإجراءات التصحيحية'],'موظف تدقيق ومراجعة':['المراجعة','الامتثال','التدقيق'],'محلل أداء المطاعم':['تحليل المبيعات','مؤشرات الفروع','تقارير الأداء'],'محلل أداء الجهة':['تحليل الأداء الحكومي','المؤشرات','التقارير'],'محلل التقارير الحكومية':['تحليل التقارير','المؤشرات','التدقيق']
};

const roleMission={
 'مدير المستشفى':'قيادة التشغيل اليومي للمستشفى وتحسين سلامة المرضى وجودة الخدمة وكفاءة الموارد.',
 'مدير مطعم':'رفع أداء المطعم والفروع وتحسين تجربة العميل والمبيعات وتقليل الهدر.',
 'مدير فندق':'تعظيم جودة الضيافة والإشغال وكفاءة التشغيل وتجربة النزيل.',
 'CEO Assistant':'دعم القيادة التنفيذية بالأولويات والملخصات والمتابعة والتنسيق المنظم.',
 'المحلل التنفيذي':'تحويل بيانات المؤسسة إلى مؤشرات ورؤى وتوصيات قابلة للقرار.',
 'مدير عمليات':'تحسين العمليات، كشف الاختناقات، ومتابعة التنفيذ بين الفرق.',
 'Project Manager':'تخطيط المشاريع ومتابعة الاعتماديات والمخاطر والمخرجات حتى الإغلاق.',
 'Data Analyst':'تحليل البيانات واكتشاف الاتجاهات والانحرافات وبناء تقارير دقيقة.',
 'Legal Operations':'تنظيم العمليات القانونية والمستندات والمتابعات مع الالتزام بالصلاحيات.',
 'موظف مطالبات وتأمين':'مراجعة المطالبات والتحقق من اكتمال المستندات ومتابعة الحالات وفق السياسة.',
 'مسؤول مراقبة الجودة':'مراقبة مؤشرات الجودة واكتشاف الانحرافات واقتراح الإجراءات التصحيحية.',
 'موظف تدقيق ومراجعة':'تنفيذ المراجعات والتحقق من الامتثال وتوثيق الملاحظات والأدلة.',
 'محلل أداء المطاعم':'تحليل أداء المبيعات والفروع وتحويل النتائج إلى توصيات تشغيلية.',
 'محلل أداء الجهة':'قياس أداء الجهة ومتابعة المؤشرات والتباينات والتقارير الإدارية.',
 'محلل التقارير الحكومية':'إعداد وتحليل التقارير الحكومية والتحقق من الاتساق والمؤشرات.'
};

const defaultSkills=['إدارة المهام','إعداد التقارير','التعاون بين الأقسام'];
const defaultTools=['data.analyze','report.create','task.comment','task.handoff'];
const defaultPermissions=['read_workspace','read_tasks','create_tasks','read_knowledge','write_knowledge','read_reports'];
const sensitive=r=>/مالية|مشتريات|تدقيق|مراجعة|جودة|موارد بشرية|تأمين|Legal|Finance|Procurement|HR/.test(r);

function profileFor(role,pack,departmentId){
 const skills=[...new Set([...(roleSkills[role]||[role,'إدارة الإجراءات','قياس الأداء']),...defaultSkills])];
 const mission=roleMission[role]||`تنفيذ مسؤوليات ${role} بكفاءة ووفق سياسات المؤسسة وتحقيق نتائج قابلة للقياس.`;
 const supervised=sensitive(role)||/مدير|CEO|Project Manager|Legal/.test(role);
 return {
  goal:mission,
  skills,
  tools:defaultTools,
  permissions:defaultPermissions,
  policy:{industryPack:pack,departmentId,readyTemplate:true,autonomy:supervised?'supervised':'balanced',approvalMode:'required',sensitiveActionsRequireApproval:true,decisionPrinciples:['التزم بالدور والصلاحيات','تحقق من البيانات قبل القرار','وثّق النتيجة','صعّد المخاطر أو الغموض إلى المدير']},
  knowledge:[
   `المهمة الأساسية: ${mission}`,
   `مسؤوليات الدور: ${skills.join('، ')}.`,
   'طريقة العمل: افهم الهدف، حلله إلى خطوات قابلة للتنفيذ، استخدم الأدوات المسموح بها فقط، وثّق النتيجة، ونسّق مع الموظف المناسب عند الحاجة.',
   'الحوكمة: لا تنفذ إجراءً ماليًا أو حذفًا أو شراءً أو مراسلة جماعية أو أي إجراء عالي المخاطر دون موافقة بشرية.'
  ]
 };
}

export function listIndustryPacks(){return Object.entries(PACKS).map(([id,p])=>({id,label:p.label,departments:p.departments.length,employees:p.departments.reduce((n,d)=>n+d[2].length,0)}));}

export async function provisionIndustryPack({workspaceId,pack,actorUserId}){
 const template=PACKS[pack];if(!template)throw Object.assign(new Error(`Unknown industry pack: ${pack}`),{status:400});
 return withTransaction(async client=>{
  const existing=await client.query("select id from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2 limit 1",[workspaceId,pack]);
  if(existing.rowCount){const c=await client.query("select count(*)::int employees from public.ai_employees where workspace_id=$1 and policy->>'industryPack'=$2",[workspaceId,pack]);const d=await client.query("select count(*)::int departments from public.departments where workspace_id=$1 and description like $2",[workspaceId,`${template.label} —%`]);return{created:false,pack,label:template.label,employees:c.rows[0].employees,departments:d.rows[0].departments,existingEmployeeId:existing.rows[0].id};}
  await client.query("insert into public.workspace_profiles(workspace_id,sector,industry,operating_model,onboarding_stage,settings,updated_at) values($1,$2,$3,'digital_workforce','ready',$4::jsonb,now()) on conflict(workspace_id) do update set sector=excluded.sector,industry=excluded.industry,onboarding_stage='ready',settings=public.workspace_profiles.settings||excluded.settings,updated_at=now()",[workspaceId,pack,template.label,JSON.stringify({readyWorkforce:true,governance:'approval-gated',catalogVersion:'2026.09',operatingPrinciples:['role-first','least-privilege','audit-every-action','human-approval-for-risk']})]);
  const createdDepartments=[],createdEmployees=[];
  for(const [departmentName,description,roles] of template.departments){const departmentId=randomUUID();await client.query('insert into public.departments(id,workspace_id,name,description) values($1,$2,$3,$4)',[departmentId,workspaceId,departmentName,`${template.label} — ${description}`]);const ids=[];
   for(const role of roles){const id=randomUUID(),profile=profileFor(role,pack,departmentId);
    await client.query(`insert into public.ai_employees(id,workspace_id,name,role,goal,skills,tools,permissions,memory_config,model,budget_cents,schedule,status,policy) values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12::jsonb,$13,$14::jsonb)`,[id,workspaceId,role,role,profile.goal,JSON.stringify(profile.skills),JSON.stringify(profile.tools),JSON.stringify(profile.permissions),JSON.stringify({enabled:true,retentionDays:365,contextScope:'workspace',memoryTypes:['facts','decisions','preferences','task_results']}),'default',5000,JSON.stringify({type:'always',timezone:'UTC'}),'active',JSON.stringify(profile.policy)]);
    await client.query(`insert into public.employee_goals(id,workspace_id,employee_id,title,target,current_value,unit,period,status) values($1,$2,$3,$4,$5,0,$6,$7,'active')`,[randomUUID(),workspaceId,id,`مؤشر أداء ${role}`,100,'نسبة','شهري']);
    await client.query(`insert into public.employee_knowledge(id,workspace_id,employee_id,title,content,source,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,[randomUUID(),workspaceId,id,'دليل الدور',profile.knowledge.join('\n'),'ENJAZ ready workforce catalog',JSON.stringify({industryPack:pack,departmentId,readyTemplate:true,role,mission:profile.goal})]);
    ids.push(id);createdEmployees.push({id,name:role,departmentId});
   }
   await client.query('update public.departments set manager_employee_id=$1,updated_at=now() where id=$2 and workspace_id=$3',[ids[0],departmentId,workspaceId]);createdDepartments.push({id:departmentId,name:departmentName,managerEmployeeId:ids[0]});
  }
  await client.query(`insert into public.audit_events(id,workspace_id,employee_id,event_type,actor_type,action,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,[randomUUID(),workspaceId,createdEmployees[0]?.id||null,'industry.pack.provisioned','user','industry.provision',JSON.stringify({pack,actorUserId,employees:createdEmployees.length,departments:createdDepartments.length,readyTemplates:true,operatingSystem:'digital_workforce',roleAware:true})]);
  return{created:true,pack,label:template.label,employees:createdEmployees.length,departments:createdDepartments.length,createdDepartments,createdEmployees};
 });
}
