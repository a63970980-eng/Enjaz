import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const initPublicMotion = () => {
  const root = document.querySelector('#enjaz-public');
  if (!root || reduceMotion) return;

  const hero = root.querySelector('.public-hero');
  const copy = root.querySelector('.hero-copy');
  const stage = root.querySelector('.workforce-stage');
  const visuals = root.querySelectorAll('.product-visual');
  const metrics = root.querySelectorAll('.stage-metrics strong');

  if (hero && copy) {
    gsap.from(copy.children, {
      y: 22,
      opacity: 0,
      duration: 0.75,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.08
    });
  }

  if (stage) {
    gsap.from(stage, {
      y: 28,
      opacity: 0,
      scale: 0.985,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.16
    });

    gsap.to(stage, {
      y: -7,
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (visuals.length) {
    gsap.from(visuals, {
      y: 16,
      opacity: 0,
      scale: 0.96,
      duration: 0.65,
      stagger: 0.12,
      ease: 'back.out(1.4)',
      delay: 0.4
    });
  }

  metrics.forEach((node) => {
    const target = Number(node.textContent.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(target)) return;
    const state = { value: 0 };
    gsap.to(state, {
      value: target,
      duration: 1.2,
      delay: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        node.textContent = Math.round(state.value).toLocaleString('ar');
      }
    });
  });

  root.querySelectorAll('.public-section').forEach((section) => {
    gsap.from(section.querySelectorAll('.section-heading, .cap-card, .flow-step, .trust-grid > div, .employee-catalog-preview > article'), {
      scrollTrigger: { trigger: section, start: 'top 82%', once: true },
      y: 28,
      opacity: 0,
      duration: 0.65,
      stagger: 0.055,
      ease: 'power2.out'
    });
  });
};

const boot = () => {
  initPublicMotion();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
