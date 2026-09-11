import './auth-gate-v2.js';

const BOOT_TIMEOUT=15000;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const dismissFallback=()=>document.getElementById('enjaz-boot-fallback')?.remove();
const showBootError=error=>{
  dismissFallback();
  const root=document.getElementById('content');
  if(!root)return;
  const safe=String(error?.message||error||'تعذر تشغيل التطبيق').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  root.innerHTML=`<div class="boot-error" role="alert"><strong>تعذر تشغيل مساحة العمل</strong><span>${safe}</span><button type="button" data-retry>إعادة المحاولة</button><button type="button" data-reset>إعادة ضبط الجلسة</button></div>`;
  root.querySelector('[data-retry]')?.addEventListener('click',()=>location.reload());
  root.querySelector('[data-reset]')?.addEventListener('click',()=>{sessionStorage.removeItem('ENJAZ_ACCESS_TOKEN');sessionStorage.removeItem('ENJAZ_REFRESH_TOKEN');sessionStorage.removeItem('ENJAZ_USER_PROFILE');sessionStorage.removeItem('ENJAZ_WORKSPACES');localStorage.removeItem('ENJAZ_WORKSPACE_ID');location.href=location.origin+location.pathname;});
  console.error('[ENJAZ_BOOT]',error);
};

const start=async()=>{
  const started=Date.now();
  while(true){
    if(window.__ENJAZ_APP_STARTED__)return;
    if(window.ENJAZ_ACCESS_TOKEN && window.ENJAZ_WORKSPACE_ID){
      window.__ENJAZ_APP_STARTED__=true;
      dismissFallback();
      try{await import('./app.js');}
      catch(error){showBootError(error);}
      return;
    }
    if(Date.now()-started>=BOOT_TIMEOUT){
      if(!window.__ENJAZ_PUBLIC_SHOWN__ && !document.getElementById('auth-gate')){
        showBootError(new Error('انتهت مهلة تهيئة إنجاز. أعد تحميل الصفحة أو أعد ضبط الجلسة.'));
      }
      return;
    }
    await wait(150);
  }
};

start().catch(showBootError);
