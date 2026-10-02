/* ENJAZ Landing — interactions (RTL, reduced-motion aware) */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Navbar: glass -> solid on scroll ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, {passive: true});

/* ---------- Mobile menu ---------- */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = () => {
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'فتح القائمة');
  mobileMenu.classList.remove('open');
  mobileMenu.hidden = true;
};
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  if (open) return closeMenu();
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'إغلاق القائمة');
  mobileMenu.hidden = false;
  mobileMenu.classList.add('open');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); }, {passive: true});

/* ---------- Scroll reveal ---------- */
const revealIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
  }
}, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
document.querySelectorAll('[data-reveal]').forEach(el => revealIO.observe(el));

/* ---------- Platform showcase tabs ---------- */
const tabs = [...document.querySelectorAll('.tab')];
const panels = [...document.querySelectorAll('.panel[data-panel]')];
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(t => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
  panels.forEach(p => {
    const active = p.dataset.panel === tab.dataset.tab;
    p.hidden = !active;
    p.classList.toggle('is-active', active);
  });
}));

/* ---------- "How Enjaz works" path animation ---------- */
const how = document.querySelector('.how');
if (how) {
  const howIO = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { how.classList.add('play'); howIO.disconnect(); }
  }, {threshold: 0.35});
  howIO.observe(how);
}

/* ---------- Operations layer stack: list <-> layers sync ---------- */
const opsList = document.getElementById('opsList');
const layerStack = document.getElementById('layerStack');
if (opsList && layerStack) {
  const items = [...opsList.querySelectorAll('li')];
  const layers = [...layerStack.querySelectorAll('.layer')];
  const tag = document.getElementById('layerTag');
  let autoTimer = null, idx = 0;
  const activate = i => {
    idx = i;
    items.forEach((li, n) => li.classList.toggle('is-active', n === i));
    layers.forEach((ly, n) => ly.classList.toggle('is-active', n === i));
    if (tag) {
      const label = items[i]?.querySelector('strong')?.textContent || '';
      const span = tag.querySelector('span');
      if (span && span.textContent !== label) {
        const fresh = span.cloneNode(false);
        fresh.textContent = label;
        span.replaceWith(fresh); // restart entry animation
      }
    }
  };
  items.forEach((li, i) => {
    li.addEventListener('mouseenter', () => { stopAuto(); activate(i); });
    li.addEventListener('click', () => { stopAuto(); activate(i); });
    li.addEventListener('focus', () => { stopAuto(); activate(i); });
    li.tabIndex = 0;
  });
  const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
  if (!reduceMotion) {
    const stackIO = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        if (!autoTimer) autoTimer = setInterval(() => activate((idx + 1) % layers.length), 2600);
      } else stopAuto();
    }, {threshold: 0.3});
    stackIO.observe(layerStack);
  }
}

/* ---------- Hero scene: subtle pointer parallax (desktop only) ---------- */
const scene = document.getElementById('heroScene');
if (scene && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
  const depthEls = [...scene.querySelectorAll('[data-depth]')];
  let raf = 0, tx = 0, ty = 0;
  const apply = () => {
    raf = 0;
    for (const el of depthEls) {
      const d = Number(el.dataset.depth) || 6;
      el.style.setProperty('translate', `${tx * d}px ${ty * d}px`);
    }
  };
  scene.addEventListener('pointermove', e => {
    const r = scene.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * -1.6;
    ty = ((e.clientY - r.top) / r.height - 0.5) * -1.2;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  scene.addEventListener('pointerleave', () => {
    tx = 0; ty = 0;
    if (!raf) raf = requestAnimationFrame(apply);
  });
}

/* ---------- Workforce cards: rotate demo tasks gently ---------- */
if (!reduceMotion) {
  const demoTasks = {
    working: ['تحليل العمليات الجارية', 'توزيع مهام الوردية', 'متابعة مؤشرات اليوم', 'تدقيق طلبات معلّقة'],
  };
  const taskEls = [...document.querySelectorAll('.wf-card .fc-task')];
  if (taskEls.length) {
    let i = 0;
    setInterval(() => {
      const el = taskEls[i % taskEls.length];
      const card = el.closest('.wf-card');
      if (card && card.querySelector('.status.working')) {
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = demoTasks.working[Math.floor(Math.random() * demoTasks.working.length)];
          el.style.transition = 'opacity .6s ease';
          el.style.opacity = '1';
        }, 600);
      }
      i++;
    }, 5200);
  }
}
