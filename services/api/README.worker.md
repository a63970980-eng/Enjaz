# ENJAZ Worker — Production Runbook

The API and the queue worker are intentionally separate processes. The worker must run as a long-lived service; deploying the web/API process alone does not consume `job_queue`.

## Start

```bash
npm install --omit=dev
npm run worker
```

Or build `Dockerfile.worker` and run the resulting container.

## Required environment

Set the same production database/auth environment used by the API, including `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` where required by the runtime. Keep provider secrets server-side only.

## Health / operations

The worker writes heartbeat and job-attempt telemetry consumed by the Operations Center. Queue recovery is built into the worker loop so stale leases can be recovered after a worker interruption.

## Deployment requirements

- Minimum: one always-on worker replica.
- Recommended: two replicas for production resilience when the database/queue capacity supports it.
- Do not use a serverless request handler as the worker process.
- Configure graceful shutdown so SIGTERM/SIGINT can finish or release the current lease.
- Set restart policy to always/on-failure.
- Monitor worker heartbeat age and queue depth.
- Alert on sustained `blocked`, `dead`, or `failed` jobs.

## Smoke test

1. Create a task assigned to an employee with an allowed tool.
2. Plan the task and confirm an execution graph/queue job is created.
3. Confirm a worker claims the job.
4. Confirm the task/step reaches `succeeded` (or `awaiting_approval` for an approval-gated action).
5. Confirm the Operations Center reports the attempt and worker heartbeat.
