import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';

const slugify=value=>String(value||'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'workspace';

async function uniqueSlug(client,base,table,scopeColumn,scopeValue){
  let slug=slugify(base); let n=1;
  for(;;n++){
    const r=scopeColumn?await client.query(`select 1 from ${table} where slug=$1 and ${scopeColumn}=$2 limit 1`,[slug,scopeValue]):await client.query(`select 1 from ${table} where slug=$1 limit 1`,[slug]);
    if(!r.rowCount)return slug;
    slug=`${slugify(base)}-${n}`;
  }
}

export async function getUserByAuthId(authUserId){
  const r=await query('select id,auth_user_id,organization_id,email,name,role,platform_role,created_at from users where auth_user_id=$1 limit 1',[authUserId]);
  return r.rows[0]||null;
}

export async function listUserWorkspaces(userId){
  const r=await query(`select w.id,w.name,w.slug,w.organization_id,o.name as organization_name,wm.role as workspace_role from workspace_members wm join workspaces w on w.id=wm.workspace_id join organizations o on o.id=w.organization_id where wm.user_id=$1 order by wm.created_at asc`,[userId]);
  return r.rows;
}

export async function bootstrapWorkspace({authUserId,email,name,organizationName,workspaceName}){
  return withTransaction(async client=>{
    let user=(await client.query('select * from users where auth_user_id=$1 limit 1',[authUserId])).rows[0];
    if(user){
      const memberships=(await client.query(`select w.id,w.name,w.slug,w.organization_id,o.name as organization_name,wm.role as workspace_role from workspace_members wm join workspaces w on w.id=wm.workspace_id join organizations o on o.id=w.organization_id where wm.user_id=$1 order by wm.created_at asc`,[user.id])).rows;
      return {user,workspaces:memberships,created:false};
    }
    const orgId=randomUUID();
    const orgSlug=await uniqueSlug(client,organizationName||name||'Enjaz workspace','organizations');
    await client.query('insert into organizations(id,name,slug) values($1,$2,$3)',[orgId,organizationName||name||'My Organization',orgSlug]);
    const userId=randomUUID();
    await client.query('insert into users(id,auth_user_id,organization_id,email,name,role,platform_role) values($1,$2,$3,$4,$5,$6,public.assign_first_platform_admin($1))',[userId,authUserId,orgId,email,name||email.split('@')[0], 'owner']);
    const workspaceId=randomUUID();
    const wsSlug=await uniqueSlug(client,workspaceName||'Main Workspace','workspaces','organization_id',orgId);
    await client.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4)',[workspaceId,orgId,workspaceName||'Main Workspace',wsSlug]);
    await client.query("insert into workspace_members(workspace_id,user_id,role) values($1,$2,'manager')",[workspaceId,userId]);
    await client.query(`insert into audit_events(id,workspace_id,event_type,actor_type,action,metadata) values($1,$2,$3,$4,$5,$6::jsonb)`,[randomUUID(),workspaceId,'workspace.created','user','onboarding.bootstrap',JSON.stringify({organizationId:orgId,userId})]);
    const createdUser=(await client.query('select id,auth_user_id,organization_id,email,name,role,platform_role from users where id=$1',[userId])).rows[0];
    const workspace={id:workspaceId,name:workspaceName||'Main Workspace',slug:wsSlug,organization_id:orgId,organization_name:organizationName||name||'My Organization',workspace_role:'manager'};
    return {user:createdUser,workspaces:[workspace],created:true};
  });
}
