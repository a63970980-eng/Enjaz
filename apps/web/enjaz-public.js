import {authClient} from './auth-client.js';

const hasSession=()=>Boolean(authClient?.token?.());
const query=new URLSearchParams(location.search);

if(!hasSession()&&!query.has('auth')){
  window.__ENJAZ_PUBLIC_SHOWN__=true;
  document.querySelector('.enjaz-root')?.setAttribute('aria-hidden','true');
  document.documentElement.classList.add('enjaz-public-route');
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
      <button class="public-login" data-auth="login">تسجيل الدخول</button>
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
        <div class="workforce-visual" aria-label="محاكاة حية لفريق إنجاز الرقمي">
          <div class="visual-grid" aria-hidden="true"></div>
          <div class="visual-orbit orbit-a" aria-hidden="true"></div>
          <div class="visual-orbit orbit-b" aria-hidden="true"></div>
          <span class="visual-node node-a" aria-hidden="true"></span>
          <span class="visual-node node-b" aria-hidden="true"></span>
          <span class="visual-node node-c" aria-hidden="true"></span>
          <div class="workforce-deck" aria-label="موظفون رقميون يعملون الآن">
            <article class="deck-card deck-card-operations" data-deck-index="0">
              <div class="deck-accent"></div>
              <div class="deck-card-head"><span class="deck-person"><span class="deck-avatar">ع</span><span><b>عمر</b><small>مدير العمليات</small></span></span><span class="deck-live">● يعمل الآن</span></div>
              <strong>مراقبة العمليات اليومية</strong>
              <div class="deck-task"><span class="task-icon">↗</span><span>اكتشاف حالة تحتاج إلى تدخل تشغيلي</span></div>
              <div class="deck-bottom"><span>8 عمليات</span><span class="deck-progress"><i style="width:82%"></i></span><em>82%</em></div>
            </article>
            <article class="deck-card deck-card-analytics" data-deck-index="1">
              <div class="deck-accent"></div>
              <div class="deck-card-head"><span class="deck-person"><span class="deck-avatar">م</span><span><b>مريم</b><small>محللة الأعمال</small></span></span><span class="deck-live">● يحلل</span></div>
              <strong>تحليل أداء المؤسسة</strong>
              <div class="deck-task"><span class="task-icon">⌁</span><span>استخراج الإشارات التي تستحق قرارًا</span></div>
              <div class="deck-bottom"><span>24 مؤشرًا</span><span class="deck-progress"><i style="width:68%"></i></span><em>68%</em></div>
            </article>
            <article class="deck-card deck-card-procurement" data-deck-index="2">
              <div class="deck-accent"></div>
              <div class="deck-card-head"><span class="deck-person"><span class="deck-avatar">خ</span><span><b>خالد</b><small>منسق المشتريات</small></span></span><span class="deck-live">● ينفذ</span></div>
              <strong>تنسيق طلبات التوريد</strong>
              <div class="deck-task"><span class="task-icon">✓</span><span>مطابقة الطلبات مع المخزون والسياسات</span></div>
              <div class="deck-bottom"><span>6 طلبات</span><span class="deck-progress"><i style="width:56%"></i></span><em>56%</em></div>
            </article>
            <article class="deck-card deck-card-service" data-deck-index="3">
              <div class="deck-accent"></div>
              <div class="deck-card-head"><span class="deck-person"><span class="deck-avatar">س</span><span><b>سارة</b><small>مديرة خدمة العملاء</small></span></span><span class="deck-live">● تعالج</span></div>
              <strong>معالجة طلب العميل</strong>
              <div class="deck-task"><span class="task-icon">→</span><span>التحقق ثم تنفيذ الإجراء وإرسال النتيجة</span></div>
              <div class="deck-bottom"><span>12 طلبًا</span><span class="deck-progress"><i style="width:91%"></i></span><em>91%</em></div>
            </article>
          </div>
          <div class="visual-command"><span class="command-spark">✦</span><div><small>إنجاز ينفذ الآن</small><strong>تحليل ← تخطيط ← موافقة ← تنفيذ</strong></div><span class="command-live"><i></i> LIVE</span></div>
          <div class="visual-telemetry"><span><i></i> أدوات متصلة 12</span><span>مهام نشطة 08</span><span>قرارات بانتظار الاعتماد 02</span></div>
        </div>
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
  <footer class="public-footer"><div><strong>إنجاز</strong><span>© 2026 Enjaz. Digital Workforce Operating System.</span></div><div><button data-scroll="platform">المنصة</button><button data-auth="login">تسجيل الدخول</button></div></footer>`;

  mount.querySelectorAll('[data-auth]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.auth)));
  mount.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'})));
}


if(window.__ENJAZ_PUBLIC_SHOWN__){
  const stage=()=>document.querySelector('.workforce-stage');
  const liveWorkforce=()=>{
    const root=stage();
    if(!root)return;
    const command=root.querySelector('.stage-command strong');
    const commandStatus=root.querySelector('.command-status');
    const employee=root.querySelector('.employee-row strong');
    const employeeRole=root.querySelector('.employee-row small');
    const task=root.querySelector('.task-line span');
    const steps=[...root.querySelectorAll('.task-flow span')];
    const metrics=[...root.querySelectorAll('.stage-metrics strong')];
    const live=root.querySelector('.live');
    const scenarios=[
      {name:'سارة',role:'مديرة خدمة العملاء · تعمل الآن',command:'إدارة طلبات العملاء',task:'تحليل طلب العميل والتحقق من البيانات ثم تجهيز الإجراء المناسب.',status:'يحلل',metric:'12',step:1},
      {name:'عمر',role:'مدير العمليات · يعمل الآن',command:'مراقبة العمليات اليومية',task:'مراجعة سير العمليات واكتشاف حالة تحتاج إلى تدخل تشغيلي.',status:'يراقب',metric:'8',step:2},
      {name:'مريم',role:'محللة الأعمال · تعمل الآن',command:'تحليل أداء المؤسسة',task:'مقارنة مؤشرات الأداء واستخراج الإشارات التي تستحق قرارًا.',status:'يحلل',metric:'24',step:1},
      {name:'خالد',role:'منسق المشتريات · يعمل الآن',command:'تنسيق طلبات التوريد',task:'مطابقة الطلبات مع المخزون والسياسات وتجهيز التوصية.',status:'ينفذ',metric:'6',step:2}
    ];
    let index=0;
    const render=()=>{
      const s=scenarios[index%scenarios.length];
      [command,employee,employeeRole,task].forEach(el=>{if(el)el.classList.add('is-updating')});
      setTimeout(()=>{
        if(command)command.textContent=s.command;
        if(commandStatus)commandStatus.textContent=s.status;
        if(employee)employee.textContent=s.name;
        if(employeeRole)employeeRole.textContent=s.role;
        if(task)task.textContent=s.task;
        if(metrics[0])metrics[0].textContent=s.metric;
        if(live)live.textContent='● LIVE';
        steps.forEach((el,i)=>{
          el.classList.toggle('done',i<s.step);
          el.classList.toggle('active',i===s.step);
        });
        [command,employee,employeeRole,task].forEach(el=>{if(el)el.classList.remove('is-updating')});
        index++;
      },180);
    };
    render();
    const timer=setInterval(render,4200);
    window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  };
  requestAnimationFrame(liveWorkforce);

  const initWorkforceDeck=()=>{
    const root=stage();
    const cards=[...root?.querySelectorAll('.deck-card')||[]];
    if(cards.length<2)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint=()=>{
      cards.forEach((card,index)=>{
        card.style.setProperty('--deck-order',String(index));
      });
    };
    paint();
    if(reduced)return;
    const timer=window.setInterval(()=>{
      cards.forEach(card=>card.classList.remove('deck-flash'));
      requestAnimationFrame(()=>cards.forEach(card=>card.classList.add('deck-flash')));
    },4200);
    window.addEventListener('pagehide',()=>window.clearInterval(timer),{once:true});
  };


  const reveal=()=>{
    const items=document.querySelectorAll('.public-section,.logo-strip,.final-cta,.trust-strip,.public-footer');
    if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('enjaz-visible'));return}
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('enjaz-visible');io.unobserve(entry.target)}
    }),{threshold:.08});
    items.forEach(el=>{el.classList.add('enjaz-reveal');io.observe(el)});
  };
  reveal();

  const navButtons=[...document.querySelectorAll('.public-links [data-scroll]')];
  const sections=navButtons.map(b=>document.getElementById(b.dataset.scroll)).filter(Boolean);
  if('IntersectionObserver' in window){
    const navIO=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      navButtons.forEach(btn=>btn.classList.toggle('is-current',btn.dataset.scroll===entry.target.id));
    }),{rootMargin:'-35% 0px -55% 0px'});
    sections.forEach(section=>navIO.observe(section));
  }

  const stageEl=stage();
  if(stageEl && window.matchMedia('(pointer:fine)').matches){
    stageEl.addEventListener('pointermove',event=>{
      const r=stageEl.getBoundingClientRect();
      const x=(event.clientX-r.left)/r.width-.5;
      const y=(event.clientY-r.top)/r.height-.5;
      stageEl.style.setProperty('--stage-x',String(x*7)+'px');
      stageEl.style.setProperty('--stage-y',String(y*5)+'px');
    });
    stageEl.addEventListener('pointerleave',()=>{stageEl.style.setProperty('--stage-x','0px');stageEl.style.setProperty('--stage-y','0px')});
  }

  const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(prefersReduced.matches)document.documentElement.classList.add('reduce-motion');
}
