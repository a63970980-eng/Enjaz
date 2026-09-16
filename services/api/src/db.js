import pg from 'pg';
const { Pool } = pg;
let pool;
export function getPool(){
  if(!pool){
    if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    const sslMode=String(process.env.DATABASE_SSL||'').toLowerCase();
    // TLS is enabled and certificate verification is the secure default. A private CA
    // can be supplied explicitly through DATABASE_CA; disabling verification is an
    // emergency compatibility override and must be explicit.
    const rejectUnauthorized=String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED||'true').toLowerCase()!=='false';
    const ssl=sslMode==='false'?false:{rejectUnauthorized,...(process.env.DATABASE_CA?{ca:process.env.DATABASE_CA}: {})};
    pool=new Pool({connectionString:process.env.DATABASE_URL,max:Math.max(1,Math.min(20,Number(process.env.DB_POOL_SIZE||10))),idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl});
    pool.on('error',error=>console.error('[ENJAZ_DB_POOL]',error));
  }
  return pool;
}
export async function query(text,params=[]){return getPool().query(text,params);}
export async function withTransaction(fn){const client=await getPool().connect();try{await client.query('begin');const result=await fn(client);await client.query('commit');return result;}catch(error){try{await client.query('rollback')}catch(rollbackError){console.error('[ENJAZ_DB_ROLLBACK]',rollbackError)}throw error;}finally{client.release();}}
export async function closeDb(){if(pool){await pool.end();pool=undefined;}}