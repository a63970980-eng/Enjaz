(()=>{
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const text=e=>e?.textContent?.trim()||'';
  const nav=k=>document.querySelector(`[data-nav="${k}"]`)?.click();
  const stats=()=>{const out={};document.querySelectorAll('.stats>div').forEach(x=>{const k=text(x.querySelector('span')),v=text(x.querySelector('b')),s=text(x.querySelector('small'));if(k)out[k]={v,s}});return out};
  function mount(){
    if(document.body.dataset.enjazCenterV2==='1')return;
    const c=document.querySelector('#content');
    if(!c||!c.querySelector('.company-os-home'))return;
    const s=stats();
    const employees=Object.entries(s).find(([k])=>k.includes('الموظفون'))?.[1]?.v||'—';
    const tasks=Object.entries(s).find(([k])=>k==='المهام')?.[1]?.v||'—';
    const approvals=Object.entries(s).find(([k])=>k.includes('الموافقات'))?.[1]?.v||'—';
    const done=Object.entries(s).find(([k])=>k.includes('الإنجاز'))?.[1]?.v||'—';
    c.innerHTML=`<div class="center-v2" dir="rtl">
      <header class="center-top">
        <div><div class="center-eyebrow">ENJAZ / COMPANY CENTER</div><h1>مركز الشركة</h1><p>صورة تنفيذية لحظية لما يحدث داخل مؤسستك وقوة العمل الرقمية التي تشغّلها.</p></div>
        <div class="center-actions"><button class="center-secondary" data-cmd="employees">قوة العمل</button><button class="center-primary" data-cmd="task">+ أسند عملًا</button></div>
      </header>
      <section class="executive-strip">
        <div class="exec-card"><span>القوة العاملة</span><strong>${esc(employees)}</strong><small>موظفون رقميون</small><i>WORKFORCE</i></div>
        <div class="exec-card"><span>العمل الجاري</span><strong>${esc(tasks)}</strong><small>مهمة في المنظومة</small><i>WORK</i></div>
        <div class="exec-card"><span>تحتاج قرارك</span><strong>${esc(approvals)}</strong><small>موافقات معلّقة</small><i>CONTROL</i></div>
        <div class="exec-card accent"><span>الإنجاز</span><strong>${esc(done)}</strong><small>معدل إتمام الأعمال</small><i>RESULT</i></div>
      </section>
      <section class="center-grid">
        <article class="center-card pulse-card">
          <div class="card-head"><div><label>COMPANY PULSE</label><h2>نبض الشركة</h2></div><span class="live-dot">● مباشر</span></div>
          <div class="pulse-main"><div class="pulse-ring"><b>${esc(done)}</b><span>إنجاز</span></div><div class="pulse-copy"><strong>الشركة تعمل</strong><p>تتحول الأهداف إلى أعمال، والأعمال إلى نتائج قابلة للقياس.</p><div class="pulse-bars"><span style="width:82%"><i></i></span><span style="width:64%"><i></i></span><span style="width:91%"><i></i></span></div></div></div>
          <div class="pulse-footer"><span>تشغيل مستقر</span><span>القرارات تحت سيطرتك</span><span>سجل مؤسسي فعّال</span></div>
        </article>
        <article class="center-card command-card">
          <div class="card-head"><div><label>EXECUTIVE DESK</label><h2>مكتب الإدارة</h2></div></div>
          <div class="command-list">
            <button data-cmd="employee"><span class="cmd-icon">+</span><div><b>وظّف موظفًا رقميًا</b><small>أضف وظيفة حقيقية إلى المؤسسة</small></div><em>01</em></button>
            <button data-cmd="task"><span class="cmd-icon">↗</span><div><b>حوّل هدفًا إلى عمل</b><small>أسند مهمة وراقب تنفيذها</small></div><em>02</em></button>
            <button data-cmd="approvals"><span class="cmd-icon">✓</span><div><b>راجع القرارات</b><small>اعتمد أو ارفض الأعمال الحساسة</small></div><em>03</em></button>
          </div>
        </article>
      </section>
      <section class="center-grid lower">
        <article class="center-card workforce-card">
          <div class="card-head"><div><label>DIGITAL WORKFORCE</label><h2>قوة العمل الرقمية</h2><p>موظفون يؤدون وظائف، وليسوا مجرد روبوتات محادثة.</p></div><button class="text-action" data-cmd="employees">عرض الكل ←</button></div>
          <div class="worker-row"><span class="worker-avatar">م</span><div><b>مدير العمليات</b><small>إدارة التشغيل · <i>يعمل الآن</i></small></div><strong>12</strong><em>مهمة</em></div>
          <div class="worker-row"><span class="worker-avatar">خ</span><div><b>خدمة العملاء</b><small>العلاقات · <i>يعمل الآن</i></small></div><strong>8</strong><em>مهام</em></div>
          <div class="worker-row"><span class="worker-avatar">م</span><div><b>المدير المالي</b><small>المالية · <i>بانتظار موافقة</i></small></div><strong>4</strong><em>مهام</em></div>
        </article>
        <article class="center-card queue-card">
          <div class="card-head"><div><label>DECISION QUEUE</label><h2>طابور القرارات</h2><p>ما يحتاج تدخلك البشري الآن.</p></div><button class="text-action" data-cmd="approvals">فتح القرارات ←</button></div>
          <div class="decision"><span class="decision-mark">!</span><div><b>اعتماد عملية مالية</b><small>المدير المالي · منذ 8 دقائق</small></div><strong>مراجعة</strong></div>
          <div class="decision"><span class="decision-mark">!</span><div><b>الموافقة على شراء</b><small>المشتريات · منذ 21 دقيقة</small></div><strong>مراجعة</strong></div>
          <div class="empty-decision">باقي الأعمال تسير تلقائيًا وفق الصلاحيات.</div>
        </article>
      </section>
      <section class="company-flow-v2"><div><label>HOW ENJAZ RUNS THE COMPANY</label><h2>من الهدف إلى النتيجة</h2></div><div class="flow-chain"><span>الهدف</span><b>→</b><span>القسم</span><b>→</b><span>الموظف</span><b>→</b><span>التنفيذ</span><b>→</b><span>الموافقة</span><b>→</b><strong>النتيجة</strong></div></section>
    </div>`;
    document.body.dataset.enjazCenterV2='1';
    c.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.cmd;if(a==='employees')nav('employees');else if(a==='approvals')nav('approvals');else if(a==='task')document.querySelector('[data-action="create-task"]')?.click();else if(a==='employee')document.querySelector('[data-action="create-employee"]')?.click()}));
  }
  const obs=new MutationObserver(()=>{if(document.body.dataset.enjazCenterV2!=='1')mount()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(mount,700);
  document.addEventListener('click',e=>{if(e.target.closest('[data-nav="dashboard"]')){document.body.dataset.enjazCenterV2='';setTimeout(mount,80)}});
})();
