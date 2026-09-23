import './enjaz-public-motion.js';

const sectors = [
  ['المطاعم', 'Restaurants', 'تشغيل الفروع والطلبات والمخزون'],
  ['المستشفيات', 'Hospitals', 'تنسيق الرعاية والجودة والعمليات'],
  ['الفنادق', 'Hotels', 'الضيافة والحجوزات وخدمة النزلاء'],
  ['الشركات', 'Companies', 'العمليات والمالية وخدمة العملاء'],
  ['الجهات الحكومية', 'Government', 'الخدمات والامتثال والتقارير']
];

const mount = () => {
  if (document.getElementById('enjaz-public')) return;
  const root = document.createElement('div');
  root.id = 'enjaz-public';
  root.innerHTML = `
    <header class="public-nav">
      <a class="public-brand" href="#top" aria-label="إنجاز الرئيسية"><span class="public-mark">إ</span><span><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE</small></span></a>
      <nav class="public-links" aria-label="التنقل الرئيسي">
        <button data-scroll="top">الرئيسية</button><button data-scroll="sectors">القطاعات</button><button data-scroll="workforce">القوى العاملة الرقمية</button><button data-scroll="how">كيف تعمل إنجاز</button>
      </nav>
      <div class="public-actions"><button class="public-login" data-auth="login">تسجيل الدخول</button><button class="public-nav-cta" data-auth="signup">ابدأ الآن</button></div>
      <button class="public-mobile-cta" data-auth="signup">ابدأ الآن</button>
    </header>
    <main id="top">
      <section class="public-hero">
        <div class="hero-copy enjaz-reveal"><div class="eyebrow">AI DIGITAL WORKFORCE · ENJAZ</div><h1>قوة العمل الرقمية<br><em>لمؤسسات المستقبل</em></h1><p>إنجاز تمنح مؤسستك فرقًا رقمية متخصصة تعمل إلى جانب فرقك البشرية، وتساعدك على تشغيل العمليات وتحليل البيانات وتنفيذ المهام بكفاءة.</p><div class="hero-actions"><button class="primary" data-auth="signup">استكشف إنجاز</button><button class="ghost" data-demo>شاهد Production Demo <span>↗</span></button></div><div class="hero-proof"><span>●</span><span>تشغيل مؤسسي آمن</span><i></i><span>5 قطاعات</span><i></i><span>24/7 تنفيذ</span></div></div>
        <div class="workforce-stage enjaz-reveal" aria-label="عرض تفاعلي للقوة العاملة الرقمية"><div class="browser-chrome"><span class="browser-dots"><i></i><i></i><i></i></span><span class="browser-url">app.enjaz.ai / command-center</span><span class="browser-actions">↗　＋　◫</span></div><div class="product-preview"><aside class="preview-rail"><strong>إ</strong><span class="active">▦</span><span>◌</span><span>✓</span><span>◈</span></aside><div class="preview-main"><div class="preview-top"><span>مركز قيادة إنجاز</span><small><b></b> متصل الآن　◉</small></div><div class="preview-title"><div><small>ENJAZ WORKFORCE OS</small><h3>إدارة المطاعم — قوة العمل الرقمية</h3></div><span>هذا الأسبوع　⌄</span></div><div class="preview-grid"><section class="agent-stack"><div class="preview-label">الموظفون الرقميون <b>12</b></div><article><span class="agent-icon blue">◒</span><div><strong>مدير المطعم AI</strong><small>تحليل أداء الفروع</small></div><em>94%</em></article><article><span class="agent-icon teal">⌁</span><div><strong>مشرف العمليات AI</strong><small>تنسيق 48 مهمة نشطة</small></div><em>يعمل الآن</em></article><article><span class="agent-icon violet">◈</span><div><strong>منسق المشتريات AI</strong><small>مراجعة 16 طلب توريد</small></div><em>يعمل الآن</em></article><div class="agent-flow"><span></span><i></i><span></span><i></i><span></span></div></section><section class="preview-chart"><div class="preview-label">أداء العمليات <b>+18.4%</b></div><strong>94<span>%</span></strong><small>مقارنة بالأسبوع الماضي</small><div class="chart-bars"><i style="height:34%"></i><i style="height:48%"></i><i style="height:42%"></i><i style="height:66%"></i><i style="height:58%"></i><i style="height:82%"></i><i style="height:94%"></i></div><div class="chart-line"></div></section></div></div></div><div class="stage-command"><span>AI COMMAND CENTER</span><strong>من الفكرة إلى النتيجة، تلقائيًا.</strong></div><div class="stage-metrics"><div><b>12</b><span>موظف رقمي</span></div><div><b>94%</b><span>أداء العمليات</span></div><div><b>3</b><span>فروع متصلة</span></div></div></div>
      </section>
      <section id="sectors" class="public-section sectors-section"><div class="section-heading"><div><div class="eyebrow">BUILT FOR YOUR BUSINESS</div><h2>قوة رقمية تفهم قطاعك.</h2></div><p>اختر بيئة العمل التي تناسب مؤسستك، وسيجهّز إنجاز الموظفين والعمليات التي تحتاجها.</p></div><div class="sector-grid">${sectors.map(([ar,en,desc]) => `<button class="sector-item" data-sector="${en}"><span class="sector-index">0${sectors.indexOf(sectors.find(s=>s[1]===en))+1}</span><span><strong>${ar}</strong><small>${en} · ${desc}</small></span><b>↗</b></button>`).join('')}</div></section>
      <section id="workforce" class="public-section workforce-section"><div class="section-heading centered"><div><div class="eyebrow">ONE OPERATING SYSTEM</div><h2>لا توظف أداة.<br><em>وظّف قوة رقمية.</em></h2></div><p>من اختيار القطاع إلى تشغيل العمليات وقياس النتائج، تعمل منظومة إنجاز كطبقة تشغيل ذكية لمؤسستك.</p></div><div class="workforce-flow"><span>Sector</span><i>→</i><span>Roles</span><i>→</i><span>Digital Employees</span><i>→</i><span>Operations</span><i>→</i><strong>Results</strong></div></section>
      <section id="how" class="public-section how-section"><div class="section-heading"><div><div class="eyebrow">HOW ENJAZ WORKS</div><h2>ابدأ بخطوة.<br><em>وتوسع بثقة.</em></h2></div></div><div class="steps-grid"><article><b>01</b><strong>اختر القطاع</strong><p>حدّد بيئة العمل التي تريد تشغيلها.</p></article><article><b>02</b><strong>كوّن فريقك الرقمي</strong><p>اختر الأدوار الجاهزة لمؤسستك.</p></article><article><b>03</b><strong>اربط عملياتك</strong><p>دع الموظفين الرقميين ينفذون العمل.</p></article><article><b>04</b><strong>راقب النتائج</strong><p>قرارات أوضح وأداء قابل للقياس.</p></article></div></section>
      <section class="final-cta"><div><div class="eyebrow">READY WHEN YOU ARE</div><h2>حوّل مؤسستك إلى<br><em>مؤسسة تعمل بذكاء.</em></h2></div><button class="primary" data-auth="signup">ابدأ تجربة إنجاز <span>↗</span></button></section>
    </main>
    <footer class="public-footer"><span>© 2026 ENJAZ</span><span>Digital Workforce Operating System</span></footer>`;
  document.body.append(root);
  root.querySelectorAll('[data-scroll]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })));
  root.querySelectorAll('[data-auth]').forEach((button) => button.addEventListener('click', () => { const url = new URL(location.href); url.search = ''; url.searchParams.set('auth', '1'); if (button.dataset.auth === 'signup') url.searchParams.set('signup', '1'); location.href = url.toString(); }));
  root.querySelector('[data-demo]')?.addEventListener('click', () => { const url = new URL(location.href); url.search = ''; url.searchParams.set('demo', '1'); location.href = url.toString(); });
  window.dispatchEvent(new CustomEvent('enjaz:public-mounted'));
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
export { mount };
