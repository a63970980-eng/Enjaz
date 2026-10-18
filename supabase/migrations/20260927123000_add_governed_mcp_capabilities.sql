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

DO $$ BEGIN
  IF to_regclass('public.employee_role_templates') IS NOT NULL THEN
    UPDATE public.employee_role_templates
    SET tools = (
      SELECT jsonb_agg(distinct x order by x)
      FROM jsonb_array_elements_text(
        tools
        || case when tools @> '["app.api.read"]'::jsonb then '["mcp.tools.list"]'::jsonb else '[]'::jsonb end
        || case when tools @> '["approval.request"]'::jsonb
                  or tools @> '["workflow.run"]'::jsonb
                  or tools @> '["project.manage"]'::jsonb
                then '["mcp.tool.call"]'::jsonb else '[]'::jsonb end
      ) x
    )
    WHERE tools @> '["app.api.read"]'::jsonb
       OR tools @> '["approval.request"]'::jsonb
       OR tools @> '["workflow.run"]'::jsonb
       OR tools @> '["project.manage"]'::jsonb;
  END IF;
END $$;
