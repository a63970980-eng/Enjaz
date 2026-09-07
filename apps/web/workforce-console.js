import {apiClient} from './api-client.js';

const WORKSPACE_ID = window.ENJAZ_WORKSPACE_ID || '';
const TOKEN = window.ENJAZ_ACCESS_TOKEN || '';
const app = document.querySelector('#content');
const sectors = { restaurant:['🍽️','المطاعم'], hospital:['🏥','المستشفيات'], hotel:['🏨','الفنادق'], enterprise:['🏢','الشركات'], government:['🏛️','الجهات الحكومية'] };
const nav = [['home','الرئيسية'],['library','مكتبة الموظفين'],['workforce','قوة العمل'],['tasks','المهام والتنفيذ'],['approvals','الموافقات'],['integrations','التكاملات'],['audit','سجل العمليات']];
const state = {page:'home', sector:null, employees:[], templates:[], tasks:[], approvals:[], integrations:[], audit:[], busy:false, message:'', error:''};
const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const status = x => ({pending:'قيد الانتظار',queued:'في قائمة التنفيذ',running:'قيد التنفيذ',waiting_approval:'بانتظار الموافقة',completed:'مكتملة',failed:'فشلت',cancelled:'ملغاة',active:'نشط',paused:'متوقف',disabled:'معطل'}[x] || x || '—');
const resultData = r => Array.isArray(r?.data) ? r.data : [];

async function load(){
  state.error='';
  const jobs = await Promise.allSettled([
    apiClient.employees(WORKSPACE_ID,TOKEN), apiClient.tasks(WORKSPACE_ID,TOKEN),
    apiClient.approvals(WORKSPACE_ID,TOKEN), apiClient.integrations(WORKSPACE_ID,TOKEN), apiClient.audit(WORKSPACE_ID,TOKEN),
    apiClient.industryPacks(WORKSPACE_ID,TOKEN)
  ]);
  const [e,t,a,i,u,p] = jobs;
  state.employees = e.status==='fulfilled' ? resultData(e.value) : [];
  state.tasks = t.status==='fulfilled' ? resultData(t.value) : [];
  state.approvals = a.status==='fulfilled' ? resultData(a.value) : [];
  state.integrations = i.status==='fulfilled' ? resultData(i.value) : [];
  state.audit = u.status==='fulfilled' ? resultData(u.value) : [];
  state.templates = p.status==='fulfilled' ? resultData(p.value?.templates ? {data:p.value.templates} : p.value) : [];
  const failures = jobs.filter(x=>x.status==='rejected');
  if(failures.length && !state.employees.length && !WORKSPACE_ID) state.error='مساحة العمل غير متصلة. سجّل الدخول لبدء العمل.';
  render();
}
function templates(){ return state.templates.map(x=>({...x,key:`${x.sector}:${x.name}`,sector_label:x.sector_label||sectors[x.sector]?.[1]})); }
function deployed(){ return new Set(state.employees.map(e=>e.catalog_key).filter(Boolean)); }
async function activate(item){
  if(!WORKSPACE_ID){state.error='لا يمكن تفعيل موظف بدون مساحة عمل مصادق عليها.';render();return;}
  if(deployed().has(item.key)){state.message='هذا الموظف مفعّل بالفعل.';render();return;}
  state.busy=true;state.error='';render();
  try{
    const body={name:item.name,role:item.name,goal:item.default_goal||`إدارة وتنفيذ مسؤوليات ${item.name}`,sector:item.sector,autonomy:item.autonomy||'balanced',skills:item.skills||[],tools:item.tools||[],budgetCents:item.default_budget_cents||0,schedule:{type:'always'},policy:{approvalMode:'required'},catalog_key:item.key};
    await apiClient.createEmployee(WORKSPACE_ID,TOKEN,body);
    state.message=`تم تفعيل ${item.name} داخل قوة العمل.`; await load();
  }catch(e){state.error=e.message||'تعذر تفعيل الموظف.';state.busy=false;render();}
}
async function createTask(employeeId){
  const title=prompt('عنوان المهمة'); if(!title?.trim())return;
  const objective=prompt('ما الهدف الذي تريد من الموظف تنفيذه؟',title); if(!objective?.trim())return;
  state.busy=true;state.error='';render();
  try{await apiClient.createTask(WORKSPACE_ID,TOKEN,{employeeId,title:title.trim(),objective:objective.trim(),priority:2,input:{source:'enjaz-console'}});state.message='تم إنشاء المهمة وإسنادها للموظف.';await load();state.page='tasks';render();}
  catch(e){state.error=e.message||'تعذر إنشاء المهمة.';state.busy=false;render();}
}
async function runTask(id){state.busy=true;state.error='';render();try{const r=await apiClient.runTask(WORKSPACE_ID,TOKEN,id,{});state.message=r?.message||'تم إرسال المهمة إلى محرك التنفيذ.';await load();}catch(e){state.error=e.message||'تعذر تشغيل المهمة.';state.busy=false;render();}}
async function cancelTask(id){if(!confirm('إلغاء هذه المهمة؟'))return;state.busy=true;render();try{await apiClient.cancelTask(WORKSPACE_ID,TOKEN,id);state.message='تم إلغاء المهمة.';await load();}catch(e){state.error=e.message;state.busy=false;render();}}
async function decide(id,d){state.busy=true;render();try{await apiClient.decideApproval(WORKSPACE_ID,TOKEN,id,d);state.message=d==='approve'?'تمت الموافقة على العملية.':'تم رفض العملية.';await load();}catch(e){state.error=e.message;state.busy=false;render();}}
async function employeeAction(id,action){state.busy=true;render();try{await apiClient.employeeStatus(WORKSPACE_ID,TOKEN,id,action);state.message=action==='activate'?'تم تشغيل الموظف.':action==='pause'?'تم إيقاف الموظف مؤقتًا.':'تم تعطيل الموظف.';await load();}catch(e){state.error=e.message;state.busy=false;render();}}
function shell(body){
  app.innerHTML=`<div class="enjaz"><aside><div class="brand"><b>إ</b><strong>إنجاز</strong><small>AI DIGITAL WORKFORCE</small></div><nav>${nav.map(n=>`<button class="${state.page===n[0]?'active':''}" data-page="${n[0]}">${n[1]}</button>`).join('')}</nav><footer><b>مساحة العمل</b>${WORKSPACE_ID?'متصلة':'غير متصلة'}<br>● ${WORKSPACE_ID?'النظام جاهز':'يلزم تسجيل الدخول'}</footer></aside><main><header><span>إنجاز / ${nav.find(n=>n[0]===state.page)?.[1]||'الرئيسية'}</span><span><i>إ</i></span></header>${state.message?`<div class="toast">${esc(state.message)}</div>`:''}${state.error?`<div class="toast">${esc(state.error)}</div>`:''}${body}</main></div>`;bind();
}
function home(){const t=templates();return `<section class="hero"><small>ENJAZ WORKFORCE OS</small><h1>قوة عمل رقمية <em>جاهزة لمؤسستك</em></h1><p>اختر موظفًا متخصصًا، فعّله داخل مساحة عملك، ثم أسند له العمل ضمن الصلاحيات والموافقات وسجل التدقيق.</p><button data-page="library">استكشف مكتبة الموظفين</button></section><section class="stats"><div><small>موظفون جاهزون</small><b>${t.length}</b></div><div><small>موظفون مفعّلون</small><b>${state.employees.length}</b></div><div><small>مهام مفتوحة</small><b>${state.tasks.filter(x=>!['completed','failed','cancelled'].includes(x.status)).length}</b></div><div><small>موافقات معلقة</small><b>${state.approvals.filter(x=>x.status==='pending').length}</b></div></section><h2>قطاعات إنجاز</h2><section class="sectors">${Object.entries(sectors).map(([k,v])=>`<button data-sector="${k}" data-page="library"><i>${v[0]}</i><b>${v[1]}</b><small>موظفون متخصصون جاهزون</small></button>`).join('')}</section><div class="promise"><b>موظف رقمي، وليس روبوت محادثة</b><span>دور واضح · مهارات · أدوات · ذاكرة · صلاحيات · أهداف · تنفيذ · موافقات · سجل تدقيق</span></div></section>`}
function library(){const d=deployed(),all=templates(),list=state.sector?all.filter(x=>x.sector===state.sector):all;return `<section class="page"><small>EMPLOYEE MARKETPLACE</small><h1>مكتبة الموظفين الرقميين</h1><p>كتالوج حي من الخادم؛ لا توجد بيانات موظفين محلية وهمية.</p><div class="filters"><button class="${!state.sector?'selected':''}" data-sector="all">الكل</button>${Object.entries(sectors).map(([k,v])=>`<button class="${state.sector===k?'selected':''}" data-sector="${k}">${v[0]} ${v[1]}</button>`).join('')}</div><section class="employees">${list.map(x=>{const on=d.has(x.key);return `<article class="employee"><span class="icon">${sectors[x.sector]?.[0]||'◈'}</span><div class="grow"><b>${esc(x.name)}</b><small>${esc(x.sector_label||sectors[x.sector]?.[1]||'المؤسسة')} · موظف متخصص</small></div><label>${on?'مفعّل':'جاهز'}</label><p>${esc(x.description||'دور متخصص مصمم للعمل داخل أنظمة المؤسسة.')}</p><button data-deploy="${esc(x.key)}" ${on||state.busy?'disabled':''}>${on?'✓ الموظف مفعّل':state.busy?'جارٍ التفعيل…':'تفعيل الموظف'}</button></article>`}).join('')}</section></section>`}
function workforce(){return `<section class="page"><small>ACTIVE WORKFORCE</small><h1>قوة العمل الرقمية</h1><p>كل موظف هنا سجل حقيقي داخل مساحة العمل.</p>${state.employees.length?`<section class="employees">${state.employees.map(e=>`<article class="employee"><span class="icon">${sectors[e.sector]?.[0]||'◈'}</span><div class="grow"><b>${esc(e.name)}</b><small>${esc(e.role||'موظف رقمي')} · ${esc(e.sector_label||sectors[e.sector]?.[1]||'المؤسسة')}</small></div><label>${status(e.status)}</label><p>الهدف: ${esc(e.goal||'تنفيذ مسؤوليات الدور بكفاءة وحوكمة.')}</p><button data-task="${esc(e.id)}">إسناد مهمة</button>${e.status==='active'?`<button data-employee-action="${e.id}" data-action="pause">إيقاف</button>`:`<button data-employee-action="${e.id}" data-action="activate">تشغيل</button>`}</article>`).join('')}</section>`:'<div class="empty"><b>لا يوجد موظفون مفعّلون بعد</b><br>ابدأ من مكتبة الموظفين.</div>'}</section>`}
function tasks(){return `<section class="page"><small>EXECUTION CENTER</small><h1>المهام والتنفيذ</h1><p>المهمة تمر من الإسناد إلى التخطيط والتنفيذ ثم النتيجة أو الموافقة.</p>${state.tasks.length?`<div class="ops-list">${state.tasks.map(t=>`<article class="op"><div><b>${esc(t.title)}</b><small>${esc(t.objective)}</small></div><label>${status(t.status)}</label><span>أولوية ${esc(t.priority)}</span>${['pending','queued','failed'].includes(t.status)?`<button data-run="${t.id}" ${state.busy?'disabled':''}>تشغيل</button>`:''}${['pending','queued'].includes(t.status)?`<button data-cancel="${t.id}" ${state.busy?'disabled':''}>إلغاء</button>`:''}</article>`).join('')}</div>`:'<div class="empty"><b>لا توجد مهام بعد</b><br>اذهب إلى قوة العمل وأسند أول مهمة.</div>'}</section>`}
function approvals(){return `<section class="page"><small>HUMAN GOVERNANCE</small><h1>الموافقات</h1><p>العمليات الحساسة لا تتجاوز سياسة المؤسسة دون قرار بشري.</p>${state.approvals.length?`<div class="ops-list">${state.approvals.map(a=>`<article class="op"><div><b>${esc(a.action)}</b><small>${esc(a.reason||'طلب موافقة على إجراء من الموظف الرقمي')}</small></div><label>${status(a.status)}</label>${a.status==='pending'?`<button data-approve="${a.id}" data-decision="approve">موافقة</button><button data-approve="${a.id}" data-decision="reject">رفض</button>`:''}</article>`).join('')}</div>`:'<div class="empty"><b>لا توجد موافقات معلقة</b><br>سيطلب النظام موافقة بشرية عند الحاجة.</div>'}</section>`}
function integrations(){return `<section class="page"><small>CONNECTED SYSTEMS</small><h1>التكاملات</h1><p>الربط مع أنظمة المؤسسة يتم عبر الخادم وبصلاحيات قابلة للتدقيق.</p>${state.integrations.length?`<div class="ops-list">${state.integrations.map(x=>`<article class="op"><div><b>${esc(x.name||x.provider||'تكامل')}</b><small>${esc(x.provider||x.type||'')}</small></div><label>${status(x.status||'active')}</label></article>`).join('')}</div>`:'<div class="empty"><b>لا توجد تكاملات متصلة</b><br>يمكن إضافة التكاملات من واجهة الإدارة بعد المصادقة.</div>'}</section>`}
function audit(){return `<section class="page"><small>AUDIT TRAIL</small><h1>سجل العمليات</h1><p>الأحداث التشغيلية المرتبطة بمساحة العمل.</p>${state.audit.length?`<div class="ops-list">${state.audit.slice(0,100).map(x=>`<article class="op"><div><b>${esc(x.action||x.event_type||'حدث')}</b><small>${esc(x.created_at||'')}</small></div><span>${esc(x.status||'مسجل')}</span></article>`).join('')}</div>`:'<div class="empty"><b>لا توجد أحداث بعد</b></div>'}</section>`}
function render(){if(!app)return;const views={home,library,workforce,tasks,approvals,integrations,audit};shell(views[state.page]?.()||home());}
function bind(){
  app.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page; if(b.dataset.sector)state.sector=b.dataset.sector==='all'?null:b.dataset.sector;render();});
  app.querySelectorAll('[data-sector]').forEach(b=>b.onclick=()=>{state.sector=b.dataset.sector==='all'?null:b.dataset.sector;state.page='library';render();});
  app.querySelectorAll('[data-deploy]').forEach(b=>b.onclick=()=>{const item=templates().find(x=>x.key===b.dataset.deploy);if(item)activate(item);});
  app.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>createTask(b.dataset.task));
  app.querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>runTask(b.dataset.run));
  app.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>cancelTask(b.dataset.cancel));
  app.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>decide(b.dataset.approve,b.dataset.decision));
  app.querySelectorAll('[data-employee-action]').forEach(b=>b.onclick=()=>employeeAction(b.dataset.employeeAction,b.dataset.action));
}
load();
