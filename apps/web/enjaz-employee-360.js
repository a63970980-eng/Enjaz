import {apiClient} from './api-client.js';

const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const workspaceId=()=>window.ENJAZ_WORKSPACE_ID||'';
const token=()=>window.ENJAZ_ACCESS_TOKEN||'';
const asList=v=>Array.isArray(v)?v:(v&&Array.isArray(v.data)?v.data:[]);
const label=v=>v==null||v===''?'—':esc(v);

function employeeFromCard(card){return {id:card?.dataset?.employeeId||card?.querySelector('[data-employee-id]')?.dataset?.employeeId||'',name:card?.querySelector('h3')?.textContent||'موظف رقمي',role:card?.querySelector('p')?.textContent||'موظف عمليات',avatar:card?.querySelector('.avatar')?.textContent||'م'};}
function row(title,value,meta=''){return `<div class="e360-row"><div><strong>${label(title)}</strong>${meta?`<small>${label(meta)}</small>`:''}</div><span>${label(value)}</span></div>`;}
function list(items,empty='لا توجد بيانات'){return items.length?`<div class="e360-list">${items.map(x=>`<div class="e360-list-item">${typeof x==='string'?label(x):`<strong>${label(x.name||x.title||x.label||x.key||'عنصر')}</strong><small>${label(x.description||x.status||x.value||x.type||'')}</small>`}</div>`).join('')}</div>`:`<div class="e360-empty">${empty}</div>`;}

async function openEmployee(card){
  if(document.querySelector('.employee360-modal'))return;
  const seed=employeeFromCard(card); if(!seed.id)return;
  const modal=document.createElement('div'); modal.className='employee360-modal';
  modal.innerHTML=`<div class="employee360-backdrop"></div><section class="employee360" role="dialog" aria-modal="true" aria-labelledby="e360-title"><header><div class="e360-identity"><span class="e360-avatar">${label(seed.avatar)}</span><div><span class="e360-eyebrow">DIGITAL EMPLOYEE / 360</span><h2 id="e360-title">${label(seed.name)}</h2><p>${label(seed.role)}</p></div><span class="e360-online">● متصل</span></div><button class="e360-close" aria-label="إغلاق">×</button></header><nav class="e360-tabs" role="tablist">${['overview:نظرة عامة','tasks:المهام','skills:المهارات','tools:الأدوات','memory:الذاكرة','permissions:الصلاحيات','goals:الأهداف','activity:النشاط'].map((x,i)=>{const [id,text]=x.split(':');return `<button role="tab" data-tab="${id}" class="${i===0?'active':''}">${text}</button>`}).join('')}</nav><div class="e360-body"><main class="e360-main"><div class="e360-loading">جارٍ تحميل بيانات الموظف…</div></main><aside class="e360-side"><div class="e360-side-card"><span>CONTROL</span><h3>حالة التشغيل</h3><div class="e360-control-state">جارٍ التحقق…</div><button class="ghost e360-refresh">تحديث البيانات</button></div><div class="e360-side-card"><span>DATA SOURCE</span><h3>مصدر البيانات</h3><p>بيانات الموظف والمهام والنشاط تُقرأ من مساحة العمل الحالية عبر API.</p></div></aside></div></section>`;
  document.body.appendChild(modal);
  const close=()=>modal.remove(); modal.querySelector('.e360-close').onclick=close; modal.querySelector('.e360-backdrop').onclick=close;
  let employee=null, tasks=[], approvals=[], audit=[], integrations=[], tools=[];
  async function load(){
    const main=modal.querySelector('.e360-main'); main.innerHTML='<div class="e360-loading">جارٍ تحميل بيانات الموظف…</div>';
    try{
      const [e,t,a,i,tool] = await Promise.all([
        apiClient.getEmployee(workspaceId(),token(),seed.id),
        apiClient.tasks(workspaceId(),token()),
        apiClient.approvals(workspaceId(),token()),
        apiClient.integrations(workspaceId(),token()),
        apiClient.tools(workspaceId(),token())
      ]);
      employee=e.data||e; tasks=asList(t).filter(x=>x.employee_id===seed.id); approvals=asList(a); integrations=asList(i); tools=asList(tool); audit=asList(window.__ENJAZ_STATE?.audit||[]);
      renderTab(modal.querySelector('[data-tab].active')?.dataset.tab||'overview');
      modal.querySelector('.e360-control-state').textContent=employee.status||'active';
    }catch(err){main.innerHTML=`<div class="e360-error"><strong>تعذر تحميل بيانات الموظف</strong><p>${label(err.message||'حدث خطأ غير متوقع')}</p><button class="ghost e360-retry">إعادة المحاولة</button></div>`;modal.querySelector('.e360-retry').onclick=load;}
  }
  function renderTab(tab){
    const main=modal.querySelector('.e360-main');
    const skills=asList(employee?.skills||employee?.capabilities), employeeTools=asList(employee?.tools), memory=asList(employee?.memory||employee?.knowledge), permissions=asList(employee?.permissions), goals=asList(employee?.goals), activity=audit.filter(x=>x.employee_id===seed.id||x.entity_id===seed.id);
    if(tab==='overview') main.innerHTML=`<div class="e360-kpis">${row('الحالة',employee?.status||'active')}${row('المهام',tasks.length)}${row('المهام المكتملة',tasks.filter(x=>['completed','done','success'].includes(String(x.status).toLowerCase())).length)}${row('آخر تحديث',employee?.updated_at?new Date(employee.updated_at).toLocaleString('ar'): '—')}</div><section class="e360-panel"><div class="e360-head"><div><span>IDENTITY</span><h3>ملف الموظف</h3></div></div>${row('الاسم',employee?.name||seed.name)}${row('الدور',employee?.role||seed.role)}${row('الوصف',employee?.description||'—')}</section><section class="e360-panel"><div class="e360-head"><div><span>EXECUTION</span><h3>المهام الحالية</h3></div></div>${list(tasks.slice(0,5),'لا توجد مهام مسندة لهذا الموظف.')}</section>`;
    else if(tab==='tasks') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>EXECUTION</span><h3>مهام الموظف</h3><p>${tasks.length} مهمة مرتبطة فعليًا بالموظف.</p></div></div>${list(tasks,'لا توجد مهام مسندة لهذا الموظف.')}</section>`;
    else if(tab==='skills') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>CAPABILITIES</span><h3>المهارات</h3></div></div>${list(skills,'لم تُعرّف مهارات لهذا الموظف بعد.')}</section>`;
    else if(tab==='tools') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>TOOLS</span><h3>الأدوات والتكاملات</h3></div></div>${list(employeeTools.length?employeeTools:tools,'لا توجد أدوات مرتبطة بهذا الموظف.')}${integrations.length?`<h4 class="e360-subhead">التكاملات المتاحة في مساحة العمل</h4>${list(integrations)}`:''}</section>`;
    else if(tab==='memory') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>KNOWLEDGE</span><h3>الذاكرة والمعرفة</h3></div></div>${list(memory,'لا توجد ذاكرة أو معرفة مهيأة لهذا الموظف بعد.')}</section>`;
    else if(tab==='permissions') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>GOVERNANCE</span><h3>الصلاحيات</h3></div></div>${list(permissions,'لم تُسجل صلاحيات خاصة لهذا الموظف.')}<div class="e360-note">الصلاحيات الفعلية يجب أن يفرضها backend وRLS؛ هذه الصفحة لا تمنح صلاحيات من الواجهة.</div></section>`;
    else if(tab==='goals') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>OUTCOMES</span><h3>الأهداف</h3></div></div>${list(goals,'لا توجد أهداف محفوظة لهذا الموظف بعد.')}</section>`;
    else if(tab==='activity') main.innerHTML=`<section class="e360-panel"><div class="e360-head"><div><span>AUDIT</span><h3>النشاط والتدقيق</h3></div></div>${list(activity.map(x=>({name:x.action||x.event_type||'نشاط',description:x.created_at?new Date(x.created_at).toLocaleString('ar'):''})),'لا يوجد نشاط مسجل لهذا الموظف.')}</section>`;
  }
  modal.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{modal.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTab(b.dataset.tab);});
  modal.querySelector('.e360-refresh').onclick=load;
  await load();
}

export function employee360(){
  const root=document.getElementById('content'); if(!root)return;
  if(root.dataset.e360Bound==='1')return; root.dataset.e360Bound='1';
  root.addEventListener('click',e=>{const card=e.target.closest('.employee-card');if(card&&!e.target.closest('button,a,[data-action]'))openEmployee(card);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',employee360);else employee360();
