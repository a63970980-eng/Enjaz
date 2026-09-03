/* Enjaz launch readiness: premium onboarding, workspace bootstrap and production guardrails. */
(() => {
  const q = new URLSearchParams(location.search);
  const previewKey = 'ENJAZ_ONBOARDING_DISMISSED';
  const hasWorkspace = Boolean(window.ENJAZ_WORKSPACE_ID);
  const hasToken = Boolean(window.ENJAZ_ACCESS_TOKEN);
  const isPreview = !hasWorkspace || !hasToken;
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const open = (title, body) => {
    const old = document.querySelector('.launch-onboarding'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'launch-onboarding';
    el.innerHTML = `<div class="launch-onboarding-card"><div class="launch-onboarding-mark">✦</div><div><span class="eyebrow">ENJAZ / GET STARTED</span><h2>${esc(title)}</h2><p>${esc(body)}</p></div><div class="launch-onboarding-actions"><button class="primary" data-start>ابدأ مساحة عملك</button><button class="ghost" data-dismiss>استكشاف المعاينة</button></div><div class="launch-onboarding-note">بيانات المعاينة محفوظة على هذا الجهاز فقط. للإطلاق الحقيقي استخدم حسابًا ومساحة عمل متصلة.</div></div>`;
    document.body.appendChild(el);
    el.querySelector('[data-dismiss]').onclick = () => { localStorage.setItem(previewKey,'1'); el.remove(); };
    el.querySelector('[data-start]').onclick = () => { localStorage.setItem(previewKey,'1'); location.hash = 'workspace'; el.remove(); window.dispatchEvent(new CustomEvent('enjaz:start-onboarding')); };
  };
  const boot = () => {
    document.documentElement.dataset.enjazMode = isPreview ? 'preview' : 'production';
    if (isPreview && !localStorage.getItem(previewKey) && !q.has('workspaceId')) {
      setTimeout(() => open('ابنِ قوة العمل الرقمية لشركتك', 'أنشئ مساحة عمل، ثم أضف أول موظف رقمي وابدأ بتحويل المهام المتكررة إلى عمليات ذكية.'), 700);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
