/* Enjaz Workforce Entry
 * The primary workforce action is the ready digital workforce catalog.
 * The application still uses the existing provisioning flow underneath,
 * but every entry point presents it as a curated Enjaz workforce experience.
 */
function normalizeEntryButtons(){
  document.querySelectorAll('[data-action="create-employee"]').forEach(button=>{
    button.dataset.workforceLibraryEntry='1';
    button.textContent='مكتبة الموظفين';
    button.title='اختيار موظف رقمي جاهز من مكتبة إنجاز';
    button.setAttribute('aria-label','فتح مكتبة الموظفين الجاهزين');
  });
}

function boot(){
  normalizeEntryButtons();
  new MutationObserver(normalizeEntryButtons).observe(document.body,{subtree:true,childList:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
