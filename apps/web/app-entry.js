import './auth-gate.js';

const start=()=>{
  if(window.__ENJAZ_APP_STARTED__) return;
  if(window.ENJAZ_ACCESS_TOKEN && window.ENJAZ_WORKSPACE_ID){
    window.__ENJAZ_APP_STARTED__=true;
    import('./app.js').catch(error=>{
      const root=document.getElementById('content');
      if(root) root.innerHTML=`<div class="boot-error"><strong>تعذر تشغيل مساحة العمل</strong><span>${String(error?.message||error)}</span><button onclick="location.reload()">إعادة المحاولة</button></div>`;
      console.error(error);
    });
    return;
  }
  setTimeout(start,150);
};
start();
