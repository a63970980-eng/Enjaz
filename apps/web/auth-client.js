const supabaseUrl=window.ENJAZ_SUPABASE_URL||import.meta.env?.VITE_ENJAZ_SUPABASE_URL||'https://cqmwwrrmmqmgpnhnuxyu.supabase.co';
const supabaseKey=window.ENJAZ_SUPABASE_ANON_KEY||window.ENJAZ_SUPABASE_KEY||import.meta.env?.VITE_ENJAZ_SUPABASE_ANON_KEY||'';
const configured=Boolean(supabaseUrl&&supabaseKey);
const key='ENJAZ_ACCESS_TOKEN';
const refreshKey='ENJAZ_REFRESH_TOKEN';
const jsonHeaders={'Content-Type':'application/json','apikey':supabaseKey};
async function authRequest(path,body){const r=await fetch(`${supabaseUrl}/auth/v1/${path}`,{method:'POST',headers:jsonHeaders,body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error_description||data.msg||data.message||'تعذر إكمال عملية الدخول');return data;}
export const authClient={
 configured,
 token:()=>sessionStorage.getItem(key)||'',
 async signIn(email,password){const data=await authRequest('token?grant_type=password',{email,password});sessionStorage.setItem(key,data.access_token||'');if(data.refresh_token)sessionStorage.setItem(refreshKey,data.refresh_token);return data;},
 async signUp(email,password,name){const redirectTo=`${location.origin}${location.pathname}`;const data=await authRequest('signup',{email,password,data:{full_name:name},options:{email_redirect_to:redirectTo}});if(data.access_token){sessionStorage.setItem(key,data.access_token||'');if(data.refresh_token)sessionStorage.setItem(refreshKey,data.refresh_token);}return {data,needsEmailConfirmation:!data.access_token};},
 signOut(){sessionStorage.removeItem(key);sessionStorage.removeItem(refreshKey);sessionStorage.removeItem('ENJAZ_USER_PROFILE');sessionStorage.removeItem('ENJAZ_WORKSPACES');sessionStorage.removeItem('ENJAZ_ACCESS_TOKEN');localStorage.removeItem('ENJAZ_WORKSPACE_ID');},
 async bootstrap(apiBase,{name,organizationName,workspaceName}){if(!apiBase)throw new Error('خدمة تهيئة مساحة العمل غير متاحة حاليًا. سجّل الدخول ثم استخدم مساحة العمل المهيأة.');const token=this.token();const r=await fetch(`${apiBase}/api/v1/onboarding/bootstrap`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({name,organizationName,workspaceName})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'تعذر إنشاء مساحة العمل');return data.data;},
 async me(apiBase){const token=this.token();if(!token)return null;if(!apiBase)return {user:{id:null},workspaces:[]};const r=await fetch(`${apiBase}/api/v1/auth/me`,{headers:{Authorization:`Bearer ${token}`}});if(r.status===401){this.signOut();return null;}const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'تعذر قراءة جلسة المستخدم');return data.data;}
};