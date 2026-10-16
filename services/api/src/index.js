const port=process.env.PORT||4000;
const supabaseUrl=process.env.SUPABASE_URL||'';
const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
// Supabase configuration is required in production; the health/version routes remain boot-safe when it is not provisioned.
const allowedOrigins=new Set((process.env.CORS_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean));