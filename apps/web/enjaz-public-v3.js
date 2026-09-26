/* ENJAZ V3 — interaction hardening and navigation polish */
(()=>{
 const boot=()=>{const root=document.getElementById('enjaz-public');if(!root||root.dataset.v3js==='1')return;root.dataset.v3js='1';
 root.querySelectorAll('.sf-nav-trigger').forEach(btn=>{btn.setAttribute('aria-expanded','false');btn.addEventListener('click',()=>{const open=btn.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));root.querySelectorAll('.sf-nav-trigger').forEach(other=>{if(other!==btn){other.classList.remove('open');other.setAttribute('aria-expanded','false')}})})});
 const mobile=root.querySelector('[data-mobile-toggle]'),menu=root.querySelector('[data-mobile-menu]');if(mobile&&menu){mobile.setAttribute('aria-expanded','false');mobile.addEventListener('click',()=>{const open=menu.classList.toggle('open');mobile.setAttribute('aria-expanded',String(open))});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');mobile.setAttribute('aria-expanded','false')}))}
 root.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(!id||id==='#')return;const target=root.querySelector(id);if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});root.querySelectorAll('.sf-nav-trigger').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-expanded','false')})}}));
 const header=root.querySelector('.sf-header');if(header){let last=0;addEventListener('scroll',()=>{const y=scrollY||0;header.classList.toggle('is-scrolled',y>12);last=y},{passive:true})}
 };new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});boot();
})();
