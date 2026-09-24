import { query } from '../db.js';
import { registerTool } from '../tool-registry.js';

registerTool({name:'commerce.orders.list',description:'Read recent ecommerce orders for the current workspace.',risk:'low',execute:async({input,context})=>{
 const limit=Math.min(100,Math.max(1,Number(input?.limit)||20)); const status=input?.status?String(input.status):null; const params=[context.workspaceId]; let where='workspace_id=$1';
 if(status){params.push(status);where+=' and status=$2';} params.push(limit);
 const rows=(await query('select id,external_id,status,fulfillment_status,payment_status,total,currency,ordered_at from commerce_orders where '+where+' order by ordered_at desc nulls last limit $'+params.length,params)).rows;
 return {type:'commerce_orders',orders:rows};
}});
registerTool({name:'commerce.products.list',description:'Read ecommerce products and inventory levels for the current workspace.',risk:'low',execute:async({input,context})=>{
 const limit=Math.min(100,Math.max(1,Number(input?.limit)||50));
 const rows=(await query('select id,external_id,sku,name,status,price,cost,currency,inventory_qty from commerce_products where workspace_id=$1 order by updated_at desc limit $2',[context.workspaceId,limit])).rows;
 return {type:'commerce_products',products:rows};
}});
registerTool({name:'commerce.inventory.alerts',description:'Find ecommerce products whose inventory is at or below a threshold.',risk:'low',execute:async({input,context})=>{
 const threshold=Number.isFinite(Number(input?.threshold))?Number(input.threshold):5;
 const rows=(await query('select id,sku,name,inventory_qty,price,currency from commerce_products where workspace_id=$1 and inventory_qty <= $2 order by inventory_qty asc limit 100',[context.workspaceId,threshold])).rows;
 return {type:'inventory_alerts',threshold,products:rows};
}});
registerTool({name:'commerce.analytics.summary',description:'Calculate a compact ecommerce operating summary from synced orders.',risk:'low',execute:async({input,context})=>{
 const days=Math.min(90,Math.max(1,Number(input?.days)||30));
 const row=(await query("select count(*)::int as orders,coalesce(sum(total),0)::numeric as revenue,coalesce(avg(total),0)::numeric as average_order_value,count(*) filter(where status='cancelled')::int as cancelled_orders from commerce_orders where workspace_id=$1 and ordered_at >= now()-($2::text||' days')::interval",[context.workspaceId,String(days)])).rows[0];
 return {type:'commerce_summary',days,metrics:row};
}});
registerTool({name:'commerce.customer.lookup',description:'Look up a customer record by email, phone, or external id.',risk:'low',execute:async({input,context})=>{
 const term=String(input?.query||'').trim(); if(!term)throw new Error('Customer lookup requires query');
 const rows=(await query('select id,external_id,name,email,phone,orders_count,lifetime_value,last_order_at from commerce_customers where workspace_id=$1 and (email ilike $2 or phone ilike $2 or external_id ilike $2) limit 10',[context.workspaceId,'%'+term+'%'])).rows;
 return {type:'commerce_customers',customers:rows};
}});
