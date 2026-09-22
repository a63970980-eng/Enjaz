const q=new URLSearchParams(location.search);
const go=m=>{const u=new URL(location.href);u.search='';u.searchParams.set('auth','1');if(m==='signup')u.searchParams.set('signup','1');location.href=u};
const boot=async()=>{if(q.has('auth'))return;const mount=document.getElementById('enjaz-public');if(!mount)return;try{const r=await fetch('./enjaz-public.html',{cache:'no-store'});if(!r.ok)throw new Error('public surface '+r.status);mount.innerHTML=await r.text()}catch(e){console.error('[ENJAZ_PUBLIC]',e);return}
mount.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.auth)));
mount.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
const s=[...mount.querySelectorAll('.ez-step')];let i=0;setInterval(()=>{if(document.hidden)return;s.forEach(x=>x.classList.remove('is-current'));s[i]?.classList.add('is-current');i=(i+1)%s.length},2600);
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('is-visible')),{threshold:.1});mount.querySelectorAll('.ez-sector-band,.ez-how,.ez-why,.ez-final').forEach(x=>io.observe(x));
const h=mount.querySelector('.ez-hero-visual');if(h&&matchMedia('(pointer:fine)').matches){h.onpointermove=e=>{const a=h.getBoundingClientRect();h.style.setProperty('--mx',((e.clientX-a.left)/a.width-.5).toFixed(3));h.style.setProperty('--my',((e.clientY-a.top)/a.height-.5).toFixed(3))};h.onpointerleave=()=>{h.style.setProperty('--mx','0');h.style.setProperty('--my','0')}}};
boot();