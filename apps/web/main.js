const params=new URLSearchParams(window.location.search);
const authRoute=params.has('auth');

const report=(scope,error)=>console.error(`[ENJAZ_${scope}]`,error);
const loadOptional=(path,loader)=>loader().catch(error=>report('MODULE',`${path}: ${error?.message||error}`));

// The public landing is a critical path. Never leave the initial boot placeholder
// visible just because an enhancement module fails to load.
const renderPublicFallback=()=>{
  if(document.getElementById('enjaz-public')||document.getElementById('enjaz-public-fallback'))return;
  const content=document.getElementById('content');
  if(content)content.innerHTML='';
  const mount=document.createElement('div');
  mount.id='enjaz-public-fallback';
  mount.innerHTML=`<nav class="public-nav"><a class="public-brand" href="#top"><span class="public-mark">إ</span><span><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE OS</small></span></a><div class="public-links"><a class="public-login" data-auth="login" href="?auth=1">تسجيل الدخول</a><button class="public-nav-cta" data-auth="signup">ابدأ مجانًا</button></div><button class="public-mobile-cta" data-auth="signup">ابدأ</button></nav><main id="top"><section class="public-hero"><div class="hero-copy"><div class="public-kicker"><i></i><span>نظام تشغيل القوة العاملة الرقمية</span><b>NEW</b></div><h1>حوّل الذكاء الاصطناعي<br><span>إلى قوة عمل حقيقية.</span></h1><p>إنجاز يمنح شركتك موظفين رقميين متخصصين، لكل منهم وظيفة ومهارات وأدوات وذاكرة وصلاحيات وأهداف. يعملون داخل عملياتك، ينفذون العمل، ويرفعون القرارات التي تحتاج إلى الإنسان.</p><div class="public-actions"><button class="public-primary" data-auth="signup">ابدأ ببناء قوة العمل الرقمية <span>←</span></button><button class="public-secondary" data-scroll="workforce"><span class="play">▶</span> شاهد كيف يعمل إنجاز</button></div><div class="public-trust-line"><span>✓ بدون تعقيد في البداية</span><span>✓ تحكم وصلاحيات</span><span>✓ مصمم للشركات</span></div></div><div class="workforce-stage"><div class="stage-glow glow-one"></div><div class="stage-glow glow-two"></div><div class="stage-top"><span class="stage-title"><i class="pulse"></i> Digital Workforce</span><span class="live">● LIVE</span></div><div class="stage-command"><span class="command-icon">✦</span><div><small>إنجاز الآن</small><strong>إدارة عمليات الشركة</strong></div><span class="command-status">يعمل</span></div><div class="employee-panel featured"><div class="employee-row"><span class="employee-avatar avatar-s">س</span><div><strong>سارة</strong><small>مديرة خدمة العملاء · تعمل الآن</small></div><span class="mini-dot"></span></div><div class="task-line"><b>المهمة الحالية</b><span>معالجة طلب العميل وتحديث الحالة ثم إرسال النتيجة.</span></div><div class="task-flow"><span class="done">فهم الطلب</span><em>→</em><span class="done">التحقق</span><em>→</em><span class="active">التنفيذ</span><em>→</em><span>النتيجة</span></div></div><div class="employee-panel compact"><div class="employee-row"><span class="employee-avatar avatar-o">ع</span><div><strong>عمر · مدير العمليات</strong><small>يراقب سير العمل والقرارات</small></div><span class="approval-pill">اعتماد مطلوب</span></div></div><div class="stage-metrics"><div><strong>60+</strong><span>موظف جاهز</span></div><div><strong>24/7</strong><span>تشغيل مستمر</span></div><div><strong>1</strong><span>منصة واحدة</span></div></div></div></section><section class="logo-strip"><span>مصمم لفرق</span><div><b>المطاعم</b><b>الفنادق</b><b>الصحة</b><b>التجزئة</b><b>المالية</b><b>العمليات</b><b>الحكومة</b></div></section><section class="public-section workforce-section" id="workforce"><div class="public-section-inner"><div class="section-eyebrow">YOUR DIGITAL TEAM</div><h2>لا تبدأ من الصفر.</h2><p class="section-lead">اختر موظفًا رقميًا جاهزًا لدوره، ثم اربطه ببيانات شركتك وأدواتها. إنجاز يبني لك القوة العاملة؛ وأنت تحدد كيف تعمل.</p><div class="employee-catalog-preview"><article><span class="catalog-avatar">س</span><div><strong>مديرة خدمة العملاء</strong><small>Customer Operations</small></div></article><article><span class="catalog-avatar">م</span><div><strong>منسق الحجوزات</strong><small>Reservations</small></div></article><article><span class="catalog-avatar">ر</span><div><strong>محلل الأعمال</strong><small>Business Intelligence</small></div></article><article><span class="catalog-avatar">ع</span><div><strong>مدير العمليات</strong><small>Operations</small></div></article></div></div></section><section class="public-section"><div class="public-section-inner"><div class="section-eyebrow">CONTROL BY DESIGN</div><h2>قوة رقمية. تحت سيطرتك.</h2><p class="section-lead">الصلاحيات، الموافقات، سجل التدقيق والتكاملات جزء من نموذج التشغيل منذ البداية.</p><div class="trust-grid"><div><strong>صلاحيات حسب الدور</strong><span>كل موظف يحصل على ما يحتاجه فقط.</span></div><div><strong>موافقات بشرية</strong><span>القرارات الحساسة تبقى تحت اعتماد المسؤول.</span></div><div><strong>سجل تدقيق</strong><span>اعرف ماذا حدث، ومتى، ومن نفذه.</span></div><div><strong>تكاملات آمنة</strong><span>اربط أنظمة شركتك ضمن الحدود التي تحددها.</span></div></div></div></section><section class="final-cta"><div><span class="section-eyebrow">THE NEXT WORKFORCE</span><h2>ابدأ بناء فريقك الرقمي اليوم.</h2><p>موظفون جاهزون. منصة واحدة. تحكم كامل.</p></div><button data-auth="signup">ابدأ مع إنجاز <span>←</span></button></section></main><footer class="public-footer"><div><strong>إنجاز</strong><span>Digital Workforce OS</span></div></footer>`;
  document.body.appendChild(mount);
  mount.addEventListener('click',event=>{const auth=event.target.closest?.('[data-auth]');if(auth){event.preventDefault();const url=new URL(location.href);url.search='';url.searchParams.set('auth','1');if(auth.dataset.auth==='signup')url.searchParams.set('signup','1');location.assign(url.toString());return}const scroll=event.target.closest?.('[data-scroll]');if(scroll){event.preventDefault();document.getElementById(scroll.dataset.scroll)?.scrollIntoView({behavior:'smooth'})}});
};

loadOptional('./boot-config.js',()=>import('./boot-config.js'));
loadOptional('./@tabler-icons',()=>import('@tabler/icons-webfont/dist/tabler-icons.min.css'));
loadOptional('./enjaz-production-hardening.js',()=>import('./enjaz-production-hardening.js'));
loadOptional('./enjaz-product-visuals.js',()=>import('./enjaz-product-visuals.js'));
loadOptional('./enjaz-motion.js',()=>import('./enjaz-motion.js'));

if(authRoute){
  document.documentElement.classList.add('enjaz-auth-route');
  loadOptional('./auth-gate-v2.js',()=>import('./auth-gate-v2.js'));
}else{
  // Guarantee a usable public first paint before enhancement modules execute.
  renderPublicFallback();
  import('./enjaz-public.js').then(()=>document.getElementById('enjaz-public-fallback')?.remove()).catch(error=>report('PUBLIC_BOOT',error));

  const navigateToAuth=trigger=>{const url=new URL(window.location.href);url.search='';url.searchParams.set('auth','1');if(trigger?.dataset?.auth==='signup')url.searchParams.set('signup','1');window.location.assign(url.toString())};
  const authGuard=event=>{const trigger=event.target?.closest?.('[data-auth]');if(!trigger)return;event.preventDefault();event.stopImmediatePropagation();navigateToAuth(trigger)};
  document.addEventListener('click',authGuard,true);
  document.addEventListener('pointerup',event=>{const trigger=event.target?.closest?.('[data-auth="login"]');if(trigger)navigateToAuth(trigger)},true);
  document.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const trigger=document.activeElement?.closest?.('[data-auth="login"]');if(trigger){event.preventDefault();navigateToAuth(trigger)}},true);

  const capabilityModules=[['./enjaz-industry-library.js',()=>import('./enjaz-industry-library.js')],['./enjaz-employee-360.js',()=>import('./enjaz-employee-360.js')],['./task-360.js',()=>import('./task-360.js')],['./enjaz-workforce-entry.js',()=>import('./enjaz-workforce-entry.js')],['./enjaz-v4-compatibility.js',()=>import('./enjaz-v4-compatibility.js')]];
  for(const [modulePath,loader] of capabilityModules)loadOptional(modulePath,loader);
}
