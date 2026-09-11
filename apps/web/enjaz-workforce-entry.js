/* Enjaz Workforce Entry
 * The primary workforce action is the ready digital workforce catalog.
 * Manual employee creation is intentionally not exposed from the product UI.
 */
function openLibrary(){
  const nav=document.querySelector('[data-nav="employees"]');
  if(nav){nav.click();return;}
  const url=new URL(location.href);
  url.search='';
  url.searchParams.set('workspace','employees');
  location.assign(url.toString());
}

function normalizeEntryButtons(){
  document.querySelectorAll('[data-action="create-employee"]').forEach(button=>{
    button.dataset.workforceLibraryEntry='1';
    button.textContent='مكتبة الموظفين';
    button.title='اختيار موظف رقمي جاهز من مكتبة إنجاز';
    button.setAttribute('aria-label','فتح مكتبة الموظفين الجاهزين');
    button.onclick=(event)=>{event.preventDefault();event.stopPropagation();openLibrary()};
  });
}

function boot(){
  normalizeEntryButtons();
  new MutationObserver(normalizeEntryButtons).observe(document.body,{subtree:true,childList:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
