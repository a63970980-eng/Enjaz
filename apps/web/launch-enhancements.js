/* Enjaz launch layer: preview-safe persistence, polished onboarding signals, and resilient employee UX. */
(() => {
  const key = id => `ENJAZ_LOCAL_EMPLOYEES:${id || 'preview'}`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key(window.ENJAZ_WORKSPACE_ID || '')) || '[]'); } catch { return []; } };
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const initial = x => (x?.name || 'م').trim().charAt(0);
  const active = x => !['paused','disabled','inactive'].includes(String(x?.status || '').toLowerCase());
  const paint = () => {
    const employees = read();
    if (!employees.length) return;
    const grid = document.querySelector('.employee-grid');
    if (grid && !grid.querySelector('.employee-card')) {
      grid.innerHTML = employees.map(x => `<article class="employee-card launch-employee-card"><div class="employee-card-head"><span class="avatar avatar-lg">${esc(initial(x))}</span><div><h3>${esc(x.name || 'موظف رقمي')}</h3><p>${esc(x.role || 'موظف عمليات')}</p></div><span class="dot-status ${active(x) ? '' : 'off'}"></span></div><div class="employee-tags"><span>${active(x) ? 'نشط' : 'متوقف'}</span><span>جاهز للتشغيل</span></div><div class="employee-metrics"><div><b>0</b><small>مكتملة</small></div><div><b>0</b><small>مفتوحة</small></div><div><b>—</b><small>الأداء</small></div></div></article>`).join('');
    }
    const workforce = document.querySelector('.dashboard-side .panel:first-child');
    if (workforce && !workforce.querySelector('.person-row') && employees.length) {
      const rows = employees.slice(0, 5).map(x => `<div class="person-row"><span class="avatar">${esc(initial(x))}</span><div><strong>${esc(x.name || 'موظف رقمي')}</strong><small>${esc(x.role || 'موظف عمليات')}</small></div><span class="dot-status ${active(x) ? '' : 'off'}"></span></div>`).join('');
      workforce.insertAdjacentHTML('beforeend', rows);
    }
    document.querySelectorAll('.stats div').forEach(card => {
      const label = card.querySelector('span')?.textContent?.trim();
      if (label === 'الموظفون الرقميون' || label === 'إجمالي الفريق') {
        const b = card.querySelector('b'); if (b) b.textContent = employees.length;
        const small = card.querySelector('small'); if (small && label === 'الموظفون الرقميون') small.textContent = `${employees.filter(active).length} نشط الآن`;
      }
    });
  };
  const announce = message => {
    let toast = document.querySelector('.launch-toast');
    if (!toast) { toast = document.createElement('div'); toast.className = 'launch-toast'; document.body.appendChild(toast); }
    toast.textContent = message; toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
  };
  const watch = new MutationObserver(() => paint());
  watch.observe(document.body, {childList:true, subtree:true});
  document.addEventListener('submit', e => {
    if (e.target?.id === 'employee-form') setTimeout(() => { paint(); announce('تم إنشاء الموظف الرقمي وإضافته إلى القوة العاملة.'); }, 80);
  }, true);
  window.addEventListener('storage', paint);
  setTimeout(paint, 120);
  setTimeout(paint, 800);
})();
