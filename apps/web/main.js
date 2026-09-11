import './boot-config.js';
import './enjaz-public.js';

// Boot the authenticated workspace first. Optional enhancement modules are
// loaded only after the core app entry has been scheduled, preventing race
// conditions between the workspace renderer and visual enhancements.
const coreModule = './app-entry-v2.js';
const enhancementModules = [
  './enjaz-workspace-shell.js',
  './enjaz-shell-data.js',
  './enjaz-employee-360.js',
  './enjaz-industry-library.js',
  './enjaz-global-experience.js',
  './enjaz-enterprise-evolution.js',
  './enjaz-command-center.js',
  './enjaz-notifications.js',
  './enjaz-executive-intelligence.js',
  './enjaz-auth-enhancements.js',
  './enjaz-world-class-ui.js',
  './enjaz-workforce-entry.js',
  './enjaz-workflow-polish.js',
];

const reportModuleError = (modulePath, error) => {
  console.error('[ENJAZ_MODULE]', modulePath, error);
};

// Start the core application before cosmetic/interaction layers. A failed
// enhancement must never prevent the actual workspace from rendering.
import(coreModule)
  .catch((error) => reportModuleError(coreModule, error))
  .finally(() => {
    for (const modulePath of enhancementModules) {
      import(modulePath).catch((error) => reportModuleError(modulePath, error));
    }
  });

// Surface unexpected client-side failures instead of leaving an apparently
// empty workspace on mobile browsers.
window.addEventListener('error', (event) => {
  const content = document.getElementById('content');
  if (!content || content.children.length || document.getElementById('auth-gate')) return;
  const message = String(event?.error?.message || event?.message || 'تعذر تشغيل مساحة العمل.');
  content.innerHTML = `<div class="boot-error" role="alert"><strong>تعذر تشغيل مساحة العمل</strong><span>${message.replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</span><button type="button" onclick="location.reload()">إعادة المحاولة</button></div>`;
});
