import {apiClient} from './api-client.js';
import {employeeForm,submitEmployee} from './employee-form.js';

const state={section:'dashboard',employees:[],tasks:[],approvals:[],audit:[],loading:false,error:null};
const $=s=>document.querySelector(s);
const navItems=[['dashboard','لوحة التحكم'],['employees','الموظفون الرقميون'],['tasks','المهام'],['teams','الفرق الذكية'],['workflows','سير العمل'],['approvals','الموافقات'],['integrations','التكاملات'],['audit','سجل التدقيق']];
const workspaceId=window.ENJAZ_WORKSPACE_ID||'';
const token=window.ENJAZ_ACCESS_TOKEN||'';

async function load(){
  if(!workspaceId||!token)return;
  state.loading=true;
  state.error=null;
  render();
  try{
    [state.employees,state.tasks,state.approvals,state.audit]=await Promise.all([
      apiClient.employees(workspaceId,token).then(x=>x.data||[]),
      apiClient.tasks(workspaceId,token).then(x=>x.data||[]),
      apiClient.approvals(workspaceId,token).then(x=>x.data||[]),
      apiClient.audit(workspaceId,token).then(x=>x.data||[])
    ]);
  }catch(e){state.error=e.message}
  finally{state.loading=false;render()}
}

function render(){
  const title=navItems.find(x=>x[0]===state.section)?.[1]||'لوحة التحكم';
  $('#content').innerHTML=state.section==='dashboard'?dashboard():state.section==='employees'?employeesPage():listPage(title);
  document.querySelectorAll('[data-nav]').forEach(b=>{
    b.classList.toggle('active',b.dataset.nav===state.section);
    b.onclick=()=>{state.section=b.dataset.nav;render()};
  });
  document.querySelectorAll('[data-action="employees"]').forEach(b=>b.onclick=()=>{state.section='employees';render()});
  document.querySelectorAll('[data-action="create-employee"]').forEach(b=>b.onclick=openEmployeeForm);
}

function dashboard(){return `<div class="hero"><div><div class="eyebrow">ENJAZ / AI WORKFORCE</div><h1>مركز قيادة القوى العاملة الرقمية</h1><p>${workspaceId&&token?'بيانات حقيقية من مساحة العمل':'وضع المعاينة — اربط مساحة العمل والمصادقة'}. أنشئ موظفين أذكياء، امنحهم الأدوات والصلاحيات، ودعهم ينجزون العمل مع بقاء القرار تحت سيطرتك.</p></div><button class="primary" data-action="employees">+ موظف جديد</button></div>${state.loading?'<div class="panel"><div class="empty"><h2>جارٍ تحميل البيانات…</h2></div></div>':''}${state.error?`<div class="error">${state.error}</div>`:''}<div class="stats"><div><span>الموظفون</span><b>${state.employees.length}</b><small>موظف رقمي</small></div><div><span>المهام</span><b>${state.tasks.length}</b><small>في مساحة العمل</small></div><div><span>الموافقات</span><b>${state.approvals.length}</b><small>تحتاج قرارًا</small></div><div><span>النشاط</span><b>${state.audit.length}</b><small>سجل تدقيق</small></div></div></div>`}

function employeesPage(){return `<div class="pagehead"><div><div class="eyebrow">ENJAZ WORKFORCE</div><h1>الموظفون الرقميون</h1><p>أنشئ موظف AI حقيقيًا بمهام وصلاحيات وميزانية واضحة.</p></div><button class="primary" data-action="create-employee">+ إنشاء موظف AI</button></div><div class="panel"><div class="rows">${state.employees.length?state.employees.map(x=>`<article><strong>${x.name||'موظف AI'}</strong><span>${x.role||''} ${x.status||''}</span></article>`).join(''):'<div class="empty"><div class="bigicon">✦</div><h2>ابدأ ببناء فريقك الرقمي</h2><p>أنشئ أول موظف AI وحدد دوره وهدفه وميزانيته.</p><button class="primary" data-action="create-employee">إنشاء أول موظف</button></div>'}</div></div>`}

function listPage(title){let items=state.section==='tasks'?state.tasks:state.section==='approvals'?state.approvals:state.section==='audit'?state.audit:[];return `<div class="pagehead"><div><div class="eyebrow">ENJAZ CONTROL CENTER</div><h1>${title}</h1><p>بيانات مساحة العمل الحالية.</p></div></div><div class="panel"><div class="rows">${items.length?items.map(x=>`<article><strong>${x.name||x.title||x.action||x.event_type||'سجل'}</strong><span>${x.status||x.created_at||''}</span></article>`).join(''):'<div class="empty"><div class="bigicon">✦</div><h2>لا توجد بيانات بعد</h2></div>'}</div></div>`}

function openEmployeeForm(){
  const el=document.createElement('div');
  el.className='modal';
  el.innerHTML=`<div class="modal-card"><header><h2>إنشاء موظف AI</h2><button class="ghost" id="close-modal" type="button">×</button></header>${employeeForm()}</div>`;
  document.body.appendChild(el);
  el.querySelector('#close-modal').onclick=()=>el.remove();
  el.querySelector('#cancel-employee').onclick=()=>el.remove();
  el.querySelector('#employee-form').onsubmit=async e=>{
    e.preventDefault();
    if(!workspaceId||!token)return alert('أضف بيانات المصادقة أولًا.');
    const submit=e.currentTarget.querySelector('button[type="submit"]');
    submit.disabled=true;
    try{
      await submitEmployee(e.currentTarget,{workspaceId,token,apiClient});
      el.remove();
      state.section='employees';
      await load();
    }catch(err){submit.disabled=false;alert(err.message)}
  };
}

render();
load();
