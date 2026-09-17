-- Semantic memory layer for ENJAZ AI employees.
-- Uses Supabase/Postgres pgvector so embeddings stay inside the tenant database.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.ai_employee_memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  memory_id uuid REFERENCES public.ai_employee_memory(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding extensions.vector(1536) NOT NULL,
  model text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_employee_memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_memory_embeddings_employee
  ON public.ai_employee_memory_embeddings(workspace_id, employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_memory_embeddings_hnsw
  ON public.ai_employee_memory_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_memory_embedding_memory
  ON public.ai_employee_memory_embeddings(memory_id)
  WHERE memory_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.match_ai_employee_memory(
  p_workspace_id uuid,
  p_employee_id uuid,
  p_embedding extensions.vector(1536),
  p_match_count integer DEFAULT 8,
  p_min_similarity double precision DEFAULT 0.70
) RETURNS TABLE (
  id uuid,
  memory_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    e.id,
    e.memory_id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> p_embedding) AS similarity
  FROM public.ai_employee_memory_embeddings AS e
  WHERE e.workspace_id = p_workspace_id
    AND e.employee_id = p_employee_id
    AND 1 - (e.embedding <=> p_embedding) >= p_min_similarity
  ORDER BY e.embedding <=> p_embedding
  LIMIT GREATEST(1, LEAST(p_match_count, 50));
$$;

REVOKE ALL ON TABLE public.ai_employee_memory_embeddings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_employee_memory_embeddings TO service_role;

REVOKE ALL ON FUNCTION public.match_ai_employee_memory(uuid, uuid, extensions.vector, integer, double precision)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_ai_employee_memory(uuid, uuid, extensions.vector, integer, double precision)
  TO service_role;
