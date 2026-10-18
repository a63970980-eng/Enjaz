import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGINS = new Set([
  "https://enjaz-workforce.netlify.app",
  "https://storied-babka-115bba.netlify.app",
  "https://enjaz-a63970980-engs-projects.vercel.app",
  "https://enjaz-git-main-a63970980-engs-projects.vercel.app",
  "https://enjaz-eight.vercel.app",
  "https://enjaz-ga81a1fmf-a63970980-engs-projects.vercel.app",
]);
const labels: Record<string, string> = {
  hospital: "المستشفيات",
  restaurant: "المطاعم",
  hotel: "الفنادق",
  enterprise: "الشركات",
  government: "الجهات الحكومية",
  retail: "التجزئة",
  ecommerce: "التجارة الإلكترونية",
  finance: "المالية",
  sales: "المبيعات",
  customer_service: "خدمة العملاء",
  hr: "الموارد البشرية",
  marketing: "التسويق",
  operations: "العمليات",
};
type WorkforceTemplateSummary = {
  sector: string;
  sector_label: string | null;
  department_name: string | null;
  role_code: string | null;
  provision_by_default: boolean;
};
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ORIGINS.has(origin) ? origin : "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Vary": "Origin",
  "content-type": "application/json; charset=utf-8",
});
const out = (data: unknown, status: number, origin: string | null) => new Response(JSON.stringify(data), {
  status,
  headers: { ...cors(origin), "x-content-type-options": "nosniff", "x-frame-options": "DENY" },
});

Deno.serve(async req => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });

  const base = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !anon || !service) return out({ error: "Production API is not fully configured" }, 503, origin);

  const auth = createClient(base, anon, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
  const db = createClient(base, service);
  const { data: authUser, error: authError } = await auth.auth.getUser();
  if (authError || !authUser.user) return out({ error: "Authentication required" }, 401, origin);

  const { data: profile, error: profileError } = await db.from("users").select("id")
    .eq("auth_user_id", authUser.user.id).maybeSingle();
  if (profileError || !profile) return out({ error: "Workspace profile not found" }, 403, origin);

  const url = new URL(req.url);
  if (req.method === "GET" && /\/industry-packs\/?$/.test(url.pathname)) {
    const { data: templateRows, error } = await db.from("employee_role_templates")
      .select("sector,sector_label,department_name,role_code,provision_by_default")
      .eq("active", true).order("sector").order("department_name").order("sort_order");
    if (error) return out({ error: "Could not load workforce catalog" }, 500, origin);
    const templates = (templateRows || []) as WorkforceTemplateSummary[];

    const packs = Object.entries(labels).map(([id, label]) => {
      const catalogSector = id === "ecommerce" ? "retail" : id;
      const roles = templates.filter(template => template.sector === catalogSector);
      const starters = roles.filter(template => template.provision_by_default === true);
      return {
        id,
        label,
        roles: roles.length,
        starterEmployees: starters.length,
        departments: [...new Set(starters.map(template => template.department_name).filter(Boolean))].length,
        ready: starters.length > 0,
      };
    }).filter(pack => pack.starterEmployees > 0);
    return out({ data: packs }, 200, origin);
  }

  let match: RegExpMatchArray | null;
  try {
    match = url.pathname.match(/\/industry-packs\/([^/]+)\/provision$/);
    if (match) match[1] = decodeURIComponent(match[1]);
  } catch {
    return out({ error: "Invalid industry pack" }, 400, origin);
  }
  if (req.method !== "POST" || !match) return out({ error: "Not found" }, 404, origin);
  const pack = match[1];
  if (!labels[pack]) return out({ error: `Unknown industry pack: ${pack}` }, 400, origin);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) return out({ error: "workspaceId is required" }, 400, origin);

  const { data: membership, error: membershipError } = await db.from("workspace_members")
    .select("role").eq("workspace_id", workspaceId).eq("user_id", profile.id).maybeSingle();
  if (membershipError || !membership || !["owner", "admin", "manager"].includes(membership.role)) {
    return out({ error: "Manager permission required" }, 403, origin);
  }

  const { data, error } = await db.rpc("provision_industry_pack", {
    p_workspace_id: workspaceId,
    p_pack: pack,
    p_actor_user_id: profile.id,
  });
  if (error) {
    const reason = String(error.message || "");
    const mapped: Record<string, { status: number; error: string; code?: string }> = {
      UNKNOWN_INDUSTRY_PACK: { status: 400, error: "Unknown industry pack" },
      WORKSPACE_NOT_FOUND: { status: 404, error: "Workspace not found" },
      MANAGER_PERMISSION_REQUIRED: { status: 403, error: "Manager permission required" },
      SUBSCRIPTION_NOT_CONFIGURED: { status: 409, error: "Workspace subscription is not configured", code: "SUBSCRIPTION_NOT_CONFIGURED" },
      SUBSCRIPTION_INACTIVE: { status: 402, error: "Workspace subscription is not active", code: "SUBSCRIPTION_INACTIVE" },
      EMPLOYEE_LIMIT_EXCEEDED: { status: 402, error: "The selected starter team exceeds this plan's employee limit", code: "EMPLOYEE_LIMIT_EXCEEDED" },
      INDUSTRY_PACK_INCOMPLETE: { status: 409, error: "An incomplete starter team from an earlier provisioning attempt needs reconciliation", code: "INDUSTRY_PACK_INCOMPLETE" },
      NO_STARTER_ROLES_CONFIGURED: { status: 404, error: "No starter roles configured for this sector" },
    };
    const key = Object.keys(mapped).find(candidate => reason.includes(candidate));
    return key ? out(mapped[key], mapped[key].status, origin)
      : out({ error: "Starter workforce setup failed; retry is safe", code: "INDUSTRY_PROVISION_FAILED" }, 500, origin);
  }
  return out({ data }, data?.created ? 201 : 200, origin);
});
