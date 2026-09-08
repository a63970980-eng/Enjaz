(() => {
  const addPublicExperience = () => {
    const root = document.getElementById('enjaz-public');
    if (!root || root.dataset.experienceEnhanced) return;
    root.dataset.experienceEnhanced = '1';
    const main = root.querySelector('main');
    const footer = root.querySelector('.public-footer');
    if (!main || !footer) return;
    const section = document.createElement('section');
    section.className = 'public-section experience-industries';
    section.innerHTML = `<div class="public-section-inner"><div class="section-eyebrow">READY-MADE DIGITAL WORKFORCE</div><h2>ابدأ بموظفين يعرفون وظيفتهم.</h2><p class="section-lead">لا تبدأ من شاشة فارغة. اختر قوة عمل رقمية جاهزة، ثم خصص السياسات والأدوات والصلاحيات لتناسب طريقة عمل شركتك.</p><div class="industry-grid"><article><span>01</span><strong>المطاعم</strong><p>خدمة العملاء، الحجوزات، العمليات، المشتريات والمتابعة اليومية.</p><button data-auth="signup">استكشف القوة →</button></article><article><span>02</span><strong>الفنادق</strong><p>الحجوزات، الاستقبال، خدمة النزلاء، التنسيق والتشغيل.</p><button data-auth="signup">استكشف القوة →</button></article><article><span>03</span><strong>المستشفيات</strong><p>التنسيق الإداري، المواعيد، خدمة المرضى والعمليات المساندة.</p><button data-auth="signup">استكشف القوة →</button></article><article><span>04</span><strong>الشركات والمؤسسات</strong><p>المبيعات، الموارد البشرية، المالية، العمليات والتحليلات.</p><button data-auth="signup">استكشف القوة →</button></article><article><span>05</span><strong>القطاع الحكومي</strong><p>الخدمات، استقبال الطلبات، التوجيه، المتابعة وسجل الإجراءات.</p><button data-auth="signup">استكشف القوة →</button></article></div></div>`;
    footer.before(section);
    section.querySelectorAll('[data-auth]').forEach(b => b.addEventListener('click', () => { const u = new URL(location.href); u.search=''; u.searchParams.set('auth','1'); u.searchParams.set('signup','1'); location.href=u.toString(); }));
  };
  const enhanceApp = () => {
    if (document.getElementById('enjaz-public')) return;
    const main = document.querySelector('.enjaz-main');
    if (!main || document.querySelector('.enjaz-experience-banner')) return;
    const top = document.querySelector('.enjaz-topbar');
    if (!top) return;
    const banner = document.createElement('div');
    banner.className = 'enjaz-experience-banner';
    banner.innerHTML = `<div><span>ENJAZ OPERATING SYSTEM</span><strong>قوة العمل الرقمية في مكان واحد</strong><small>أدر الموظفين، المهام، سير العمل، الموافقات والتكاملات من طبقة تشغيل واحدة.</small></div><div class="experience-banner-actions"><button data-nav-jump="employees">الموظفون الرقميون</button><button data-nav-jump="workflows">بناء سير عمل</button></div>`;
    top.after(banner);
    banner.querySelectorAll('[data-nav-jump]').forEach(b => b.addEventListener('click', () => document.querySelector(`[data-nav="${b.dataset.navJump}"]`)?.click()));
  };
  const observer = new MutationObserver(() => { addPublicExperience(); enhanceApp(); });
  observer.observe(document.body, {childList:true, subtree:true});
  addPublicExperience(); enhanceApp();
})();
