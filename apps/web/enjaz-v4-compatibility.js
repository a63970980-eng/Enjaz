const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const boot=()=>{
  if(window.__ENJAZ_V4_BRIDGE__)return;window.__ENJAZ_V4_BRIDGE__=1;
  document.addEventListener('click',event=>{
    const employee=event.target.closest('[data-employee]');
    if(employee&&!event.defaultPrevented){const b=document.createElement('button');b.hidden=true;b.dataset.openEmployee=employee.dataset.employee;document.getElementById('content')?.appendChild(b);b.click();b.remove()}
    const task=event.target.closest('[data-task]');
    if(task&&!event.defaultPrevented&&window.openTask360){event.preventDefault();window.openTask360(task.dataset.task)}
    const generic=event.target.closest('.ev4-generic-card button');
    if(generic&&!event.defaultPrevented){event.preventDefault();const card=generic.closest('.ev4-generic-card');const modal=document.createElement('div');modal.className='ev4-palette-backdrop';modal.innerHTML=`<div class="ev4-palette" onclick="event.stopPropagation()"><div class="ev4-palette-search"><strong>تفاصيل العنصر</strong><button type="button" data-close-v4-detail>×</button></div><div style="padding:22px;line-height:2;font-size:11px">${esc(card?.innerText||'تفاصيل تشغيلية')}<div style="margin-top:15px;color:#667085">هذا المسار محفوظ داخل نموذج التشغيل المؤسسي ويمكن تطويره دون إزالة المكونات الحالية.</div></div></div>`;document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close-v4-detail]'))modal.remove()})}
    const icons=[...document.querySelectorAll('.ev4-top-icon')];const top=event.target.closest('.ev4-top-icon');if(top){event.preventDefault();const index=icons.indexOf(top);document.querySelector(`[data-page="${index===0?'approvals':'audit'}"]`)?.click()}
  },true);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
