import './boot-config.js';

const authRoute = new URLSearchParams(window.location.search).has('auth');

if (authRoute) {
  document.documentElement.classList.add('enjaz-auth-route');
  import('./auth-gate-v2.js').catch((error) => {
    console.error('[ENJAZ_AUTH_BOOT]', error);
    const gate = document.getElementById('auth-gate') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'auth-gate' }));
    gate.innerHTML = '<div class="auth-shell"><div class="auth-card session-recovery"><div class="auth-brand"><span class="brand-mark">إ</span><div><strong>إنجاز</strong><small>ENJAZ · AUTHENTICATION</small></div></div><div class="auth-copy"><div class="eyebrow">AUTHENTICATION</div><h1>تعذر تحميل تسجيل الدخول</h1><p>حدث خطأ أثناء تحميل واجهة المصادقة. أعد تحميل الصفحة للمحاولة مرة أخرى.</p></div><div class="auth-recovery-actions"><button class="primary" type="button" onclick="location.reload()">إعادة المحاولة</button></div></div></div>';
  });
} else {
  import('./enjaz-public.js').catch((error) => console.error('[ENJAZ_PUBLIC_BOOT]', error));

  // Public authentication entry must remain deterministic even if an optional
  // enhancement layer adds click handlers or fails to initialize.
  document.addEventListener('click', (event) => {
    const trigger = event.target?.closest?.('[data-auth]');
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('auth', '1');
    if (trigger.dataset.auth === 'signup') url.searchParams.set('signup', '1');
    window.location.assign(url.toString());
  }, true);

  const reportModuleError = (modulePath, error) => console.error('[ENJAZ_MODULE]', modulePath, error);

  // Use statically analyzable dynamic imports. A variable-based dynamic import
  // such as import(coreModule) is not emitted by Vite into the production dist,
  // leaving the authenticated shell with an empty #content area after login.
  import('./app-entry-v2.js').catch((error) => reportModuleError('./app-entry-v2.js', error));

  const enhancementModules = [
    ['./enjaz-workspace-shell.js', () => import('./enjaz-workspace-shell.js')],
    ['./enjaz-shell-data.js', () => import('./enjaz-shell-data.js')],
    ['./enjaz-employee-360.js', () => import('./enjaz-employee-360.js')],
    ['./enjaz-industry-library.js', () => import('./enjaz-industry-library.js')],
    ['./enjaz-global-experience.js', () => import('./enjaz-global-experience.js')],
    ['./enjaz-enterprise-evolution.js', () => import('./enjaz-enterprise-evolution.js')],
    ['./enjaz-command-center.js', () => import('./enjaz-command-center.js')],
    ['./enjaz-notifications.js', () => import('./enjaz-notifications.js')],
    ['./enjaz-executive-intelligence.js', () => import('./enjaz-executive-intelligence.js')],
    ['./enjaz-auth-enhancements.js', () => import('./enjaz-auth-enhancements.js')],
    ['./enjaz-world-class-ui.js', () => import('./enjaz-world-class-ui.js')],
    ['./enjaz-workforce-entry.js', () => import('./enjaz-workforce-entry.js')],
    ['./enjaz-workflow-polish.js', () => import('./enjaz-workflow-polish.js')],
  ];

  // Each enhancement is isolated so an optional layer can never block the core
  // workspace from booting.
  for (const [modulePath, loader] of enhancementModules) {
    loader().catch((error) => reportModuleError(modulePath, error));
  }

  window.addEventListener('error', (event) => {
    const content = document.getElementById('content');
    if (!content || content.children.length || document.getElementById('auth-gate')) return;
    const message = String(event?.error?.message || event?.message || 'تعذر تشغيل مساحة العمل.');
    content.innerHTML = `<div class="boot-error" role="alert"><strong>تعذر تشغيل مساحة العمل</strong><span>${message.replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</span><button type="button" onclick="location.reload()">إعادة المحاولة</button></div>`;
  });
}
