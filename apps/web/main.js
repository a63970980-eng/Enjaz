import './boot-config.js';
import './enjaz-enterprise-finish.css';

const authRoute=new URLSearchParams(window.location.search).has('auth');

if(authRoute){
  document.documentElement.classList.add('enjaz-auth-route');
  import('./auth-gate-v2.js').catch(error=>{
    console.error('[ENJAZ_AUTH_BOOT]',error);
    const gate=document.getElementById('auth-gate')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'auth-gate'}));
    gate.innerHTML='<div class="auth-shell"><div class="auth-card session-recovery"><div class="auth-brand"><span class="brand-mark">إ</span><div><strong>إنجاز</strong><small>ENJAZ · AUTHENTICATION</small></div></div><div class="auth-copy"><div class="eyebrow">AUTHENTICATION</div><h1>تعذر تحميل تسجيل الدخول</h1><p>حدث خطأ أثناء تحميل واجهة المصادقة. أعد تحميل الصفحة للمحاولة مرة أخرى.</p></div><div class="auth-recovery-actions"><button class="primary" type="button" onclick="location.reload()">إعادة المحاولة</button></div></div></div>';
  });
}else{
  import('./enjaz-public.js').catch(error=>console.error('[ENJAZ_PUBLIC_BOOT]',error));
  const navigateToAuth=(trigger)=>{
    const url=new URL(window.location.href);
    url.search='';
    url.searchParams.set('auth','1');
    if(trigger?.dataset?.auth==='signup')url.searchParams.set('signup','1');
    window.location.assign(url.toString());
  };
  const authGuard=event=>{
    const trigger=event.target?.closest?.('[data-auth]');
    if(!trigger)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigateToAuth(trigger);
  };
  document.addEventListener('click',authGuard,true);
  document.addEventListener('pointerup',event=>{
    const trigger=event.target?.closest?.('[data-auth="login"]');
    if(!trigger)return;
    navigateToAuth(trigger);
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const trigger=document.activeElement?.closest?.('[data-auth="login"]');
    if(!trigger)return;
    event.preventDefault();
    navigateToAuth(trigger);
  },true);
  const reportModuleError=(modulePath,error)=>{console.error('[ENJAZ_MODULE]',modulePath,error);const content=document.getElementById('content');if(content&&!content.children.length&&!document.getElementById('auth-gate')){const safe=String(error?.message||error||'خطأ غير متوقع').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));content.innerHTML=`<div class="boot-error" role="alert"><strong>تعذر تشغيل مساحة العمل</strong><span>${safe}</span><button type="button" onclick="location.reload()">إعادة المحاولة</button></div>`}};
  import('./app-entry-v2.js').catch(error=>reportModuleError('./app-entry-v2.js',error));
  const capabilityModules=[
    ['./enjaz-industry-library.js',()=>import('./enjaz-industry-library.js')],
    ['./enjaz-employee-360.js',()=>import('./enjaz-employee-360.js')],
    ['./task-360.js',()=>import('./task-360.js')],
    ['./enjaz-workforce-entry.js',()=>import('./enjaz-workforce-entry.js')],
    ['./enjaz-v4-compatibility.js',()=>import('./enjaz-v4-compatibility.js')]
  ];
  for(const [modulePath,loader] of capabilityModules)loader().catch(error=>console.error('[ENJAZ_CAPABILITY]',modulePath,error));
  window.addEventListener('error',event=>{const content=document.getElementById('content');if(!content||content.children.length||document.getElementById('auth-gate'))return;reportModuleError('window.error',event.error||event.message)});
  window.addEventListener('unhandledrejection',event=>{const content=document.getElementById('content');if(!content||content.children.length||document.getElementById('auth-gate'))return;reportModuleError('window.unhandledrejection',event.reason)});
}
