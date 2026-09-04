import { apiClient } from './api-client.js';

const labels = { hospital: 'المستشفيات', restaurant: 'المطاعم', hotel: 'الفنادق', enterprise: 'الشركات', government: 'الجهات الحكومية' };
let selectedPack = '';
let busy = false;

const workspace = () => localStorage.getItem('ENJAZ_WORKSPACE_ID') || new URLSearchParams(location.search).get('workspaceId') || '';
const token = () => sessionStorage.getItem('ENJAZ_ACCESS_TOKEN') || '';
const setStatus = (dialog, message, error = false) => {
  let node = dialog.querySelector('.industry-provision-status');
  if (!node) {
    node = document.createElement('div');
    node.className = 'industry-provision-status';
    node.style.cssText = 'margin-top:12px;padding:10px 12px;border-radius:10px;font-size:12px;background:#f1f5f2;color:#315b48';
    dialog.querySelector('.industry-cta')?.before(node);
  }
  node.textContent = message;
  node.style.background = error ? '#fff0f0' : '#f1f5f2';
  node.style.color = error ? '#9a3434' : '#315b48';
};

async function provision(button) {
  if (busy || !selectedPack) return;
  const ws = workspace();
  const auth = token();
  const dialog = button.closest('.industry-dialog') || document.body;
  if (!ws || !auth) {
    setStatus(dialog, 'يجب تسجيل الدخول واختيار مساحة عمل قبل إنشاء الهيكل.', true);
    return;
  }
  busy = true;
  button.disabled = true;
  button.textContent = 'جاري إنشاء الهيكل…';
  setStatus(dialog, `جاري إنشاء ${labels[selectedPack] || 'القطاع'}: الأقسام والموظفون والأهداف والمعرفة…`);
  try {
    const result = await apiClient.provisionIndustryPack(ws, auth, selectedPack);
    const data = result?.data || result;
    const verb = data?.created ? 'تم إنشاء' : 'الهيكل موجود مسبقًا — تم التحقق من';
    setStatus(dialog, `${verb} ${data?.employees || 0} موظفًا رقميًا و${data?.departments || 0} أقسام في ${labels[selectedPack] || selectedPack}.`);
    button.textContent = data?.created ? 'تم إنشاء الهيكل ✓' : 'الهيكل موجود ✓';
    setTimeout(() => {
      document.querySelector('.industry-close')?.click();
      document.querySelector('[data-nav="employees"]')?.click();
    }, 900);
  } catch (error) {
    setStatus(dialog, error?.message || 'تعذر إنشاء الهيكل. حاول مرة أخرى.', true);
    button.disabled = false;
    button.textContent = 'إنشاء الهيكل الرقمي';
  } finally {
    busy = false;
  }
}

function attachModalButton() {
  const button = document.querySelector('.industry-dialog .primary-industry');
  if (!button || button.dataset.enjazProvisionBound === '1') return;
  button.dataset.enjazProvisionBound = '1';
  button.textContent = 'إنشاء الهيكل الرقمي';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    void provision(button);
  }, true);
}

document.addEventListener('click', event => {
  const card = event.target.closest?.('[data-industry]');
  if (card) {
    selectedPack = card.dataset.industry || '';
    setTimeout(attachModalButton, 0);
  }
});

new MutationObserver(attachModalButton).observe(document.body, { childList: true, subtree: true });
setTimeout(attachModalButton, 500);
