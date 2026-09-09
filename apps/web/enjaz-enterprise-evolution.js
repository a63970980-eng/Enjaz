/* ENJAZ — additive enterprise evolution presentation. Existing features are untouched. */
(() => {
  const mount = () => {
    const root = document.getElementById('enjaz-public');
    if (!root || root.dataset.evolutionReady) return;
    const main = root.querySelector('main');
    const before = root.querySelector('.final-cta');
    if (!main || !before) return;
    root.dataset.evolutionReady = '1';
    const section = document.createElement('section');
    section.className = 'evolution-section';
    section.id = 'operating-model';
    section.innerHTML = `
      <div class="evolution-inner">
        <div class="evolution-head">
          <div><div class="evolution-eyebrow">THE ENJAZ OPERATING MODEL</div><h2>من موظفين منفصلين إلى قوة عمل رقمية واحدة.</h2></div>
          <p>إنجاز يربط الموظفين الرقميين بالمهام والأهداف والأدوات وسير العمل والموافقات، بحيث تتحول الأعمال اليومية إلى نظام تشغيل قابل للإدارة والقياس.</p>
        </div>
        <div class="evolution-grid">
          <article class="evolution-card">
            <div class="evolution-card-head"><strong>دورة العمل داخل إنجاز</strong><span>END-TO-END OPERATIONS</span></div>
            <div class="evolution-flow">
              <div class="evolution-node"><b>01</b><strong>الهدف</strong><span>تحدد الإدارة النتيجة والسياسة والحدود.</span></div>
              <div class="evolution-node"><b>02</b><strong>التوزيع</strong><span>يسند النظام العمل إلى الموظف المناسب.</span></div>
              <div class="evolution-node"><b>03</b><strong>التنفيذ</strong><span>يستخدم الموظف الأدوات والمعرفة المصرح بها.</span></div>
              <div class="evolution-node"><b>04</b><strong>التعاون</strong><span>ينقل العمل بين الموظفين والفرق والأنظمة.</span></div>
              <div class="evolution-node"><b>05</b><strong>التحكم</strong><span>الموافقة والتدقيق والنتيجة تبقى تحت سيطرة الشركة.</span></div>
            </div>
            <div class="evolution-stats"><div class="evolution-stat"><strong>60+</strong><span>موظف رقمي جاهز حاليًا</span></div><div class="evolution-stat"><strong>24/7</strong><span>تشغيل مستمر</span></div><div class="evolution-stat"><strong>1</strong><span>نظام تشغيل موحد</span></div></div>
          </article>
          <article class="evolution-card dark">
            <div class="evolution-card-head"><strong>القوة العاملة الرقمية</strong><span>WORKFORCE</span></div>
            <div class="workforce-map">
              <div class="workforce-role"><b>OPERATIONS</b><strong>مدير العمليات</strong><span>يراقب التنفيذ والاستثناءات والأداء.</span></div>
              <div class="workforce-role"><b>CUSTOMER</b><strong>خدمة العملاء</strong><span>يتعامل مع الطلبات ويربطها بالعمليات.</span></div>
              <div class="workforce-role"><b>SALES</b><strong>المبيعات</strong><span>يتابع الفرص ويحوّلها إلى مهام قابلة للتنفيذ.</span></div>
              <div class="workforce-role"><b>FINANCE</b><strong>المالية</strong><span>ينفذ العمليات ضمن الصلاحيات والسياسات.</span></div>
              <div class="workforce-role"><b>HR</b><strong>الموارد البشرية</strong><span>يدير العمليات والطلبات والبيانات المسموح بها.</span></div>
              <div class="workforce-role"><b>ANALYTICS</b><strong>تحليلات الأعمال</strong><span>يحوّل النشاط التشغيلي إلى مؤشرات وقرارات.</span></div>
            </div>
          </article>
        </div>
      </div>`;
    before.before(section);
  };
  const observer = new MutationObserver(mount);
  if (document.body) observer.observe(document.body, {childList:true, subtree:true});
  mount();
})();
