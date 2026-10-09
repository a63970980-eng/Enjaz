import { lazy, Suspense, useEffect, useState } from 'react';

const WorkspaceApp = lazy(() => import('./WorkspaceApp'));
import {
  ArrowDownLeft, ArrowLeft, ArrowUpLeft, BadgeCheck, BarChart3, Bot,
  Building2, Check, ChevronDown, CircleHelp, Clock3, Command, FileCheck2,
  Globe2, Layers3, LockKeyhole, Menu, MessageSquareText, Play, ShieldCheck,
  Sparkles, Workflow, X, Zap,
} from 'lucide-react';

const sectors = [
  { icon: Building2, title: 'الشركات', detail: 'التشغيل والإدارة والفرق' },
  { icon: Layers3, title: 'المطاعم', detail: 'الطلبات والمخزون والجودة' },
  { icon: ShieldCheck, title: 'المستشفيات', detail: 'التنسيق والخدمات الإدارية' },
  { icon: Globe2, title: 'الفنادق', detail: 'الضيافة وتجربة النزلاء' },
  { icon: BadgeCheck, title: 'الجهات الحكومية', detail: 'الخدمات والعمليات' },
];

const capabilities = [
  { icon: Bot, title: 'موظفون رقميون متخصصون', body: 'أدوار واضحة ومهارات وأدوات وصلاحيات محددة لكل موظف.' },
  { icon: Workflow, title: 'سير عمل قابل للتتبع', body: 'من الطلب والتخطيط إلى التنفيذ والمراجعة والتسليم.' },
  { icon: ShieldCheck, title: 'حوكمة من البداية', body: 'موافقات على الإجراءات الحساسة وسجل تدقيق لكل خطوة.' },
];

const work = [
  { number: '01', title: 'حدد النتيجة المطلوبة', text: 'صف العمل المطلوب والقيود والموعد النهائي.' },
  { number: '02', title: 'ينسق إنجاز التنفيذ', text: 'تُسند المهام إلى الموظف الرقمي المناسب وتُتابع خطواتها.' },
  { number: '03', title: 'راجع واعتمد', text: 'تظهر النتائج والأدلة والاستثناءات للمراجعة البشرية.' },
];

function App() {
  const [appRoute, setAppRoute] = useState(() => window.location.hash === '#app');
  useEffect(() => {
    const syncRoute = () => setAppRoute(window.location.hash === '#app');
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSector, setActiveSector] = useState('الشركات');
  const [previewOpen, setPreviewOpen] = useState(false);

  if (appRoute) return <Suspense fallback={<div className="wa-full-loader">جارٍ تحميل مساحة العمل…</div>}><WorkspaceApp onBack={() => { window.location.hash = '#home'; }} /></Suspense>;


  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="إنجاز — الصفحة الرئيسية" onClick={closeMenu}>
          <span className="brand-mark"><Command size={21} strokeWidth={2.6} /></span>
          <span className="brand-word">إنجاز<span className="brand-dot">.</span><small>ENJAZ WORKFORCE</small></span>
        </a>
        <button className="mobile-menu-button" aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="التنقل الرئيسي">
          <a href="#platform" onClick={closeMenu}>المنصة</a>
          <a href="#how-it-works" onClick={closeMenu}>كيف يعمل</a>
          <a href="#sectors" onClick={closeMenu}>القطاعات</a>
          <a href="#governance" onClick={closeMenu}>الحوكمة والأمان</a>
        </nav>
        <div className="header-actions">
          <a className="login-link" href="#app">دخول المنصة</a>
          <a className="button button-dark button-small" href="#platform">اكتشف إنجاز <ArrowLeft size={15} /></a>
        </div>
      </header>

      <section className="hero section-wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> منصة تشغيل للقوى العاملة الرقمية</div>
          <h1>أعمالك تتحرك.<br /><span>وموظفوك الرقميون</span><br />ينجزون العمل.</h1>
          <p className="hero-description">إنجاز يربط الموظفين البشريين والرقميين في منظومة تشغيل واحدة — من توزيع المهام إلى التنفيذ والمراجعة، مع وضوح كامل في الصلاحيات والنتائج.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#platform">اكتشف المنصة <ArrowLeft size={17} /></a>
            <button className="button button-light" onClick={() => setPreviewOpen(!previewOpen)} aria-expanded={previewOpen}><Play size={16} /> {previewOpen ? 'إغلاق المعاينة' : 'شاهد معاينة المنتج'}</button>
          </div>
          <div className="hero-trust">
            <span><Check size={15} /> صلاحيات محددة</span>
            <span><Check size={15} /> تنفيذ قابل للتتبع</span>
            <span><Check size={15} /> إشراف بشري</span>
          </div>
        </div>

        <div className="product-stage" id="platform">
          <div className="stage-glow" />
          <div className="stage-topline"><span><span className="live-dot" /> معاينة تجربة المنتج</span><span className="preview-pill">PREVIEW</span></div>
          <div className="workspace-window">
            <aside className="preview-sidebar">
              <div className="mini-brand"><span className="brand-mark tiny"><Command size={14} /></span><span>إنجاز</span></div>
              <div className="sidebar-label">مساحة العمل</div>
              <div className="side-item active"><Layers3 size={15} /> مركز العمليات</div>
              <div className="side-item"><Bot size={15} /> الموظفون الرقميون</div>
              <div className="side-item"><Workflow size={15} /> سير العمل</div>
              <div className="side-item"><FileCheck2 size={15} /> الموافقات</div>
              <div className="side-item"><BarChart3 size={15} /> التقارير</div>
              <div className="sidebar-bottom"><LockKeyhole size={14} /> مساحة عمل محمية</div>
            </aside>
            <div className="preview-main">
              <div className="preview-heading"><div><small>مساحة العمل / مركز العمليات</small><h3>نظرة عامة على العمل</h3></div><span className="avatar">م</span></div>
              <div className="preview-summary">
                <div><span>حالة سير العمل</span><strong><i className="status-dot green" /> جاهز للمراجعة</strong></div>
                <div><span>الإشراف</span><strong><ShieldCheck size={15} /> مفعّل</strong></div>
              </div>
              <div className="preview-task-head"><strong>سير العمل الحالي</strong><span>عرض توضيحي</span></div>
              <div className="task-flow">
                <div className="flow-node complete"><span className="flow-icon"><Check size={15} /></span><div><strong>استلام الطلب</strong><small>تم التحقق من المدخلات</small></div><BadgeCheck size={16} className="node-check" /></div>
                <div className="flow-connector" />
                <div className="flow-node complete"><span className="flow-icon"><Bot size={16} /></span><div><strong>الموظف الرقمي</strong><small>جمع المعلومات وتنظيمها</small></div><BadgeCheck size={16} className="node-check" /></div>
                <div className="flow-connector" />
                <div className="flow-node waiting"><span className="flow-icon"><FileCheck2 size={16} /></span><div><strong>مراجعة بشرية</strong><small>بانتظار اعتماد المسؤول</small></div><Clock3 size={16} className="node-wait" /></div>
              </div>
              <div className="preview-foot"><span><LockKeyhole size={13} /> إجراء حساس — يتطلب موافقة</span><span>تفاصيل المهمة <ArrowUpLeft size={13} /></span></div>
            </div>
          </div>
          <div className="floating-note note-top"><span className="note-icon"><Sparkles size={16} /></span><span><strong>تخطيط منظم</strong><small>خطوات واضحة لكل مهمة</small></span></div>
          <div className="floating-note note-bottom"><span className="note-icon green-note"><ShieldCheck size={17} /></span><span><strong>حوكمة مدمجة</strong><small>القرار النهائي بيدك</small></span></div>
          {previewOpen && <div className="preview-caption" role="status">هذه معاينة توضيحية للواجهة وليست بيانات تشغيل حقيقية.</div>}
        </div>
      </section>

      <section className="principles-strip" aria-label="مبادئ المنصة">
        <div><ShieldCheck size={18} /><span>الأمان والحوكمة</span></div>
        <div><Workflow size={18} /><span>تنسيق سير العمل</span></div>
        <div><MessageSquareText size={18} /><span>تعاون البشر والذكاء الاصطناعي</span></div>
        <div><BarChart3 size={18} /><span>رؤية تشغيلية واضحة</span></div>
      </section>

      <section className="section-wrap section-block" id="how-it-works">
        <div className="section-heading"><div><div className="eyebrow">طريقة العمل</div><h2>من الطلب إلى الإنجاز.<br /><span>بخطوات يمكن تتبعها.</span></h2></div><p>لا صندوق أسود ولا تنفيذ بلا حدود. كل مهمة لها هدف وخطوات وحالة واضحة، وكل إجراء حساس يخضع للسياسة المعتمدة.</p></div>
        <div className="steps-grid">{work.map((item) => <article className="step-card" key={item.number}><span className="step-number">{item.number}</span><div className="step-arrow"><ArrowDownLeft size={19} /></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className="sectors-section" id="sectors">
        <div className="section-wrap section-block">
          <div className="section-heading"><div><div className="eyebrow">منظومة واحدة لقطاعات متعددة</div><h2>موظفون رقميون.<br /><span>سياق يناسب كل مؤسسة.</span></h2></div><p>الدور الأساسي قابل لإعادة الاستخدام؛ ويتخصص حسب معرفة المؤسسة ومهاراتها وأدواتها وسياساتها وصلاحياتها.</p></div>
          <div className="sector-layout">
            <div className="sector-list" role="tablist" aria-label="اختر القطاع">{sectors.map(({ icon: Icon, title, detail }) => <button key={title} role="tab" aria-selected={activeSector === title} className={activeSector === title ? 'sector-item selected' : 'sector-item'} onClick={() => setActiveSector(title)}><span className="sector-icon"><Icon size={19} /></span><span className="sector-text"><strong>{title}</strong><small>{detail}</small></span><ArrowLeft size={16} className="sector-arrow" /></button>)}</div>
            <div className="sector-detail" role="tabpanel">
              <div className="sector-detail-top"><span className="detail-kicker">سياق القطاع المختار</span><span className="detail-symbol"><Building2 size={22} /></span></div>
              <h3>{activeSector}</h3>
              <p>تُهيّأ الأدوار الرقمية للعمل ضمن إجراءات هذا القطاع، مع حدود واضحة للمهام والبيانات والأدوات المتاحة.</p>
              <div className="sector-tags"><span>المهارات</span><span>المعرفة</span><span>الأدوات</span><span>السياسات</span><span>الصلاحيات</span></div>
              <div className="detail-note"><Check size={16} /><span>موظف رقمي واحد يمكنه العمل عبر القطاعات عند تهيئته بالسياق والصلاحيات المناسبة.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap section-block" id="governance">
        <div className="section-heading"><div><div className="eyebrow">التشغيل بمسؤولية</div><h2>قدرات ذكية.<br /><span>وضوابط مؤسسية.</span></h2></div><p>الذكاء الاصطناعي جزء من النظام، لكنه لا يلغي سياسات المؤسسة ولا صلاحيات أصحاب القرار.</p></div>
        <div className="capabilities-grid">{capabilities.map(({ icon: Icon, title, body }) => <article className="capability-card" key={title}><span className="capability-icon"><Icon size={21} /></span><h3>{title}</h3><p>{body}</p><a href="#contact">اعرف المزيد <ArrowLeft size={15} /></a></article>)}</div>
      </section>

      <section className="closing-cta section-wrap" id="contact">
        <div className="cta-pattern" aria-hidden="true"><div /><div /><div /></div>
        <div className="cta-content"><span className="cta-eyebrow"><Zap size={15} /> ابدأ ببناء طريقة عمل أفضل</span><h2>امنح فريقك مساحة<br />للعمل الأكثر قيمة.</h2><p>استكشف كيف يمكن للموظفين الرقميين دعم عمليات مؤسستك، مع بقاء التحكم والقرار في يد فريقك.</p><a className="button button-white" href="#platform">استكشف معاينة المنصة <ArrowLeft size={16} /></a></div>
        <div className="cta-seal"><Command size={54} /><span>إنجاز</span><small>العمل يتحرك بوضوح</small></div>
      </section>

      <footer className="site-footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Command size={19} /></span><span className="brand-word">إنجاز<span className="brand-dot">.</span><small>ENJAZ WORKFORCE</small></span></a><span>منصة تشغيل الموظفين الرقميين.</span><div className="footer-links"><a href="#governance">الأمان والحوكمة</a><a href="#contact">تواصل معنا</a><a href="#home">العودة للأعلى <ArrowUpLeft size={13} /></a></div><span className="copyright">© {new Date().getFullYear()} ENJAZ</span></footer>
    </main>
  );
}

export default App;
