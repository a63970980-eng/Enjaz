(()=>{
  const KEY='ENJAZ_LAUNCH_METRICS';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const write=x=>{try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}};
  const metric=(name,extra={})=>{const m=read();m[name]=(m[name]||0)+1;m.lastEvent={name,at:new Date().toISOString(),...extra};write(m)};
  window.enjazMetric=metric;
  metric('sessions');
  document.addEventListener('click',e=>{const el=e.target.closest('[data-action],[data-nav]');if(!el)return;metric('ui_actions',{action:el.dataset.action||el.dataset.nav})},{passive:true});
})();
