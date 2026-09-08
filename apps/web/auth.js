const env=typeof import.meta!=='undefined'&&import.meta.env?import.meta.env:{};
const DEFAULT_SUPABASE_URL='https://cqmwwrrmmqmgpnhnuxyu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY='sb_publishable_U12modLyDRQWV2sNAJHiqg_vJPOSoOz';
const STORAGE_KEY='enjaz.auth.session.v1';
function firstValid(...values){return values.map(v=>String(v||'').trim()).find(Boolean)||''}
function cfg(){
  const storedUrl=localStorage.getItem('ENJAZ_SUPABASE_URL')||'';
  const storedKey=localStorage.getItem('ENJAZ_SUPABASE_ANON_KEY')||'';
  const url=firstValid(window.ENJAZ_SUPABASE_URL,env.VITE_SUPABASE_URL,storedUrl,DEFAULT_SUPABASE_URL).replace(/\/$/,'');
  const key=firstValid(window.ENJAZ_SUPABASE_ANON_KEY,window.ENJAZ_SUPABASE_KEY,env.VITE_SUPABASE_ANON_KEY,env.VITE_SUPABASE_PUBLISHABLE_KEY,storedKey,DEFAULT_SUPABASE_ANON_KEY);
  return {url,key};
}
export function getSession(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
export function clearSession(){localStorage.removeItem(STORAGE_KEY)}
export function configured(){const c=cfg();return Boolean(c.url&&c.key)}
function authError(d,status){const code=d?.code||d?.error||'';const map={invalid_credentials:'البريد الإلكتروني أو كلمة المرور غير صحيحة.',email_not_confirmed:'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.',user_already_exists:'هذا البريد الإلكتروني مسجل بالفعل.',email_exists:'هذا البريد الإلكتروني مسجل بالفعل.',too_many_requests:'تم تجاوز عدد المحاولات. انتظر قليلًا ثم حاول مرة أخرى.',weak_password:'كلمة المرور لا تستوفي متطلبات الأمان.'};const e=new Error(map[code]||d?.error_description||d?.msg||d?.message||`تعذر إتمام المصادقة (${status}).`);e.code=code;e.status=status;return e}
async function request(path,body){const c=cfg();if(!c.url||!c.key)throw new Error('تعذر تهيئة خدمة المصادقة. أعد تحميل الصفحة وحاول مرة أخرى.');let r;try{r=await fetch(`${c.url}/auth/v1/${path}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':c.key},body:JSON.stringify(body)});}catch{throw new Error('تعذر الاتصال بخدمة المصادقة. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.')}
const d=await r.json().catch(()=>({}));if(!r.ok)throw authError(d,r.status);return d}
export async function signIn(email,password){const cleanEmail=String(email||'').trim().toLowerCase();if(!cleanEmail)throw new Error('أدخل البريد الإلكتروني.');if(!password)throw new Error('أدخل كلمة المرور.');const s=await request('token?grant_type=password',{email:cleanEmail,password});if(!s.access_token)throw new Error('لم يتم إصدار جلسة دخول.');localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s}
export async function signUp(email,password,name){const cleanEmail=String(email||'').trim().toLowerCase();const cleanName=String(name||'').trim();if(!cleanEmail)throw new Error('أدخل البريد الإلكتروني.');if(!cleanName)throw new Error('أدخل اسمك.');if(String(password||'').length<8)throw new Error('اجعل كلمة المرور 8 أحرف على الأقل.');const s=await request('signup',{email:cleanEmail,password,data:{full_name:cleanName}});if(s.access_token)localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s}
export async function signOut(){const s=getSession();if(s?.access_token){try{const c=cfg();await fetch(`${c.url}/auth/v1/logout`,{method:'POST',headers:{Authorization:`Bearer ${s.access_token}`,apikey:c.key}})}catch{}}clearSession()}
export function token(){return getSession()?.access_token||''}
export function user(){return getSession()?.user||null}
