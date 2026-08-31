import { query } from './db.js';

export async function getHealth(){
 const started=Date.now();
 try{
  await query('select 1');
  return {status:'ok',db:'ok',latencyMs:Date.now()-started,timestamp:new Date().toISOString()};
 }catch(error){return {status:'unhealthy',db:'error',latencyMs:Date.now()-started,timestamp:new Date().toISOString()};}
}
