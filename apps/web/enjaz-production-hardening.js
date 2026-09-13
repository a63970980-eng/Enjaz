const AUTH_KEY='ENJAZ_ACCESS_TOKEN';
const REFRESH_KEY='ENJAZ_REFRESH_TOKEN';
const WORKSPACE_KEY='ENJAZ_WORKSPACE_ID';
const bannerId='enjaz-runtime-banner';
let authRedirecting=false;

const clearSession=()=>{
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem('ENJAZ_USER_PROFILE');
  sessionStorage.removeItem('ENJAZ_WORKSPACES');
  localStorage.removeItem(WORKSPACE_KEY);
  window.ENJAZ_ACCESS_TOKEN='';
};

const showBanner=(message,type='info')=>{
  let el=document.getElementById(bannerId);
  if(!el){
    el=document.createElement('div');
    el.id=bannerId;
    el.setAttribute('role','status');
    document.body.appendChild(el);
  }
  el.dataset.type=type;
  el.textContent=message;
  el.classList.add('is-visible');
};
const hideBanner=()=>document.getElementById(bannerId)?.classList.remove('is-visible');

const goLogin=()=>{
  if(authRedirecting)return;
  authRedirecting=true;
  clearSession();
  const url=new URL(location.href);
  url.search='';
  url.searchParams.set('auth','1');
  location.assign(url.toString());
};

const originalFetch=window.fetch.bind(window);
window.fetch=async(input,init={})=>{
  const response=await originalFetch(input,init);
  if(response.status===401){
    const url=typeof input==='string'?input:input?.url||'';
    if(/\/api\/v1\//.test(url)&&!/[?&]public=1/.test(url)){
      window.dispatchEvent(new CustomEvent('enjaz:auth-expired'));
    }
  }
  return response;
};

window.addEventListener('enjaz:auth-expired',()=>{
  if(document.documentElement.classList.contains('enjaz-auth-route'))return;
  showBanner('انتهت جلسة الدخول. جارٍ تأمين حسابك وإعادة تسجيل الدخول…','warning');
  setTimeout(goLogin,900);
},{once:true});

window.addEventListener('online',()=>{
  hideBanner();
  window.dispatchEvent(new CustomEvent('enjaz:connection-restored'));
});
window.addEventListener('offline',()=>showBanner('لا يوجد اتصال بالإنترنت. سيعود إنجاز للعمل تلقائيًا عند استعادة الاتصال.','warning'));

window.addEventListener('error',event=>{
  console.error('[ENJAZ_RUNTIME]',event.error||event.message);
});
window.addEventListener('unhandledrejection',event=>{
  console.error('[ENJAZ_RUNTIME_REJECTION]',event.reason);
});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{if(navigator.onLine===false)showBanner('لا يوجد اتصال بالإنترنت.','warning')},{once:true});
}else if(navigator.onLine===false)showBanner('لا يوجد اتصال بالإنترنت.','warning');

window.ENJAZ_RUNTIME={
  version:'2026.09.13-production',
  clearSession,
  showBanner,
  hideBanner
};
