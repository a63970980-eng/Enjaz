import pg from 'pg';
const { Pool } = pg;

let pool;
export function getPool(){
  if(!pool){
    if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    pool=new Pool({connectionString:process.env.DATABASE_URL, max:Number(process.env.DB_POOL_SIZE||10), idleTimeoutMillis:30000, connectionTimeoutMillis:5000, ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
  }
  return pool;
}
export async function query(text, params=[]){ return getPool().query(text,params); }
export async function closeDb(){ if(pool){await pool.end(); pool=undefined;} }
