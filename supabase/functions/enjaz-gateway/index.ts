import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const STATIC_ALLOWED_ORIGINS = new Set([
  "https://enjaz-workforce.netlify.app",
  "https://main--enjaz-workforce.netlify.app",
  "https://delicate-nougat-febf5b.netlify.app",
  "https://main--delicate-nougat-febf5b.netlify.app",
  "https://enjaz-eight.vercel.app",
  "https://enjaz-a63970980-engs-projects.vercel.app",
  "https://enjaz-git-main-a63970980-engs-projects.vercel.app",
]);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;
  return /^https:\/\/enjaz-[a-z0-9-]+-a63970980-engs-projects\.vercel\.app$/i.test(origin);
}

function cors(origin: string | null) {
  const allowed = isAllowedOrigin(origin) ? origin! : "null";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: "Gateway is not configured" }), {
      status: 503,
      headers: { ...cors(origin), "content-type": "application/json" },
    });
  }

  const target = new URL(req.url);
  const path = target.pathname.replace(/^\/functions\/v1\/enjaz-gateway/, "") || "/";
  const upstream = new URL(`${supabaseUrl}/functions/v1/enjaz-api${path}`);
  upstream.search = target.search;

  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    if (["authorization", "content-type", "x-client-info"].includes(key.toLowerCase())) headers.set(key, value);
  }
  headers.set("apikey", anonKey);

  const body = req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS" ? undefined : await req.arrayBuffer();
  const response = await fetch(upstream, { method: req.method, headers, body });
  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors(origin))) responseHeaders.set(key, value);
  responseHeaders.set("x-enjaz-gateway", "active");

  return new Response(responseBody, { status: response.status, headers: responseHeaders });
});
