import {animate,stagger} from 'motion';
import './enjaz-public-motion.css';

const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const boot=()=>{
  const root=document.getElementById('enjaz-public');
  if(!root||prefersReduced||root.dataset.motionReady==='1')return;
  root.dataset.motionReady='1';
  const hero=root.querySelector('.public-hero');
  if(hero){
    const copy=hero.querySelector('.hero-copy');
    const stage=hero.querySelector('.workforce-stage');
    if(copy)animate(copy,{opacity:[0,1],y:[24,0]},{duration:.65,ease:[.22,1,.36,1]});
    if(stage)animate(stage,{opacity:[0,1],scale:[.965,1],y:[18,0]},{duration:.8,delay:.08,ease:[.22,1,.36,1]});
  }
  const cards=[...root.querySelectorAll('.deck-card,.employee-catalog-preview article,.cap-card,.flow-step,.trust-grid div')];
  if(cards.length)animate(cards,{opacity:[0,1],y:[16,0]},{duration:.5,delay:stagger(.045,{startDelay:.12}),ease:[.22,1,.36,1]});
  root.querySelectorAll('.workforce-stage,.deck-card,.employee-catalog-preview article,.cap-card,.flow-step').forEach(el=>{
    el.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--enjaz-tilt-x',(-y*2.2).toFixed(2)+'deg');el.style.setProperty('--enjaz-tilt-y',(x*2.2).toFixed(2)+'deg')},{passive:true});
    el.addEventListener('pointerleave',()=>{el.style.removeProperty('--enjaz-tilt-x');el.style.removeProperty('--enjaz-tilt-y')},{passive:true});
  });
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});