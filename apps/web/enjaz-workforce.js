const employeeSeed=[
  ['سارة','مديرة خدمة العملاء','مطاعم · خدمة العملاء','نشط','42','98%'],
  ['عمر','مدير العمليات','الشركات · العمليات','نشط','31','96%'],
  ['ليان','منسقة الحجوزات','الفنادق · الحجوزات','ينتظر','18','94%'],
  ['ياسر','محلل الأعمال','المؤسسات · التحليلات','نشط','27','99%']
];

function mountWorkforce(){
  const c=document.getElementById('content');
  if(!c||c.querySelector('.enjaz-workforce'))return;
  const active=document.querySelector('.enjaz-nav button.active')?.dataset.nav;
  if(active!=='dashboard')return;
  c.innerHTML=`<section class="enjaz-workforce enjaz-command-center">
    <div class="cc-breadcrumb"><span>مساحة العمل الرئيسية</span><i>›</i><strong>مركز القيادة</strong></div>
    <header class="cc-hero">
      <div class="cc-hero-copy">
        <span class="cc-eyebrow"><b></b> ENJAZ DIGITAL WORKFORCE OS</span>
        <h1>قوة العمل الرقمية تعمل الآن.</h1>
        <p>راقب الموظفين الرقميين، وزّع العمل، راجع القرارات، وأدر التنفيذ من مركز قيادة واحد.</p>
        <div class="cc-hero-actions"><button class="wf-btn primary" data-view-employees>إدارة القوة العاملة</button><button class="wf-btn" data-view-tasks>فتح مركز المهام</button></div>
      </div>
      <div class="cc-live-card"><div class="cc-live-head"><span><i></i> التشغيل لحظيًا</span><small>آخر تحديث منذ لحظات</small></div><div class="cc-live-value"><strong>47</strong><span>مهمة قيد التنفيذ</span></div><div class="cc-live-bars"><b style="width:78%"></b><b style="width:52%"></b><b style="width:91%"></b></div><div class="cc-live-foot"><span>طاقة التنفيذ</span><strong>92%</strong></div></div>
    </header>

    <section class="cc-kpis">
      <article><span>الموظفون الرقميون</span><strong>61</strong><small><b>+4</b> هذا الشهر</small></article>
      <article><span>المهام اليوم</span><strong>126</strong><small><b>89%</b> مكتملة</small></article>
      <article><span>بانتظار موافقة</span><strong>03</strong><small class="warn">تحتاج قرارًا بشريًا</small></article>
      <article><span>معدل النجاح</span><strong>98.4%</strong><small><b>+2.1%</b> عن الأسبوع الماضي</small></article>
      <article><span>التكلفة التشغيلية</span><strong>$184</strong><small>اليوم · تقديري</small></article>
    </section>

    <div class="cc-layout">
      <section class="cc-panel cc-workforce-panel">
        <div class="cc-panel-head"><div><span class="cc-overline">DIGITAL WORKFORCE</span><h2>الموظفون الرقميون</h2><p>حالة القوة العاملة وأدائها في الوقت الحالي.</p></div><button data-view-employees>عرض الكل ←</button></div>
        <div class="cc-table-wrap"><table class="cc-table"><thead><tr><th>الموظف</th><th>الحالة</th><th>مهام اليوم</th><th>الأداء</th><th></th></tr></thead><tbody>${employeeSeed.map((e,i)=>`<tr data-view-employees><td><div class="cc-person"><span class="cc-avatar">${['س','ع','ل','ي'][i]}</span><div><strong>${e[0]} — ${e[1]}</strong><small>${e[2]}</small></div></div></td><td><span class="cc-status ${e[3]==='نشط'?'active':'waiting'}"><i></i>${e[3]}</span></td><td><strong>${e[4]}</strong></td><td><div class="cc-progress"><b style="width:${e[5].replace('%','')}%"></b></div><span>${e[5]}</span></td><td><button class="cc-more">•••</button></td></tr>`).join('')}</tbody></table></div>
      </section>

      <aside class="cc-panel cc-approvals"><div class="cc-panel-head compact"><div><span class="cc-overline">HUMAN CONTROL</span><h2>الموافقات</h2></div><button data-nav-jump="approvals">عرض الكل</button></div><div class="cc-approval-item"><span class="cc-approval-icon">₪</span><div><strong>سارة تريد إرسال تعويض</strong><small>منذ 4 دقائق · $120</small></div><button data-nav-jump="approvals">مراجعة</button></div><div class="cc-approval-item"><span class="cc-approval-icon">↗</span><div><strong>عمر يطلب صلاحية إضافية</strong><small>منذ 12 دقيقة · CRM</small></div><button data-nav-jump="approvals">مراجعة</button></div><div class="cc-approval-item"><span class="cc-approval-icon">!</span><div><strong>ليان تحتاج قرارًا</strong><small>منذ 21 دقيقة · حجز</small></div><button data-nav-jump="approvals">مراجعة</button></div></aside>
    </div>

    <div class="cc-layout lower">
      <section class="cc-panel"><div class="cc-panel-head"><div><span class="cc-overline">EXECUTION FLOW</span><h2>العمل الجاري</h2><p>كيف تتحول أهداف الشركة إلى تنفيذ فعلي.</p></div><button data-nav-jump="workflows">إدارة سير العمل</button></div><div class="cc-flow"><div class="cc-flow-step done"><span>01</span><strong>الهدف</strong><small>رفع رضا العملاء</small></div><i>←</i><div class="cc-flow-step done"><span>02</span><strong>التوزيع</strong><small>تخصيص 18 مهمة</small></div><i>←</i><div class="cc-flow-step live"><span>03</span><strong>التنفيذ</strong><small>47 مهمة تعمل</small></div><i>←</i><div class="cc-flow-step"><span>04</span><strong>المراجعة</strong><small>3 قرارات بشرية</small></div></div></section>
      <section class="cc-panel cc-activity"><div class="cc-panel-head compact"><div><span class="cc-overline">ACTIVITY</span><h2>النشاط المباشر</h2></div><button data-nav-jump="audit">سجل التدقيق</button></div><div class="cc-feed"><div><i class="ok"></i><p><strong>سارة</strong> أغلقت تذكرة دعم <small>منذ دقيقة</small></p></div><div><i></i><p><strong>عمر</strong> بدأ سير عمل جديد <small>منذ 4 دقائق</small></p></div><div><i class="warn"></i><p><strong>ليان</strong> أوقفت مهمة بانتظار الموافقة <small>منذ 8 دقائق</small></p></div><div><i></i><p><strong>ياسر</strong> أنشأ تقرير أداء <small>منذ 11 دقيقة</small></p></div></div></section>
    </div>

    <section class="cc-footer-strip"><div><span>PLATFORM HEALTH</span><strong><i></i> جميع الأنظمة تعمل</strong></div><div><span>INTEGRATIONS</span><strong>12 متصلة</strong></div><div><span>SECURITY</span><strong>بدون حوادث</strong></div><div><span>AUDIT LOG</span><strong>1,842 حدثًا</strong></div></section>
  </section>`;
  c.querySelectorAll('[data-view-employees]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();document.querySelector('[data-nav="employees"]')?.click()}));
  c.querySelector('[data-view-tasks]')?.addEventListener('click',()=>document.querySelector('[data-nav="tasks"]')?.click());
  c.querySelectorAll('[data-nav-jump]').forEach(b=>b.addEventListener('click',()=>document.querySelector(`[data-nav="${b.dataset.navJump}"]`)?.click()));
}
const wfObserver=new MutationObserver(mountWorkforce);wfObserver.observe(document.body,{subtree:true,childList:true});mountWorkforce();