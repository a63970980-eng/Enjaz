# ENJAZ Integration Test Contract

The API CI suite must cover these production paths against a disposable PostgreSQL/Supabase-compatible database:

1. workspace isolation: user A cannot read or mutate workspace B;
2. employee/task repository CRUD;
3. webhook HMAC validation and timestamp replay protection;
4. webhook delivery idempotency: the same trigger/event is enqueued once;
5. scheduler claim/enqueue: a due schedule creates one `workflow.run` job;
6. queue concurrency: `FOR UPDATE SKIP LOCKED` prevents duplicate claims;
7. worker execution: started -> succeeded/failed attempt records;
8. retry backoff and terminal `dead` state;
9. stale running jobs are recovered;
10. approval authorization and audit trail;
11. health endpoint reports database/queue/worker state;
12. secrets are never emitted into logs or audit payloads.

Tests requiring live credentials must use CI secrets and a dedicated test project. Never commit Supabase service-role keys or integration secrets.
