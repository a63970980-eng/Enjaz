const sectionMeta={
  dashboard:{label:'مركز القيادة',step:1},
  employees:{label:'القوة العاملة الرقمية',step:2},
  tasks:{label:'التنفيذ',step:3},
  teams:{label:'الفرق الذكية',step:4},
  workflows:{label:'سير العمل',step:5},
  approvals:{label:'الموافقات',step:6},
  integrations:{label:'التكاملات',step:7},
  audit:{label:'الحوكمة والتدقيق',step:8}
};

function polish(){
  const content=document.getElementById('content');
  if(!content)return;

  document.querySelectorAll('[data-action="create-employee"]').forEach(button=>{
    if(button.textContent.includes('إنشاء موظف')){
      button.textContent=button.textContent.replace('إنشاء موظف','إضافة موظف جاهز');
    }
    if(button.textContent.trim()==='+ موظف رقمي') button.textContent='+ إضافة موظف جاهز';
    button.setAttribute('aria-label','إضافة موظف رقمي جاهز من كتالوج إنجاز');
  });

  const modal=document.querySelector('.modal');
  const title=modal?.querySelector('header h2');
  if(title && title.textContent.trim()==='إنشاء موظف رقمي') title.textContent='اختيار موظف رقمي جاهز';

  document.querySelectorAll('.employee-card').forEach(card=>{
    card.setAttribute('aria-label',`${card.getAttribute('aria-label')||'فتح ملف الموظف الرقمي'} — ملف تشغيلي 360`);
  });

  const section=document.querySelector('.pagehead .eyebrow')?.textContent?.trim();
  const key=Object.entries(sectionMeta).find(([,meta])=>meta.label===section)?.[0];
  if(key && !content.querySelector('.enjaz-flow-rail')){
    const meta=sectionMeta[key];
    const rail=document.createElement('div');
    rail.className='enjaz-flow-rail';
    rail.setAttribute('aria-label','مسار تشغيل إنجاز');
    rail.innerHTML=`<span class="enjaz-flow-current">${meta.step}/8</span><span>مسار تشغيل إنجاز</span><b>${meta.label}</b><i></i><small>المؤسسة ← القوة العاملة ← التنفيذ ← الحوكمة</small>`;
    content.prepend(rail);
  }
}

let queued=false;
const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;polish()})};
const observer=new MutationObserver(schedule);
observer.observe(document.documentElement,{subtree:true,childList:true});
schedule();
