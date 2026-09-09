import {apiClient} from './api-client.js';
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
let loaded=false;
async function sync(){
 const token=sessionStorage.getItem('ENJAZ_ACCESS_TOKEN')||'';const workspaceId=localStorage.getItem('ENJAZ_WORKSPACE_ID')||'';if(!token||!workspaceId)return;
 const profile=(()=>{try{return JSON.parse(sessionStorage.getItem('ENJAZ_USER_PROFILE')||'null')}catch{return null}})();
 const memberships=(()=>{try{return JSON.parse(sessionStorage.getItem('ENJAZ_WORKSPACES')||'[]')}catch{return []}})();
 const workspace=memberships.find(x=>String(x.id)===String(workspaceId));
 const workspaceBox=document.querySelector('.enjaz-workspace');if(workspaceBox){workspaceBox.innerHTML=`<small>مساحة العمل</small><strong>${esc(workspace?.name||workspace?.workspace_name||'مساحة العمل')}</strong><span>● متصلة وآمنة</span>`}
 const user=document.querySelector('.top-user');if(user){const name=profile?.identity?.name||profile?.user?.name||profile?.user?.email||'مستخدم';user.innerHTML=`<span class="avatar">${esc(name.trim().charAt(0)||'م')}</span><div><strong>${esc(name)}</strong><small>${esc(workspace?.role||profile?.role||'عضو مساحة العمل')}</small></div>`}
 try{const result=await apiClient.approvals(workspaceId,token);const pending=Array.isArray(result.data)?result.data.filter(x=>x.status==='pending').length:0;const bell=document.querySelector('.top-actions .icon-btn');if(bell){bell.innerHTML=`♢${pending?`<b>${pending}</b>`:''}`;bell.title=pending?`${pending} موافقة معلقة`:'لا توجد موافقات معلقة'}}catch{}
 loaded=true;
}
function boot(){if(loaded)return;sync();const observer=new MutationObserver(()=>sync());observer.observe(document.body,{subtree:true,childList:true});setTimeout(()=>sync(),1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();