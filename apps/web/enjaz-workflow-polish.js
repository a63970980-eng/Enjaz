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

const readyCopy=(button)=>{
  const text=button.textContent.trim();
  if(text.includes('إنشاء موظف')) button.textContent=text.replace(/إنشاء موظف/g,'إضافة موظف جاهز');
  if(button.textContent.trim()==='+ موظف رقمي') button.textContent='+ إضافة موظف جاهز';
  button.setAttribute('aria-label','إضافة موظف رقمي جاهز من كتالوج إنجاز');
};

function polish(){
  const content=document.getElementById('content');
  if(!content)return;

  // The workforce is catalog-first. Keep every employee entry point consistent,
  // including buttons rendered by older page templates.
  document.querySelectorAll('[data-action="create-employee"]').forEach(readyCopy);
  document.querySelectorAll('button,a').forEach(button=>{
    const text=button.textContent?.trim()||'';
    if(/^(\+\s*)?إنشاء موظف$/.test(text)) readyCopy(button);
  });

  const modal=document.querySelector('.modal');
  const title=modal?.querySelector('header h2,.modal-header h2,h2');
  if(title && /إنشاء موظف رقمي/.test(title.textContent||'')){
    title.textContent='اختيار موظف رقمي جاهز';
  }

  document.querySelectorAll('.employee-card').forEach(card=>{
    const label=card.getAttribute('aria-label')||'فتح ملف الموظف الرقمي';
    if(!label.includes('ملف تشغيلي 360')) card.setAttribute('aria-label',`${label} — ملف تشغيلي 360`);
  });

  const eyebrow=document.querySelector('.pagehead .eyebrow')?.textContent?.trim()||'';
  const key=Object.entries(sectionMeta).find(([,meta])=>meta.label===eyebrow)?.[0];
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
