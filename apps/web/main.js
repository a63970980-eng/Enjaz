import './boot-config.js';
import './enjaz-public.js';

// Keep the public shell independent from optional workspace enhancements.
// A failure in a secondary module must never leave the page blank.
const deferredModules = [
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
  './app-entry-v2.js',
  './enjaz-workforce-entry.js',
  './enjaz-workflow-polish.js',
];

for (const modulePath of deferredModules) {
  import(modulePath).catch((error) => {
    console.error('[ENJAZ_MODULE]', modulePath, error);
  });
}
