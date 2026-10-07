import './boot-config.js';

const root = document.querySelector('.enjaz-root') || (() => {
  const el = document.createElement('div');
  el.className = 'enjaz-root';
  document.body.appendChild(el);
  return el;
})();

if (new URLSearchParams(window.location.search).has('auth')) {
  document.documentElement.classList.add('enjaz-auth-route');
  import('../auth-gate-v2.js').catch((error) => console.error('[ENJAZ_AUTH_BOOT]', error));
} else {
  window.__ENJAZ_AUTH_STATE__ = 'public';
}
