import { useEffect } from 'react';

function AuthBridge(){
  useEffect(()=>{
    document.documentElement.classList.add('enjaz-auth-route');
    let host=document.querySelector('.enjaz-root');
    if(!host){ host=document.createElement('div'); host.className='enjaz-root'; document.body.appendChild(host); }
    import('../auth-gate-v2.js').catch(error=>console.error('[ENJAZ_AUTH_BOOT]',error));
    return ()=>{ document.documentElement.classList.remove('enjaz-auth-route'); host?.remove(); };
  },[]);
  return null;
}

function App(){
  if(new URLSearchParams(window.location.search).has('auth')) return <AuthBridge/>;
  return <main className="enjaz-clean-root" aria-label="ENJAZ"></main>;
}

export default App;
