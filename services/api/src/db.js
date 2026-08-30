import pg from 'pg';
const { Pool } = pg;
let pool;
export function getPool(){
  if(!pool){
    if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    const sslMode=process.env.DATABASE_SSL;
    const ssl=sslMode==='false'?false:{rejectUnauthorized:true,...(process.env.DATABASE_CA?{ca:process.env.DATABASE_CA}: {})};
    pool=new Pool({connectionString:process.env.DATABASE_URL,max:Number(process.env.DB_POOL_SIZE||10),idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl});
  }
  return pool;
}
export async function query(text,params=[]){return getPool().query(text,params);}
export async function withTransaction(fn){const client=await getPool().connect();try{await client.query('begin');const result=await fn(client);await client.query('commit');return result;}catch(error){await client.query('rollback');throw error;}finally{client.release();}}
export async function closeDb(){if(pool){await pool.end();pool=undefined;}}
