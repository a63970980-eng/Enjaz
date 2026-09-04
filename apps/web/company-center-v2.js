(()=>{
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const text=e=>e?.textContent?.trim()||'';
  const nav=k=>document.querySelector(`[data-nav="${k}"]`)?.click();
  const readStats=()=>{const out={};document.querySelectorAll('.stats>div').forEach(x=>{const k=text(x.querySelector('span')),v=text(x.querySelector('b')),s=text(x.querySelector('small'));if(k)out[k]={v,s}});return out};
  const stat=(s,needle,fallback='—')=>Object.entries(s).find(([k])=>k.includes(needle))?.[1]?.v||fallback;
  function mount(){
    if(document.body.dataset.enjazCenterV2==='1')return;
    const c=document.querySelector('#content');
    if(!c||!c.querySelector('.hero'))return;
    const s=readStats();
    const employees=stat(s,'الموظفون'),tasks=stat(s,'المهام'),approvals=stat(s,'الموافقات'),done=stat(s,'الإنجاز','0%');
    const people=[...c.querySelectorAll('.dashboard-side .person-row')].slice(0,5).map(row=>({name:text(row.querySelector('strong')),role:text(row.querySelector('small')),active:!row.querySelector('.dot-status.off')}));
    const decisions=[...c.querySelectorAll('.task-table .table-row')].slice(0,4).map(row=>({title:text(row.querySelector('strong')),owner:text(row.querySelectorAll('span')[0]),status:text(row.querySelectorAll('.status')[0])}));
    const activity=[...c.querySelectorAll('.dashboard-side .activity-row')].slice(0,5).map(row=>({title:text(row.querySelector('strong')),time:text(row.querySelector('small'))}));
    const workerHtml=people.length?people.map((p,i)=>`<div class="worker-row"><span class="worker-avatar">${esc(p.name.charAt(0)||'م')}</span><div><b>${esc(p.name||'موظف رقمي')}</b><small>${esc(p.role||'تشغيل')} · <i>${p.active?'يعمل الآن':'متوقف'}</i></small></div><span class="worker-state ${p.active?'on':'off'}"></span></div>`).join(''):`<div class="empty-decision">لم تتم إضافة قوة عمل رقمية بعد.</div>`;
    const decisionHtml=decisions.length?decisions.map((d,i)=>`<div class="decision"><span class="decision-mark">${i+1}</span><div><b>${esc(d.title||'عمل تشغيلي')}</b><small>${esc(d.owner||'لم يُعيّن')} · ${esc(d.status||'قيد المتابعة')}</small></div><strong>${i===0?'أولوية':'متابعة'}</strong></div>`).join(''):`<div class="empty-decision">لا توجد أعمال ظاهرة في طابور التنفيذ.</div>`;
    const activityHtml=activity.length?activity.map(a=>`<div class="decision activity-item"><span class="activity-line"></span><div><b>${esc(a.title)}</b><small>${esc(a.time)}</small></div></div>`).join(''):`<div class="empty-decision">سيظهر النشاط التشغيلي هنا.</div>`;
    c.innerHTML=`<div class="center-v2" dir="rtl">
      <header class="center-top">
        <div><div class="center-eyebrow">ENJAZ / COMPANY OPERATING SYSTEM</div><h1>مركز الشركة</h1><p>مركز قيادة تنفيذي يوضح ما يعمل، ما يحتاج قرارًا، وما أنجزته المؤسسة الآن.</p></div>
        <div class="center-actions"><button class="center-secondary" data-cmd="employees">قوة العمل</button><button class="center-primary" data-cmd="task">+ أسند عملًا</button></div>
      </header>
      <section class="executive-strip">
        <div class="exec-card"><span>القوة العاملة</span><strong>${esc(employees)}</strong><small>موظفون رقميون</small><i>WORKFORCE</i></div>
        <div class="exec-card"><span>العمل في المنظومة</span><strong>${esc(tasks)}</strong><small>مهام وأعمال تشغيلية</small><i>EXECUTION</i></div>
        <div class="exec-card"><span>تحتاج قرارك</span><strong>${esc(approvals)}</strong><small>موافقات تحت إشراف الإدارة</small><i>CONTROL</i></div>
        <div class="exec-card accent"><span>معدل الإنجاز</span><strong>${esc(done)}</strong><small>من الأعمال المكتملة</small><i>RESULT</i></div>
      </section>
      <section class="center-grid">
        <article class="center-card pulse-card">
          <div class="card-head"><div><label>COMPANY PULSE</label><h2>نبض الشركة</h2></div><span class="live-dot"><b></b> النظام يعمل</span></div>
          <div class="pulse-main"><div class="pulse-ring"><b>${esc(done)}</b><span>معدل الإنجاز</span></div><div class="pulse-copy"><strong>العمليات تحت السيطرة</strong><p>إنجاز يحوّل الأهداف إلى أعمال، ويوزعها على القوة العاملة الرقمية، ثم يرفع ما يحتاج تدخلك فقط.</p><div class="pulse-bars"><span style="width:82%"><i></i></span><span style="width:64%"><i></i></span><span style="width:91%"><i></i></span></div></div></div>
          <div class="pulse-footer"><span>تشغيل مستقر</span><span>قرارات تحت إشرافك</span><span>سجل مؤسسي</span><span>قابل للتوسع</span></div>
        </article>
        <article class="center-card command-card">
          <div class="card-head"><div><label>EXECUTIVE DESK</label><h2>مكتب الإدارة</h2><p>الأوامر التي تحرك المؤسسة.</p></div></div>
          <div class="command-list">
            <button data-cmd="employee"><span class="cmd-icon">+</span><div><b>إضافة موظف رقمي</b><small>وظيفة، مهارات، صلاحيات وأهداف</small></div><em>01</em></button>
            <button data-cmd="task"><span class="cmd-icon">↗</span><div><b>تحويل هدف إلى عمل</b><small>إسناد ومتابعة التنفيذ</small></div><em>02</em></button>
            <button data-cmd="approvals"><span class="cmd-icon">✓</span><div><b>مراجعة القرارات</b><small>ما يحتاج اعتمادًا بشريًا</small></div><em>03</em></button>
          </div>
        </article>
      </section>
      <section class="center-grid lower">
        <article class="center-card workforce-card">
          <div class="card-head"><div><label>DIGITAL WORKFORCE</label><h2>قوة العمل الرقمية</h2><p>موظفون رقميون يعملون بأدوار وصلاحيات وأهداف واضحة.</p></div><button class="text-action" data-cmd="employees">عرض القوة ←</button></div>
          ${workerHtml}
        </article>
        <article class="center-card queue-card">
          <div class="card-head"><div><label>OPERATIONS QUEUE</label><h2>حالة التنفيذ</h2><p>الأعمال التي تتحرك داخل الشركة الآن.</p></div><button class="text-action" data-cmd="tasks">فتح صندوق العمل ←</button></div>
          ${decisionHtml}
        </article>
      </section>
      <section class="center-grid lower activity-grid">
        <article class="center-card activity-card">
          <div class="card-head"><div><label>LIVE ACTIVITY</label><h2>النشاط التشغيلي</h2><p>آخر الأحداث المسجلة في مساحة الشركة.</p></div><button class="text-action" data-cmd="audit">السجل الكامل ←</button></div>
          ${activityHtml}
        </article>
        <article class="center-card identity-card">
          <div class="identity-mark"><span>إ</span></div><div><label>ENJAZ OPERATING LAYER</label><h2>ليس Dashboard آخر.</h2><p>إنجاز مصمم ليكون طبقة التشغيل التي تربط الموظفين الرقميين بالمهام والقرارات والأنظمة داخل الشركة.</p></div>
          <div class="identity-metrics"><span><b>01</b> قوة العمل</span><span><b>02</b> التشغيل</span><span><b>03</b> القرار</span><span><b>04</b> النتيجة</span></div>
        </article>
      </section>
      <section class="company-flow-v2"><div><label>HOW ENJAZ RUNS THE COMPANY</label><h2>من الهدف إلى النتيجة</h2></div><div class="flow-chain"><span>الهدف</span><b>→</b><span>القسم</span><b>→</b><span>الموظف</span><b>→</b><span>التنفيذ</span><b>→</b><span>القرار</span><b>→</b><strong>النتيجة</strong></div></section>
    </div>`;
    document.body.dataset.enjazCenterV2='1';
    c.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.cmd;if(a==='employees')nav('employees');else if(a==='approvals')nav('approvals');else if(a==='tasks')nav('tasks');else if(a==='audit')nav('audit');else if(a==='task')document.querySelector('[data-action="create-task"]')?.click();else if(a==='employee')document.querySelector('[data-action="create-employee"]')?.click()}));
  }
  const obs=new MutationObserver(()=>{if(document.body.dataset.enjazCenterV2!=='1')mount()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(mount,500);
  document.addEventListener('click',e=>{if(e.target.closest('[data-nav="dashboard"]')){document.body.dataset.enjazCenterV2='';setTimeout(mount,80)}});
})();
