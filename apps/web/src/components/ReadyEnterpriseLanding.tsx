import { ArrowLeft, ArrowUpRight, Bot, BrainCircuit, Check, ChevronDown, GitBranch, Hospital, Hotel, Landmark, Network, Play, ShieldCheck, Sparkles, Workflow } from "lucide-react";

const integrations = ["OpenAI", "GitHub", "Vercel", "Supabase", "n8n", "Slack"];

const sectors = [
  { icon: Hospital, title: "المستشفيات", text: "تشغيل منسق للفرق والعمليات والخدمات الحرجة." },
  { icon: Hotel, title: "الفنادق", text: "ربط التشغيل والخدمة والمخزون والمهام في منظومة واحدة." },
  { icon: Landmark, title: "الجهات الحكومية", text: "حوكمة واضحة، سير عمل، واعتمادات قابلة للتتبع." },
  { icon: Network, title: "الشركات", text: "تنسيق الأعمال والبيانات والقوى العاملة الرقمية." },
  { icon: Workflow, title: "المطاعم", text: "تشغيل الفروع والطلبات والمخزون والجودة." },
];

const workers = [
  ["AI Manager", "يدير الأولويات والقرارات التشغيلية", BrainCircuit],
  ["AI Analyst", "يحلل البيانات ويكشف ما يحتاج إلى قرار", Sparkles],
  ["AI Operations Worker", "ينفذ الأعمال المتكررة عبر الأدوات", Workflow],
  ["AI Coordinator", "ينسق المهام بين الفرق والأنظمة", Network],
  ["AI Customer Service Worker", "يتعامل مع الخدمة والمتابعة", Bot],
];

export default function ReadyEnterpriseLanding() {
  return (
    <div className="enjaz-page" dir="rtl">
      <header className="enjaz-nav">
        <a className="enjaz-brand" href="#" aria-label="إنجاز">
          <span className="enjaz-mark">إ</span><span>إنجاز</span>
        </a>
        <nav>
          <a href="#platform">المنصة</a>
          <a href="#workforce">القوة العاملة</a>
          <a href="#sectors">القطاعات</a>
          <a href="#governance">الحوكمة</a>
        </nav>
        <div className="enjaz-nav-actions">
          <a href="?auth=login" className="enjaz-login">تسجيل الدخول</a>
          <a href="#contact" className="enjaz-button enjaz-button-small">ابدأ الآن <ArrowLeft size={15}/></a>
        </div>
      </header>

      <main>
        <section className="enjaz-hero">
          <div className="enjaz-hero-copy">
            <div className="enjaz-eyebrow"><span className="enjaz-live-dot"/> منصة تشغيل مؤسسية مدعومة بالذكاء الاصطناعي</div>
            <h1>شغّل مؤسستك بقوة <span>الذكاء الاصطناعي.</span></h1>
            <p>إنجاز يوحّد القوى العاملة البشرية والرقمية والعمليات وسير العمل والحوكمة في منصة واحدة مصممة للتشغيل الفعلي.</p>
            <div className="enjaz-actions">
              <a href="#contact" className="enjaz-button">ابدأ مع إنجاز <ArrowLeft size={17}/></a>
              <a href="#preview" className="enjaz-button enjaz-button-ghost"><Play size={15} fill="currentColor"/> شاهد المنصة</a>
            </div>
            <div className="enjaz-trust-line"><ShieldCheck size={16}/> صلاحيات • سياسات • موافقات • سجل تدقيق</div>
          </div>
          <div className="enjaz-hero-visual">
            <div className="enjaz-glow"/>
            <div className="enjaz-orbit orbit-one"/>
            <div className="enjaz-orbit orbit-two"/>
            <div className="enjaz-dashboard">
              <div className="dash-top"><span>ENJAZ OPERATIONS</span><span className="dash-status"><i/> النظام جاهز</span></div>
              <div className="dash-grid">
                <div className="dash-main">
                  <div className="dash-title">مركز التشغيل</div>
                  <div className="dash-sub">توجيه الأعمال بين البشر والوكلاء والأنظمة</div>
                  <div className="flow-row"><div className="flow-node active"><BrainCircuit size={18}/><b>AI Manager</b><small>تخطيط</small></div><div className="flow-line"/><div className="flow-node"><Workflow size={18}/><b>Workflow</b><small>تنفيذ</small></div><div className="flow-line"/><div className="flow-node"><Check size={18}/><b>Approval</b><small>اعتماد</small></div></div>
                </div>
                <div className="dash-side"><span>PREVIEW</span><strong>48</strong><small>Digital Workers</small><div className="mini-bars"><i/><i/><i/><i/><i/></div></div>
              </div>
              <div className="dash-footer"><span>Human Workforce</span><span>Digital Workforce</span><span>Integrations</span><span>Governance</span></div>
            </div>
          </div>
        </section>

        <section className="enjaz-logo-strip" aria-label="تكاملات">
          <span>يتصل إنجاز بأدوات عملك الحالية</span>
          <div>{integrations.map((name)=><b key={name}>{name}</b>)}</div>
        </section>

        <section id="preview" className="enjaz-section enjaz-preview-section">
          <div className="enjaz-section-head"><div><span className="enjaz-kicker">PRODUCT PREVIEW</span><h2>من الفكرة إلى التشغيل في مساحة واحدة.</h2></div><p>واجهة توضح كيف تتعاون القوى العاملة البشرية والرقمية مع العمليات والأدوات والحوكمة.</p></div>
          <div className="enjaz-preview">
            <aside><div className="preview-brand">إنجاز</div>{["نظرة عامة","القوة العاملة","العمليات","سير العمل","الحوكمة"].map((x,i)=><div className={i===0?"active":""} key={x}>{x}</div>)}<div className="preview-user">المؤسسة<br/><b>مساحة العمل</b></div></aside>
            <div className="preview-body"><div className="preview-header"><div><small>الأحد، 4 أكتوبر</small><h3>مركز القيادة</h3></div><button><Sparkles size={15}/> اسأل إنجاز</button></div><div className="preview-cards"><article><small>WORKFLOWS</small><strong>12</strong><span>سير عمل قيد التشغيل</span></article><article><small>DIGITAL WORKFORCE</small><strong>48</strong><span>موظفًا رقميًا متاحًا</span></article><article><small>GOVERNANCE</small><strong>ACTIVE</strong><span>السياسات والموافقات مفعلة</span></article></div><div className="preview-table"><div><b>مهمة تشغيلية</b><span>المسؤول</span><span>الحالة</span></div>{["مراجعة طلبات الفرع","تحليل المخزون","تحديث تقرير الإدارة","اعتماد سير العمل"].map((x,i)=><div key={x}><b>{x}</b><span>{["AI Analyst","AI Operations","AI Manager","Human Approval"][i]}</span><span className="pill">قيد المعالجة</span></div>)}</div></div>
          </div>
        </section>

        <section id="platform" className="enjaz-section">
          <div className="enjaz-section-head centered"><span className="enjaz-kicker">ENJAZ PLATFORM</span><h2>كل ما تحتاجه المؤسسة للتشغيل.</h2><p>طبقة تشغيل واحدة تربط الأشخاص والذكاء الاصطناعي والعمليات والبيانات والأدوات.</p></div>
          <div className="enjaz-bento"><article className="bento-wide dark"><div><Sparkles/><span>AI OPERATING LAYER</span><h3>ذكاء يفهم سياق المؤسسة، لا مجرد أوامر منفصلة.</h3></div><div className="agent-stack"><i>AI Manager</i><i>AI Analyst</i><i>AI Operations</i><i>AI Coordinator</i></div></article><article><GitBranch/><span>WORKFLOWS</span><h3>حوّل العمل إلى سير عمل قابل للتنفيذ.</h3><p>خطوات، شروط، أدوات، موافقات ومسارات واضحة.</p></article><article><ShieldCheck/><span>GOVERNANCE</span><h3>تحكم مؤسسي من البداية.</h3><p>سياسات وصلاحيات واعتمادات وسجل تدقيق.</p></article></div>
        </section>

        <section id="workforce" className="enjaz-section workforce-section">
          <div className="enjaz-section-head"><div><span className="enjaz-kicker">DIGITAL WORKFORCE</span><h2>48 موظفًا رقميًا. منظومة واحدة.</h2></div><p>الموظف نفسه يعمل عبر القطاعات، ويتخصص حسب السياق والمهارات والمعرفة والأدوات والسياسات والصلاحيات.</p></div>
          <div className="worker-grid">{workers.map(([name,text,Icon])=><article key={name}><div className="worker-icon"><Icon size={19}/></div><span>AI EMPLOYEE</span><h3>{name}</h3><p>{text}</p><ArrowUpRight size={17}/></article>)}</div>
        </section>

        <section id="sectors" className="enjaz-section sectors-section">
          <div className="enjaz-section-head centered"><span className="enjaz-kicker">INDUSTRIES</span><h2>مصمم لواقع المؤسسات.</h2><p>السياق الصناعي يتغير، بينما منصة التشغيل تبقى واحدة.</p></div>
          <div className="sector-grid">{sectors.map(({icon:Icon,title,text})=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p><ArrowLeft size={16}/></article>)}</div>
        </section>

        <section id="governance" className="enjaz-governance">
          <div><span className="enjaz-kicker">OPERATIONS & GOVERNANCE</span><h2>الذكاء الاصطناعي بقوة المؤسسة، وبانضباطها.</h2><p>كل تنفيذ يمكن أن يمر عبر السياسة المناسبة، والصلاحية المناسبة، والموافقة المناسبة، مع أثر قابل للمراجعة.</p><a href="#contact" className="enjaz-text-link">اكتشف الحوكمة <ArrowLeft size={16}/></a></div>
          <div className="governance-card"><div className="shield"><ShieldCheck size={34}/></div><b>Execution Control</b><span>Policy → Permission → Approval → Execution → Audit</span><div className="control-line"><i/><i/><i/><i/><i/></div></div>
        </section>

        <section id="contact" className="enjaz-cta"><div className="enjaz-kicker">ENJAZ</div><h2>اجعل مؤسستك جاهزة للعمل بطريقة جديدة.</h2><p>ابدأ ببنية تشغيل واحدة، ثم وسّعها عبر الفرق والقطاعات والعمليات.</p><a href="?auth=login" className="enjaz-button">ابدأ الآن <ArrowLeft size={17}/></a></section>
      </main>

      <footer className="enjaz-footer"><div><a className="enjaz-brand" href="#"><span className="enjaz-mark">إ</span><span>إنجاز</span></a><p>منصة تشغيل مؤسسية للقوى العاملة والعمليات والذكاء الاصطناعي.</p></div><div><b>المنصة</b><a href="#platform">المنصة</a><a href="#workforce">القوة العاملة</a><a href="#governance">الحوكمة</a></div><div><b>القطاعات</b>{sectors.slice(0,3).map(s=><a href="#sectors" key={s.title}>{s.title}</a>)}</div><div><b>تواصل</b><a href="?auth=login">تسجيل الدخول</a><a href="#contact">ابدأ الآن</a></div><div className="footer-bottom">© {new Date().getFullYear()} ENJAZ. جميع الحقوق محفوظة.</div></footer>
    </div>
  );
}
