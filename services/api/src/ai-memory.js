import { randomUUID } from 'node:crypto';
import { query } from './db.js';

const MAX_RECALL = 100;
const EMBEDDING_DIMENSIONS = 1536;

function normalizeEmbedding(embedding) {
  if (Array.isArray(embedding)) {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Embedding must contain exactly ${EMBEDDING_DIMENSIONS} dimensions`);
    }
    if (embedding.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
      throw new Error('Embedding must contain only finite numbers');
    }
    return `[${embedding.join(',')}]`;
  }
  if (typeof embedding === 'string' && /^\[(?:-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)(?:,-?\d+(?:\.\d+)?(?:e[+-]?\d+)?){1535}\]$/i.test(embedding)) {
    return embedding;
  }
  throw new Error(`Embedding must be an array of ${EMBEDDING_DIMENSIONS} finite numbers`);
}

export async function remember({workspaceId,employeeId,taskId,type='task',content,metadata={}}){
  if(!content)throw new Error('Memory content is required');
  return (await query('insert into ai_employee_memory (id,workspace_id,employee_id,task_id,memory_type,content,metadata) values ($1,$2,$3,$4,$5,$6,$7::jsonb) returning *',[randomUUID(),workspaceId,employeeId,taskId,type,content,JSON.stringify(metadata)])).rows[0];
}

export async function recall({workspaceId,employeeId,limit=20}){
  return (await query('select id,memory_type,content,metadata,created_at from ai_employee_memory where workspace_id=$1 and employee_id=$2 order by created_at desc limit $3',[workspaceId,employeeId,Math.min(Math.max(limit,1),MAX_RECALL)])).rows;
}

export async function rememberSemantic({workspaceId,employeeId,memoryId,content,embedding,model,metadata={}}){
  if(!workspaceId||!employeeId)throw new Error('Semantic memory requires workspace and employee');
  if(!content)throw new Error('Semantic memory content is required');
  if(!model)throw new Error('Embedding model is required');
  const vector=normalizeEmbedding(embedding);
  return (await query(`
    insert into ai_employee_memory_embeddings
      (id,workspace_id,employee_id,memory_id,content,embedding,model,metadata)
    values ($1,$2,$3,$4,$5,$6::extensions.vector,$7,$8::jsonb)
    on conflict (memory_id) where memory_id is not null
    do update set content=excluded.content, embedding=excluded.embedding, model=excluded.model,
                  metadata=excluded.metadata, updated_at=now()
    returning id,workspace_id,employee_id,memory_id,content,model,metadata,created_at,updated_at
  `,[randomUUID(),workspaceId,employeeId,memoryId||null,content,vector,model,JSON.stringify(metadata)])).rows[0];
}

export async function recallSemantic({workspaceId,employeeId,embedding,limit=8,minSimilarity=0.70}){
  if(!workspaceId||!employeeId)throw new Error('Semantic recall requires workspace and employee');
  const vector=normalizeEmbedding(embedding);
  return (await query(`
    select * from public.match_ai_employee_memory($1,$2,$3::extensions.vector,$4,$5)
  `,[workspaceId,employeeId,vector,Math.min(Math.max(limit,1),50),Math.min(Math.max(minSimilarity,0),1)])).rows;
}

export { EMBEDDING_DIMENSIONS };
