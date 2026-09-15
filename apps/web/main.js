const params=new URLSearchParams(window.location.search);
const authRoute=params.has('auth');

const report=(scope,error)=>{
  console.error(`[ENJAZ_${scope}]`,error);
};

// Keep the public experience independent from optional workspace/enhancement modules.
// A failure in an enhancement must never strand the user on the boot placeholder.
const loadOptional=(path,loader)=>loader().catch(error=>report('MODULE',`${path}: ${error?.message||error}`));

// Non-blocking configuration/icon/motion enhancements.
loadOptional('./boot-config.js',()=>import('./boot-config.js'));
loadOptional('./@tabler-icons',()=>import('@tabler/icons-webfont/dist/tabler-icons.min.css'));
loadOptional('./enjaz-production-hardening.js',()=>import('./enjaz-production-hardening.js'));
loadOptional('./enjaz-product-visuals.js',()=>import('./enjaz-product-visuals.js'));
loadOptional('./enjaz-motion.js',()=>import('./enjaz-motion.js'));

if(authRoute){
  document.documentElement.classList.add('enjaz-auth-route');
  loadOptional('./auth-gate-v2.js',()=>import('./auth-gate-v2.js'));
}else{
  // Public landing is the critical first paint and must execute independently.
  loadOptional('./enjaz-public.js',()=>import('./enjaz-public.js'));

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

  const reportModuleError=(modulePath,error)=>{
    report('PUBLIC_BOOT',`${modulePath}: ${error?.message||error}`);
    const content=document.getElementById('content');
    // Do not overwrite a successfully rendered public landing page.
    if(content&&!content.children.length&&!document.getElementById('auth-gate')){
      const safe=String(error?.message||error||'خطأ غير متوقع').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
      content.innerHTML=`<div class="boot-error" role="alert"><strong>تعذر تشغيل إنجاز</strong><span>${safe}</span><button type="button" onclick="location.reload()">إعادة المحاولة</button></div>`;
    }
  };

  import('./app-entry-v2.js').catch(error=>reportModuleError('./app-entry-v2.js',error));

  const capabilityModules=[
    ['./enjaz-industry-library.js',()=>import('./enjaz-industry-library.js')],
    ['./enjaz-employee-360.js',()=>import('./enjaz-employee-360.js')],
    ['./task-360.js',()=>import('./task-360.js')],
    ['./enjaz-workforce-entry.js',()=>import('./enjaz-workforce-entry.js')],
    ['./enjaz-v4-compatibility.js',()=>import('./enjaz-v4-compatibility.js')]
  ];
  for(const [modulePath,loader] of capabilityModules)loadOptional(modulePath,loader);

  window.addEventListener('error',event=>{
    const content=document.getElementById('content');
    if(!content||content.children.length||document.getElementById('auth-gate'))return;
    reportModuleError('window.error',event.error||event.message);
  });
  window.addEventListener('unhandledrejection',event=>{
    const content=document.getElementById('content');
    if(!content||content.children.length||document.getElementById('auth-gate'))return;
    reportModuleError('window.unhandledrejection',event.reason);
  });
}
