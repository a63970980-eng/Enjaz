import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const animated = new WeakSet();

const reveal = (nodes, options = {}) => {
  const list = [...nodes].filter((node) => node && !animated.has(node));
  if (!list.length || reduceMotion) return;
  list.forEach((node) => animated.add(node));
  gsap.fromTo(list, { opacity: 0, y: options.y ?? 22 }, {
    opacity: 1,
    y: 0,
    duration: options.duration ?? 0.65,
    stagger: options.stagger ?? 0.055,
    ease: options.ease ?? 'power3.out',
    scrollTrigger: options.trigger ? { trigger: options.trigger, start: 'top 84%', once: true } : undefined
  });
};

const initPublicMotion = (root) => {
  if (!root || root.dataset.motionReady === '1') return;
  root.dataset.motionReady = '1';

  const copy = root.querySelector('.hero-copy');
  const stage = root.querySelector('.workforce-stage');
  const visuals = root.querySelectorAll('.product-visual');
  const metrics = root.querySelectorAll('.stage-metrics strong');

  if (!reduceMotion) {
    reveal(copy?.children ?? [], { duration: 0.72, stagger: 0.07 });

    if (stage) {
      gsap.from(stage, { y: 30, opacity: 0, scale: 0.985, duration: 0.9, ease: 'power3.out', delay: 0.14 });
      gsap.to(stage, { y: -7, duration: 4.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      stage.addEventListener('pointermove', (event) => {
        const rect = stage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        gsap.to(stage, { rotateY: x * 1.15, rotateX: -y * 0.8, transformPerspective: 900, duration: 0.45, overwrite: true });
      });
      stage.addEventListener('pointerleave', () => gsap.to(stage, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out', overwrite: true }));
    }

    if (visuals.length) {
      gsap.from(visuals, { y: 16, opacity: 0, scale: 0.96, duration: 0.7, stagger: 0.1, ease: 'back.out(1.35)', delay: 0.35 });
      visuals.forEach((visual, index) => gsap.to(visual, { y: index % 2 ? -6 : 6, duration: 2.8 + index * 0.25, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: index * 0.18 }));
    }

    metrics.forEach((node) => {
      const target = Number(node.textContent.replace(/[^0-9]/g, ''));
      if (!Number.isFinite(target) || node.dataset.counted === '1') return;
      node.dataset.counted = '1';
      const state = { value: 0 };
      gsap.to(state, { value: target, duration: 1.15, delay: 0.55, ease: 'power2.out', onUpdate: () => { node.textContent = Math.round(state.value).toLocaleString('ar'); } });
    });

    root.querySelectorAll('.public-section').forEach((section) => {
      reveal(section.querySelectorAll('.section-heading, .cap-card, .flow-step, .trust-grid > div, .employee-catalog-preview > article'), { trigger: section });
    });
  }
};

const initWorkspaceMotion = () => {
  if (reduceMotion || document.documentElement.classList.contains('enjaz-auth-route')) return;
  const content = document.querySelector('#content');
  if (!content || content.dataset.motionReady === '1') return;
  content.dataset.motionReady = '1';
  const candidates = content.querySelectorAll('.card, .panel, .workspace-card, .dashboard-card, [data-card], table, .stat-card');
  reveal(candidates, { y: 14, duration: 0.48, stagger: 0.035 });
};

const scan = () => {
  initPublicMotion(document.querySelector('#enjaz-public'));
  initWorkspaceMotion();
  ScrollTrigger.refresh();
};

const boot = () => {
  scan();
  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
