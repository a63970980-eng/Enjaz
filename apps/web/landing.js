/* ENJAZ public enterprise experience — Salesforce-grade editorial composition.
 * Public only: authentication and workspace behavior remain in auth-gate-v2.js.
 */
export function renderLanding(root,{onLogin=()=>{},onSignup=()=>{}}={}) {
  if(!root) return;
  root.innerHTML=`
  <div class="public-platform sfx" id="enjaz-public">
    <header class="sfx-nav-wrap">
      <div class="pp-container sfx-nav">
        <a class="pp-brand" href="#top" aria-label="إنجاز">
          <span class="pp-mark">إ</span>
          <span>إنجاز<small>INTELLIGENT OPERATING PLATFORM</small></span>
        </a>
        <nav class="pp-links" aria-label="التنقل الرئيسي">
          <a href="#platform">المنصة</a><a href="#workforce">القوة العاملة</a><a href="#operating-model">طريقة العمل</a>
          <a href="#industries">القطاعات</a><a href="#governance">الحوكمة</a>
        </nav>
        <div class="pp-actions">
          <button class="pp-btn ghost" data-public-login>تسجيل الدخول</button>
          <button class="pp-btn primary" data-public-signup>ابدأ مع إنجاز</button>
        </div>
      </div>
    </header>

    <main id="top">
      <section class="sfx-hero">
        <div class="pp-container sfx-hero-grid">
          <div class="sfx-hero-copy">
            <span class="pp-kicker">INTELLIGENT ENTERPRISE OPERATING PLATFORM</span>
            <h1>حوّل مؤسستك إلى <em>قوة عمل</em> تعمل بذكاء.</h1>
            <p>إنجاز تجمع البشر والموظفين الرقميين والمهام وسير العمل والحوكمة في طبقة تشغيل مؤسسية واحدة.</p>
            <div class="pp-hero-actions">
              <button class="pp-btn primary sfx-big-btn" data-public-signup>أنشئ مساحة مؤسستك <b>←</b></button>
              <a class="pp-btn ghost sfx-big-btn" href="#platform">شاهد كيف تعمل المنصة <b>↓</b></a>
            </div>
            <div class="sfx-trust-row"><span>Human-in-the-loop</span><span>Role-based access</span><span>Audit-ready</span></div>
          </div>
          <div class="sfx-hero-stage">
            <div class="sfx-orb sfx-orb-a"></div><div class="sfx-orb sfx-orb-b"></div>
            <div class="sfx-product-frame" aria-label="معاينة توضيحية لمركز قيادة إنجاز">
              <div class="sfx-browser-bar"><span class="sfx-dots">● ● ●</span><strong>ENJAZ COMMAND CENTER</strong><span class="sfx-demo">PREVIEW</span></div>
              <div class="sfx-product">
                <aside class="sfx-sidebar"><b>إنجاز</b><span class="active">مركز القيادة</span><span>القوة العاملة</span><span>العمليات</span><span>سير العمل</span><span>الحوكمة</span></aside>
                <div class="sfx-product-main">
                  <div class="sfx-product-head"><div><small>المشهد التشغيلي</small><h3>كل ما يحتاجه القرار في مكان واحد.</h3></div><span class="sfx-status">● عرض توضيحي</span></div>
                  <div class="sfx-metrics"><div><small>المهام</small><strong>24</strong><em>قيد التشغيل</em></div><div><small>الموافقات</small><strong>07</strong><em>تحتاج مراجعة</em></div><div><small>القوى العاملة</small><strong>18</strong><em>موظف رقمي</em></div></div>
                  <div class="sfx-chart"><div class="sfx-chart-title"><strong>مسار التنفيذ</strong><span>اليوم · Preview</span></div><div class="sfx-bars"><i style="height:42%"></i><i style="height:66%"></i><i style="height:52%"></i><i style="height:82%"></i><i style="height:61%"></i><i style="height:91%"></i><i style="height:73%"></i><i style="height:96%"></i></div></div>
                  <div class="sfx-feed"><div><span class="feed-icon green">✓</span><p><b>منسق العمليات</b> أكمل خطة المهمة <small>منذ دقيقة</small></p><em>مكتمل</em></div><div><span class="feed-icon coral">!</span><p><b>طلب اعتماد</b> ينتظر قرار المشرف <small>منذ 4 دقائق</small></p><em>مراجعة</em></div><div><span class="feed-icon blue">↗</span><p><b>محلل الأداء</b> أضاف رؤية جديدة <small>منذ 8 دقائق</small></p><em>جديد</em></div></div>
                </div>
              </div>
            </div>
            <div class="sfx-float sfx-float-one"><span>AI WORKER</span><b>منسق العمليات</b><small>يعمل ضمن السياسة</small><i>●</i></div>
            <div class="sfx-float sfx-float-two"><span>GOVERNANCE</span><b>موافقة بشرية</b><small>قرار حساس · يحتاج مراجعة</small></div>
          </div>
        </div>
      </section>

      <section class="sfx-logo-band" aria-label="طبقة التكامل">
        <div class="sfx-marquee"><div class="sfx-marquee-track">
          <span>AI MODELS</span><b>OpenAI</b><span>GitHub</span><b>Vercel</b><span>Supabase</span><b>Google Cloud</b><span>MCP</span><b>Enterprise APIs</b><span>Webhooks</span><b>Custom Systems</b>
          <span>AI MODELS</span><b>OpenAI</b><span>GitHub</span><b>Vercel</b><span>Supabase</span><b>Google Cloud</b><span>MCP</span><b>Enterprise APIs</b><span>Webhooks</span><b>Custom Systems</b>
        </div></div>
      </section>

      <section class="sfx-statement">
        <div class="pp-container sfx-statement-grid">
          <div><span class="pp-kicker">THE OPERATING LAYER</span><h2>الذكاء لا يكفي.<br><em>يجب أن يتحول إلى إنجاز.</em></h2></div>
          <p>المؤسسات لا تحتاج نافذة محادثة أخرى. تحتاج نظامًا يعرف من المسؤول، ماذا يجب أن يحدث، ما الذي يمكن تنفيذه، ومتى يجب أن يتدخل الإنسان.</p>
        </div>
      </section>

      <section class="pp-section sfx-platform-section" id="platform">
        <div class="pp-container">
          <div class="pp-section-head">
            <span class="pp-kicker">ONE OPERATING PLATFORM</span>
            <h2>من الهدف إلى النتيجة.<br>كل طبقة متصلة.</h2>
            <p>تصميم إنجاز يبدأ من الواقع التشغيلي للمؤسسة: منظمة، مساحة عمل، موظف رقمي، مهمة، خطة، أداة، موافقة، تنفيذ، ثم سجل تدقيق.</p>
          </div>
          <div class="sfx-mosaic">
            <article class="sfx-card sfx-card-dark sfx-card-large"><span class="card-no">01 / COMMAND CENTER</span><div><h3>مركز قيادة المؤسسة</h3><p>صورة تشغيلية واحدة تجمع حالة القوة العاملة والمهام والتنبيهات والموافقات وسير العمل.</p></div><div class="mini-command"><span>24</span><span>07</span><span>18</span><small>Tasks</small><small>Approvals</small><small>Workers</small></div></article>
            <article class="sfx-card sfx-card-coral"><span class="card-no">02 / WORKFORCE</span><div class="card-glyph">✦</div><h3>موظفون رقميون جاهزون للعمل.</h3><p>أدوار وأهداف ومهارات وأدوات واستقلالية وميزانية وسياسات.</p><a href="#workforce">استكشف القوة العاملة ←</a></article>
            <article class="sfx-card sfx-card-blue"><span class="card-no">03 / OPERATIONS</span><div class="flow-mini"><i>مهمة</i><b>→</b><i>خطة</i><b>→</b><i>تنفيذ</i></div><h3>العمليات تتحرك.</h3><p>خطط قابلة للفحص، إجراءات واضحة، وحالة يمكن متابعتها.</p></article>
            <article class="sfx-card sfx-card-lilac"><span class="card-no">04 / GOVERNANCE</span><div class="shield">◇</div><h3>استقلالية تحت السيطرة.</h3><p>صلاحيات وموافقات وسياسات وسجل تدقيق مدمجة في مسار التنفيذ.</p></article>
            <article class="sfx-card sfx-card-mint sfx-card-wide"><div><span class="card-no">05 / ANALYTICS</span><h3>لا تكتفِ بمعرفة ما حدث. افهم لماذا.</h3><p>اربط النشاط بالمهام والأدوار وسير العمل لتصنع رؤية تشغيلية قابلة للفعل.</p></div><div class="mini-bars"><i style="height:45%"></i><i style="height:64%"></i><i style="height:55%"></i><i style="height:82%"></i><i style="height:73%"></i><i style="height:94%"></i></div></article>
          </div>
        </div>
      </section>

      <section class="pp-section sfx-dark-section" id="workforce">
        <div class="pp-container sfx-workforce-grid">
          <div class="sfx-workforce-copy">
            <span class="pp-kicker">DIGITAL WORKFORCE</span>
            <h2>فريقك البشري<br><em>ليس وحده.</em></h2>
            <p>ابنِ أدوارًا رقمية متخصصة تعمل بجانب فرقك، مع حدود واضحة ومسؤولية قابلة للتدقيق.</p>
            <div class="sfx-equation"><span>Human</span><b>+</b><span>AI Employee</span><b>+</b><span>Governance</span></div>
          </div>
          <div class="sfx-worker-stage">
            <div class="sfx-worker-core"><span>إ</span><small>ENJAZ</small></div>
            <article class="sfx-worker-card worker-a"><span>01</span><b>مدير عمليات</b><small>تنسيق + تصعيد</small><em>WORKING</em></article>
            <article class="sfx-worker-card worker-b"><span>02</span><b>محلل أداء</b><small>بيانات + رؤى</small><em>READY</em></article>
            <article class="sfx-worker-card worker-c"><span>03</span><b>منسق خدمة</b><small>استجابة + متابعة</small><em>WORKING</em></article>
            <article class="sfx-worker-card worker-d"><span>04</span><b>منسق مشتريات</b><small>طلبات + توريد</small><em>READY</em></article>
          </div>
        </div>
      </section>

      <section class="pp-section sfx-process-section" id="operating-model">
        <div class="pp-container">
          <div class="pp-section-head center"><span class="pp-kicker">THE ENJAZ LOOP</span><h2>حلقة تشغيل لا تنقطع.</h2><p>من تعريف الهدف حتى النتيجة، ثم يعود التعلم إلى القرار التالي.</p></div>
          <div class="sfx-loop"><article><b>01</b><strong>هدف</strong><small>ما الذي نريد إنجازه؟</small></article><i>←</i><article><b>02</b><strong>خطة</strong><small>كيف سينفذ؟</small></article><i>←</i><article class="active"><b>03</b><strong>تنفيذ</strong><small>الأدوات تعمل ضمن الصلاحية.</small></article><i>←</i><article><b>04</b><strong>موافقة</strong><small>الإنسان يتدخل عند الحاجة.</small></article><i>←</i><article><b>05</b><strong>تدقيق</strong><small>كل خطوة لها أثر.</small></article>
          </div>
        </div>
      </section>

      <section class="pp-section sfx-industry-section" id="industries">
        <div class="pp-container">
          <div class="pp-section-head"><span class="pp-kicker">BUILT FOR THE REAL WORLD</span><h2>قطاعك يغيّر طريقة التشغيل.</h2><p>تبدأ المؤسسة من حزمة جاهزة لقطاعها، ثم توسّع الأدوار والعمليات حسب احتياجها.</p></div>
          <div class="sfx-industry-mosaic">
            <article class="industry restaurant"><span>01</span><div><small>INDUSTRY</small><h3>المطاعم</h3><p>الفروع · الطلبات · المخزون · المشتريات · الجودة</p></div><b>↗</b></article>
            <article class="industry hospital"><span>02</span><div><small>INDUSTRY</small><h3>المستشفيات</h3><p>المواعيد · التنسيق · الجودة · خدمة المرضى</p></div><b>↗</b></article>
            <article class="industry hotel"><span>03</span><div><small>INDUSTRY</small><h3>الفنادق</h3><p>الحجوزات · الضيافة · التشغيل · الخدمة</p></div><b>↗</b></article>
            <article class="industry enterprise"><span>04</span><div><small>INDUSTRY</small><h3>الشركات</h3><p>العمليات · المبيعات · الموارد · التقارير</p></div><b>↗</b></article>
            <article class="industry government"><span>05</span><div><small>INDUSTRY</small><h3>الجهات الحكومية</h3><p>الخدمات · المعاملات · الامتثال · المتابعة</p></div><b>↗</b></article>
          </div>
        </div>
      </section>

      <section class="pp-section sfx-governance" id="governance">
        <div class="pp-container sfx-governance-grid">
          <div><span class="pp-kicker">TRUST & GOVERNANCE</span><h2>قوة عمل رقمية<br><em>يمكن الوثوق بها.</em></h2><p>إنجاز لا تفصل الذكاء عن التحكم: الهوية والدور والهدف والمهارات والأدوات والنموذج والاستقلالية والميزانية والسياسة والموافقة والتدقيق.</p></div>
          <div class="sfx-governance-stack">
            <span>Identity</span><span>Role & Goals</span><span>Skills & Tools</span><span>Model Strategy</span><span>Autonomy</span><span>Budget</span><span>Policy</span><span>Human Approval</span><span>Audit Trail</span>
          </div>
        </div>
      </section>

      <section class="sfx-final">
        <div class="pp-container"><div class="sfx-final-box"><div><span class="pp-kicker">READY TO OPERATE</span><h2>لا تبنِ أداة أخرى.<br>ابنِ طبقة تشغيل مؤسستك.</h2><p>ابدأ بالمؤسسة والقطاع، ودع إنجاز يهيئ نقطة البداية.</p></div><button class="pp-btn primary sfx-big-btn" data-public-signup>ابدأ مع إنجاز <b>←</b></button></div></div>
      </section>
    </main>

    <footer class="pp-footer"><div class="pp-container pp-footer-inner"><div class="pp-brand"><span class="pp-mark">إ</span><span>إنجاز<small>INTELLIGENT OPERATING PLATFORM</small></span></div><div class="pp-footer-links"><a href="/privacy.html">الخصوصية</a><a href="/terms.html">شروط الاستخدام</a><button class="pp-btn ghost" data-public-login>دخول مساحة العمل</button></div></div></footer>
  </div>`;

  root.querySelectorAll('[data-public-login]').forEach(b=>b.addEventListener('click',()=>onLogin()));
  root.querySelectorAll('[data-public-signup]').forEach(b=>b.addEventListener('click',()=>onSignup()));

  const nav=root.querySelector('.sfx-nav-wrap');
  const onScroll=()=>nav?.classList.toggle('scrolled',window.scrollY>12);
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  const sections=[...root.querySelectorAll('main[id], section[id]')];
  const navLinks=[...root.querySelectorAll('.pp-links a[href^="#"]')];
  const syncActive=(id)=>{
    navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${id}`));
  };
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver((entries)=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible?.target?.id) syncActive(visible.target.id);
    },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.15,.4,.7]});
    sections.forEach(section=>observer.observe(section));
  }

  const revealTargets=root.querySelectorAll('.sfx-statement-grid,.sfx-card,.sfx-worker-copy,.sfx-worker-stage,.sfx-loop article,.industry,.sfx-governance-grid,.sfx-final-box');
  if('IntersectionObserver' in window){
    const reveal=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}
      });
    },{threshold:.12});
    revealTargets.forEach(el=>{el.classList.add('reveal');reveal.observe(el);});
  }

  const stage=root.querySelector('.sfx-hero-stage');
  if(stage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer:fine)').matches){
    stage.addEventListener('pointermove',(event)=>{
      const rect=stage.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      stage.style.setProperty('--mx',`${x*10}px`);
      stage.style.setProperty('--my',`${y*8}px`);
    });
    stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--mx','0px');stage.style.setProperty('--my','0px');});
  }

  const cleanup=()=>window.removeEventListener('scroll',onScroll);
  root.__enjazLandingCleanup=cleanup;
}
