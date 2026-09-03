(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=s=>{const m=String(s||'').replace(/٪/g,'%').match(/[0-9]+(?:\.[0-9]+)?/);return m?Number(m[0]):0};
  const workspace=()=>window.ENJAZ_WORKSPACE_ID||'';
  const token=()=>window.ENJAZ_ACCESS_TOKEN||sessionStorage.getItem('ENJAZ_ACCESS_TOKEN')||'';
  const api=async path=>{const r=await fetch(path,{headers:{Authorization:`Bearer ${token()}`,'Content-Type':'application/json'}});if(!r.ok)throw new Error('runtime unavailable');return r.json()};
  let drawer;
  function metrics(grid){
    const cards=$$('.employee-card',grid);const active=cards.filter(c=>!$('.dot-status.off',c)).length;
    const assigned=cards.reduce((n,c)=>n+(Array.from($$('.employee-tags span',c)).map(x=>num(x.textContent)).find(v=>v>0)||0),0);
    const rates=cards.map(c=>{const bs=$$('.employee-metrics b',c);return bs.length?num(bs[bs.length-1].textContent):0}).filter(v=>v>0);
    return {cards,active,assigned,completion:rates.length?Math.round(rates.reduce((a,b)=>a+b,0)/rates.length):0};
  }
  function intelligence(grid){
    if($('.workforce-insights-runtime'))return;const m=metrics(grid),box=document.createElement('section');box.className='workforce-insights-runtime';
    box.innerHTML=`<div class="wir-head"><div><span class="wir-kicker">WORKFORCE INTELLIGENCE</span><h2>نبض القوة العاملة الرقمية</h2><p>صورة تشغيلية سريعة لفريقك قبل أن تدخل في التفاصيل.</p></div><span class="wir-live"><i></i> مباشر</span></div><div class="wir-metrics"><div><small>الموظفون</small><strong>${m.cards.length}</strong><span>${m.active} نشط الآن</span></div><div><small>المهام الموزعة</small><strong>${m.assigned}</strong><span>على الفريق الحالي</span></div><div><small>معدل الإنجاز</small><strong>${m.completion}%</strong><span>متوسط الفريق</span></div><div><small>جاهزية التشغيل</small><strong>${m.active===m.cards.length?'مستقرة':'تحتاج مراجعة'}</strong><span>${m.active===m.cards.length?'لا توجد حالات توقف':'تحقق من الموظفين المتوقفين'}</span></div></div>`;
    const toolbar=grid.previousElementSibling;toolbar?.after(box)||grid.before(box);
  }
  function makeDrawer(){
    if(drawer)return drawer;drawer=document.createElement('div');drawer.className='employee-drawer';drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML='<div class="employee-drawer-backdrop" data-close-drawer></div><aside class="employee-drawer-panel" role="dialog" aria-modal="true" aria-label="ملف الموظف الرقمي"><button class="drawer-close" type="button" data-close-drawer aria-label="إغلاق">×</button><div class="drawer-content"></div></aside>';
    document.body.append(drawer);$$('[data-close-drawer]',drawer).forEach(x=>x.addEventListener('click',closeDrawer));return drawer;
  }
  async function liveEmployee(card,employeeId){
    if(!workspace()||!token()||!employeeId)return null;
    const [tasksRes,approvalsRes,summaryRes]=await Promise.all([api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspace())}`),api(`/api/v1/approvals?workspaceId=${encodeURIComponent(workspace())}`),api(`/api/v1/runtime/summary?workspaceId=${encodeURIComponent(workspace())}`)]);
    const tasks=(tasksRes.data||[]).filter(t=>t.employee_id===employeeId);const approvals=(approvalsRes.data||[]).filter(a=>a.employee_id===employeeId||a.task?.employee_id===employeeId);
    const done=tasks.filter(t=>['completed','done','success'].includes(String(t.status||'').toLowerCase())).length;
    const running=tasks.filter(t=>['running','in_progress','processing'].includes(String(t.status||'').toLowerCase())).length;
    const queued=tasks.filter(t=>['queued','pending'].includes(String(t.status||'').toLowerCase())).length;
    const blocked=approvals.filter(a=>a.status==='pending').length;
    const recent=(summaryRes.data?.recent||[]).filter(x=>x.status!=='started').slice(0,20);return {tasks,done,running,queued,blocked,recent,summary:summaryRes.data?.summary||{}};
  }
  function openDrawer(card){
    const d=makeDrawer(),name=$('h3',card)?.textContent.trim()||'موظف رقمي',role=$('p',card)?.textContent.trim()||'موظف رقمي',employeeId=card.dataset.employeeId;
    const status=$('.dot-status.off',card)?'متوقف':'نشط';const values=$$('.employee-metrics div',card).map(x=>({label:$('span',x)?.textContent.trim()||'',value:$('b',x)?.textContent.trim()||''}));
    $('.drawer-content',d).innerHTML=`<span class="drawer-kicker">DIGITAL EMPLOYEE / LIVE</span><div class="drawer-identity"><div class="drawer-avatar">${esc(name.slice(0,1))}</div><div><h2>${esc(name)}</h2><p>${esc(role)}</p></div><span class="drawer-status ${status==='نشط'?'is-on':'is-off'}"><i></i>${status}</span></div><div class="drawer-section"><h3>الحالة التشغيلية</h3><div class="drawer-stats">${values.map(v=>`<div><span>${esc(v.label)}</span><strong>${esc(v.value)}</strong></div>`).join('')}</div><div class="runtime-live-detail">جاري قراءة حالة التنفيذ الحية…</div></div><div class="drawer-section"><h3>مركز التحكم</h3><div class="drawer-actions"><button type="button" class="drawer-primary" data-create-task>إسناد مهمة جديدة</button><button type="button" class="drawer-secondary" data-close-drawer>إغلاق الملف</button></div></div>`;
    $('[data-create-task]',d)?.addEventListener('click',()=>{$('[data-action="create-task"]')?.click();closeDrawer()});d.classList.add('is-open');d.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open');
    liveEmployee(card,employeeId).then(x=>{if(!x||!d.classList.contains('is-open'))return;const el=$('.runtime-live-detail',d);if(!el)return;const latest=x.tasks.sort((a,b)=>new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0))[0];const state=x.blocked?'بانتظار موافقة':x.running?'يعمل الآن':x.queued?'في الطابور':latest&&['completed','done','success'].includes(String(latest.status||'').toLowerCase())?'اكتملت آخر مهمة':'جاهز للعمل';el.innerHTML=`<div class="runtime-state"><span class="runtime-state-dot"></span><strong>${state}</strong></div><div class="runtime-grid"><span>مهام نشطة <b>${x.running}</b></span><span>في الطابور <b>${x.queued}</b></span><span>موافقات معلقة <b>${x.blocked}</b></span><span>إجمالي المهام <b>${x.tasks.length}</b></span></div><small>آخر نشاط: ${esc(latest?.updated_at||latest?.created_at||'لا يوجد نشاط بعد')}</small>`}).catch(()=>{const el=$('.runtime-live-detail',d);if(el)el.textContent='تعذر تحميل الحالة الحية؛ بيانات الملف الأساسية ما زالت متاحة.'});
  }
  function closeDrawer(){if(!drawer)return;drawer.classList.remove('is-open');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open')}
  async function mapEmployeeIds(grid){if(!workspace()||!token())return;try{const res=await api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspace())}`);const employees=res.data||[];$$('.employee-card',grid).forEach(card=>{const name=$('h3',card)?.textContent.trim();const e=employees.find(x=>x.name===name);if(e)card.dataset.employeeId=e.id})}catch{} }
  function enhance(){const grid=$('.employee-grid');if(!grid)return;intelligence(grid);mapEmployeeIds(grid);$$('.employee-card',grid).forEach(card=>{if(card.dataset.workforceEnhanced)return;card.dataset.workforceEnhanced='1';const footer=document.createElement('div');footer.className='employee-card-footer';footer.innerHTML='<span>ملف تشغيلي حي</span><button type="button" class="employee-open">فتح الملف <b>←</b></button>';card.append(footer);$('.employee-open',footer).addEventListener('click',()=>openDrawer(card))})}
  const boot=()=>{enhance();const content=$('#content');if(content&&!content.dataset.workforceObserver){content.dataset.workforceObserver='1';new MutationObserver(()=>enhance()).observe(content,{childList:true,subtree:true})}};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();