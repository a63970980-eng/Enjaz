// Enjaz executive visual layer. Loaded as a classic script so it can observe the app after Vite renders it.
(() => {
  const load = () => import('./executive-brand-shell.js?v=20260904-01').catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
