-- Role-scoped MCP capabilities for the existing Enjaz workforce.
-- Applied to production before this migration was committed for source-control parity.

update public.ai_employees
set tools = (
  select jsonb_agg(distinct x order by x)
  from jsonb_array_elements_text(
    tools
    || case when tools @> '["app.api.read"]'::jsonb then '["mcp.tools.list"]'::jsonb else '[]'::jsonb end
    || case when tools @> '["approval.request"]'::jsonb
              or tools @> '["workflow.run"]'::jsonb
              or tools @> '["project.manage"]'::jsonb
            then '["mcp.tool.call"]'::jsonb else '[]'::jsonb end
  ) x
),
updated_at=now()
where status='active'
  and (
    tools @> '["app.api.read"]'::jsonb
    or tools @> '["approval.request"]'::jsonb
    or tools @> '["workflow.run"]'::jsonb
    or tools @> '["project.manage"]'::jsonb
  );

update public.employee_role_templates
set tools = (
  select jsonb_agg(distinct x order by x)
  from jsonb_array_elements_text(
    tools
    || case when tools @> '["app.api.read"]'::jsonb then '["mcp.tools.list"]'::jsonb else '[]'::jsonb end
    || case when tools @> '["approval.request"]'::jsonb
              or tools @> '["workflow.run"]'::jsonb
              or tools @> '["project.manage"]'::jsonb
            then '["mcp.tool.call"]'::jsonb else '[]'::jsonb end
  ) x
)
where tools @> '["app.api.read"]'::jsonb
   or tools @> '["approval.request"]'::jsonb
   or tools @> '["workflow.run"]'::jsonb
   or tools @> '["project.manage"]'::jsonb;
