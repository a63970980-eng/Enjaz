import {authClient} from './auth-client.js';

const hasSession=()=>Boolean(authClient?.token?.());
const query=new URLSearchParams(location.search);

if(!hasSession()&&!query.has('auth')){
  window.__ENJAZ_PUBLIC_SHOWN__=true;
  const mount=document.createElement('div');
  mount.id='enjaz-public';
  document.body.appendChild(mount);

  const go=(mode='login')=>{
    const url=new URL(location.href);
    url.search='';
    url.searchParams.set('auth','1');
    if(mode==='signup')url.searchParams.set('signup','1');
    location.href=url.toString();
  };

  mount.innerHTML=`
  <nav class="public-nav">
    <a class="public-brand" href="#top" aria-label="إنجاز">
      <span class="public-mark">إ</span>
      <span><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE OS</small></span>
    </a>
    <div class="public-links" role="navigation" aria-label="التنقل الرئيسي">
      <button data-scroll="platform">المنصة</button>
      <button data-scroll="workforce">القوى العاملة</button>
      <button data-scroll="solutions">الحلول</button>
      <button data-scroll="trust">الأمان والتحكم</button>
      <a class="public-login" data-auth="login" href="?auth=1">تسجيل الدخول</a>
      <button class="public-nav-cta" data-auth="signup">ابدأ مجانًا</button>
    </div>
    <button class="public-mobile-cta" data-auth="signup">ابدأ</button>
  </nav>

  <main id="top">
    <section class="public-hero">
      <div class="hero-copy">
        <div class="public-kicker"><i></i><span>نظام تشغيل القوة العاملة الرقمية</span><b>NEW</b></div>
        <h1>حوّل الذكاء الاصطناعي<br><span>إلى قوة عمل حقيقية.</span></h1>
        <p>إنجاز يمنح شركتك موظفين رقميين متخصصين، لكل منهم وظيفة ومهارات وأدوات وذاكرة وصلاحيات وأهداف. يعملون داخل عملياتك، ينفذون العمل، ويرفعون القرارات التي تحتاج إلى الإنسان.</p>
        <div class="public-actions">
          <button class="public-primary" data-auth="signup">ابدأ ببناء قوة العمل الرقمية <span>←</span></button>
          <button class="public-secondary" data-scroll="workforce"><span class="play">▶</span> شاهد كيف يعمل إنجاز</button>
        </div>
        <div class="public-trust-line"><span>✓ بدون تعقيد في البداية</span><span>✓ تحكم وصلاحيات</span><span>✓ مصمم للشركات</span></div>
      </div>

      <div class="workforce-stage" aria-label="عرض حي للقوة العاملة الرقمية">
        <div class="stage-glow glow-one"></div><div class="stage-glow glow-two"></div>
        <div class="stage-top"><span class="stage-title"><i class="pulse"></i> Digital Workforce</span><span class="live">● LIVE</span></div>
        <div class="stage-command"><span class="command-icon">✦</span><div><small>إنجاز الآن</small><strong>إدارة عمليات الشركة</strong></div><span class="command-status">يعمل</span></div>
        <div class="employee-panel featured">
          <div class="employee-row"><span class="employee-avatar avatar-s">س</span><div><strong>سارة</strong><small>مديرة خدمة العملاء · تعمل الآن</small></div><span class="mini-dot"></span></div>
          <div class="task-line"><b>المهمة الحالية</b><span>معالجة طلب العميل وتحديث الحالة ثم إرسال النتيجة.</span></div>
          <div class="task-flow"><span class="done">فهم الطلب</span><em>→</em><span class="done">التحقق</span><em>→</em><span class="active">التنفيذ</span><em>→</em><span>النتيجة</span></div>
        </div>
        <div class="employee-panel compact">
          <div class="employee-row"><span class="employee-avatar avatar-o">ع</span><div><strong>عمر · مدير العمليات</strong><small>يراقب سير العمل والقرارات</small></div><span class="approval-pill">اعتماد مطلوب</span></div>
        </div>
        <div class="stage-metrics"><div><strong>60+</strong><span>موظف جاهز</span></div><div><strong>24/7</strong><span>تشغيل مستمر</span></div><div><strong>1</strong><span>منصة واحدة</span></div></div>
      </div>
    </section>

    <section class="logo-strip"><span>مصمم لفرق</span><div><b>المطاعم</b><b>الفنادق</b><b>الصحة</b><b>التجزئة</b><b>المالية</b><b>العمليات</b><b>الحكومة</b></div></section>

    <section class="public-section workforce-section" id="workforce">
      <div class="public-section-inner">
        <div class="section-heading"><div><div class="section-eyebrow">YOUR DIGITAL TEAM</div><h2>لا تبدأ من الصفر.</h2><p class="section-lead">اختر موظفًا رقميًا جاهزًا لدوره، ثم اربطه ببيانات شركتك وأدواتها. إنجاز يبني لك القوة العاملة؛ وأنت تحدد كيف تعمل.</p></div><button class="text-cta" data-auth="signup">استكشف مكتبة الموظفين ←</button></div>
        <div class="employee-catalog-preview">
          <article><span class="catalog-avatar">س</span><div><strong>مديرة خدمة العملاء</strong><small>Customer Operations</small></div><em>جاهزة للعمل</em></article>
          <article><span class="catalog-avatar">م</span><div><strong>منسق الحجوزات</strong><small>Reservations</small></div><em>جاهز للعمل</em></article>
          <article><span class="catalog-avatar">ر</span><div><strong>محلل الأعمال</strong><small>Business Intelligence</small></div><em>جاهز للعمل</em></article>
          <article><span class="catalog-avatar">ع</span><div><strong>مدير العمليات</strong><small>Operations</small></div><em>جاهز للعمل</em></article>
        </div>
      </div>
    </section>

    <section class="public-section" id="platform">
      <div class="public-section-inner">
        <div class="section-eyebrow">ONE EMPLOYEE · COMPLETE CONTEXT</div><h2>الموظف الرقمي ليس روبوت محادثة.</h2>
        <p class="section-lead">هو كيان تشغيلي داخل شركتك: يعرف دوره، يفهم سياقه، يستخدم الأدوات المسموح بها، ويتحرك ضمن سياساتك.</p>
        <div class="cap-grid"><article class="cap-card"><span class="cap-number">01</span><strong>دور واضح</strong><span>مدير خدمة عملاء، منسق حجوزات، محلل أعمال، مدير عمليات وأكثر.</span></article><article class="cap-card"><span class="cap-number">02</span><strong>ذاكرة ومعرفة</strong><span>سياسات الشركة، المعرفة التشغيلية، وسياق العمل المرتبط بكل مهمة.</span></article><article class="cap-card"><span class="cap-number">03</span><strong>أدوات وصلاحيات</strong><span>ينفذ الإجراءات عبر التكاملات المسموح بها وفق حدود الدور.</span></article><article class="cap-card"><span class="cap-number">04</span><strong>أهداف ومساءلة</strong><span>يستقبل الأهداف، ينفذ، يرفع النتائج، ويترك سجلًا تشغيليًا واضحًا.</span></article></div>
      </div>
    </section>

    <section class="public-section flow-section" id="solutions">
      <div class="public-section-inner"><div class="section-eyebrow">HOW ENJAZ WORKS</div><h2>من الهدف إلى النتيجة.</h2><p class="section-lead">حوّل الأعمال المتكررة والموزعة بين الأنظمة إلى دورة تشغيل واضحة يمكن قياسها والتحكم فيها.</p>
      <div class="flow-grid"><article class="flow-step"><b>01</b><strong>الهدف</strong><span>حدد النتيجة والسياسة.</span></article><article class="flow-step"><b>02</b><strong>التوزيع</strong><span>يسند العمل للموظف المناسب.</span></article><article class="flow-step"><b>03</b><strong>التنفيذ</strong><span>يستخدم الأدوات المصرح بها.</span></article><article class="flow-step"><b>04</b><strong>المراجعة</strong><span>تعود القرارات الحساسة للإنسان.</span></article><article class="flow-step"><b>05</b><strong>النتيجة</strong><span>تسجل العملية وتقاس.</span></article></div></div>
    </section>

    <section class="public-section trust-section" id="trust"><div class="public-section-inner"><div class="section-eyebrow">CONTROL BY DESIGN</div><h2>قوة رقمية. تحت سيطرتك.</h2><p class="section-lead">الصلاحيات، الموافقات، سجل التدقيق والتكاملات جزء من نموذج التشغيل منذ البداية.</p><div class="trust-grid"><div><strong>صلاحيات حسب الدور</strong><span>كل موظف يحصل على ما يحتاجه فقط.</span></div><div><strong>موافقات بشرية</strong><span>أوقف القرارات الحساسة حتى يعتمدها المسؤول.</span></div><div><strong>سجل تدقيق</strong><span>اعرف ماذا حدث، ومتى، ومن نفذه.</span></div><div><strong>تكاملات آمنة</strong><span>اربط أنظمة شركتك ضمن الحدود التي تحددها.</span></div></div></div></section>

    <section class="final-cta"><div><span class="section-eyebrow">THE NEXT WORKFORCE</span><h2>ابدأ بناء فريقك الرقمي اليوم.</h2><p>موظفون جاهزون. منصة واحدة. تحكم كامل.</p></div><button data-auth="signup">ابدأ مع إنجاز <span>←</span></button></section>
    <div class="trust-strip"><span><strong>إنجاز</strong> · Digital Workforce Operating System</span><span>ابنِ فريقك الرقمي، ثم دع الفريق يعمل.</span></div>
  </main>
  <footer class="public-footer"><div><strong>إنجاز</strong><span>© 2026 Enjaz. Digital Workforce Operating System.</span></div><div><button data-scroll="platform">المنصة</button><a class="public-login" data-auth="login" href="?auth=1">تسجيل الدخول</a></div></footer>`;

  mount.querySelectorAll('[data-auth]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.auth)));
  mount.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'})));
}