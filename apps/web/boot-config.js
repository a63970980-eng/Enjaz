(()=>{
  const q=new URLSearchParams(location.search);
  const apiDefault='https://cqmwwrrmmqmgpnhnuxyu.supabase.co/functions/v1/enjaz-api';
  const sbDefault='https://cqmwwrrmmqmgpnhnuxyu.supabase.co';
  const keyDefault='sb_publishable_U12modLyDRQWV2sNAJHiqg_vJPOSoOz';
  window.ENJAZ_API_BASE=localStorage.getItem('ENJAZ_API_BASE')||apiDefault;
  window.ENJAZ_SUPABASE_URL=localStorage.getItem('ENJAZ_SUPABASE_URL')||sbDefault;
  window.ENJAZ_SUPABASE_KEY=localStorage.getItem('ENJAZ_SUPABASE_ANON_KEY')||keyDefault;
  const workspace=q.get('workspaceId')||localStorage.getItem('ENJAZ_WORKSPACE_ID')||'';
  if(q.get('workspaceId'))localStorage.setItem('ENJAZ_WORKSPACE_ID',workspace);
  window.ENJAZ_WORKSPACE_ID=workspace;
  window.ENJAZ_ACCESS_TOKEN=sessionStorage.getItem('ENJAZ_ACCESS_TOKEN')||'';
})();
