-- Applied to production 2026-09-26.
-- External read capability is intentionally granted only to operational roles that
-- commonly need connected business applications. High-risk external writes remain
-- behind the app.api.request tool and approval gate.
update public.ai_employees
set tools = case
 when jsonb_typeof(to_jsonb(tools))='array' and not (to_jsonb(tools) @> '["app.api.read"]'::jsonb)
 then to_jsonb(tools) || '["app.api.read"]'::jsonb
 else to_jsonb(tools)
 end
where workspace_id=(select id from public.workspaces order by created_at limit 1)
and (
 name ilike '%محاسب%' or name ilike '%مالية%' or name ilike '%موارد بشرية%' or name ilike '%HR%'
 or name ilike '%تسويق%' or name ilike '%مبيعات%' or name ilike '%علاقات العملاء%'
 or name ilike '%خدمة%' or name ilike '%تجربة العملاء%' or name ilike '%تجربة المستفيد%'
 or name ilike '%مدير العمليات%' or name ilike '%مساعد تنفيذي%' or name ilike '%مدير المشاريع%'
);
update public.employee_role_templates
set tools = case
 when jsonb_typeof(tools)='array' and not (tools @> '["app.api.read"]'::jsonb)
 then tools || '["app.api.read"]'::jsonb
 else tools
 end
where name ilike '%محاسب%' or name ilike '%مالية%' or name ilike '%موارد بشرية%' or name ilike '%HR%'
 or name ilike '%تسويق%' or name ilike '%مبيعات%' or name ilike '%علاقات العملاء%'
 or name ilike '%خدمة%' or name ilike '%تجربة العملاء%' or name ilike '%تجربة المستفيد%'
 or name ilike '%مدير العمليات%' or name ilike '%مساعد تنفيذي%' or name ilike '%مدير المشاريع%';