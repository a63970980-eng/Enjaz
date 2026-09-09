import './auth-gate.js';

const start=()=>{
  if(window.__ENJAZ_APP_STARTED__) return;
  if(window.ENJAZ_ACCESS_TOKEN && window.ENJAZ_WORKSPACE_ID){
    window.__ENJAZ_APP_STARTED__=true;
    import('./app.js').catch(error=>{
      const root=document.getElementById('content');
      if(root){
        root.innerHTML=`<div class="boot-error"><strong>تعذر تشغيل مساحة العمل</strong><span>${String(error?.message||error).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</span><button type="button" data-retry>إعادة المحاولة</button></div>`;
        root.querySelector('[data-retry]')?.addEventListener('click',()=>location.reload());
      }
      console.error(error);
    });
    return;
  }
  setTimeout(start,150);
};
start();
