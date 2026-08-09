# P0 Rollback Runbook — Emergency Recovery Guide

**Environment:** Production  
**Purpose:** Guide incident response team in restoring production to previous baseline commit `0efd00a` in the event of an unforeseen production regression.

---

## 1. Rollback Triggers

Initiate immediate rollback if any of the following occur post-release:
- Elevated HTTP 5xx error rate (> 1%) on public API endpoints (`/api/webhooks/whatsapp`, `/api/public/image-proxy`).
- Authentication failure blocking legitimate tenant owner logins.
- Database deadlock on `ai_agent_tasks` execution locks.

---

## 2. Step-by-Step Rollback Procedure

### Step 1: Revert Application Code on Vercel
1. Open **Vercel Dashboard** → `indexes-store` → **Deployments**.
2. Locate the previous stable production deployment commit.
3. Click **Instant Rollback** to redirect production traffic immediately to the previous build artifact.

### Step 2: Database Schema Backward-Compatibility Verification
All 5 new SQL migrations in this release (`20260730_*.sql`) were authored as **additive and non-destructive**:
- `webhook_events`: New isolated table.
- `media_files.sequence_number`: New optional column with default `0`.
- `runtime_incidents`: New isolated table.
- `acquire_ai_task_execution_lock`: New isolated RPC.

*Result: Reverting application code on Vercel does NOT break existing database queries or table schema.*

### Step 3: Optional DB Rollback SQL Execution (If Hard Revert Required)
If database objects must be explicitly dropped:

```sql
BEGIN;
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.runtime_incidents CASCADE;
DROP FUNCTION IF EXISTS public.acquire_ai_task_execution_lock(TEXT, UUID, TEXT, INT);
NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Step 4: Post-Rollback Verification
1. Verify Vercel production status reads `Ready`.
2. Confirm health check `/api/public/image-proxy` returns HTTP 400 for missing parameter (expected).
3. Notify security response lead and log post-mortem incident entry.
