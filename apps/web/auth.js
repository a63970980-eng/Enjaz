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
async function request(path,body){const c=cfg();if(!c.url||!c.key)throw new Error('تعذر تهيئة خدمة المصادقة. أعد تحميل الصفحة وحاول مرة أخرى.');const r=await fetch(`${c.url}/auth/v1/${path}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':c.key},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error_description||d.msg||d.message||'تعذر إتمام المصادقة.');return d}
export async function signIn(email,password){const s=await request('token?grant_type=password',{email,password});if(!s.access_token)throw new Error('لم يتم إصدار جلسة دخول.');localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s}
export async function signUp(email,password,name){const s=await request('signup',{email,password,data:{full_name:name}});if(s.access_token)localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return s}
export async function signOut(){const s=getSession();if(s?.access_token){try{const c=cfg();await fetch(`${c.url}/auth/v1/logout`,{method:'POST',headers:{Authorization:`Bearer ${s.access_token}`,apikey:c.key}})}catch{}}clearSession()}
export function token(){return getSession()?.access_token||''}
export function user(){return getSession()?.user||null}
