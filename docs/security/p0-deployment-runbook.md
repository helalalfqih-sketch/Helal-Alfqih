# P0 Deployment Runbook — Manual Production Migration Guide

**Environment:** Production (`indexes-store.vercel.app` & Supabase Production Project)  
**Access Required:** Production GitHub Environment Approver, Supabase CLI Project Access  

---

## 1. Safety Conditions & Prerequisites

> [!IMPORTANT]
> Automatic DB migration execution on push to `main` is permanently disabled in `.github/workflows/deploy.yml`. Production database migrations MUST be manually triggered via `workflow_dispatch` with explicit human approval.

Before executing production migrations, ensure:
1. All CI checks pass on the Pull Request (`verify-security` job).
2. Designated security administrator has reviewed the 5 SQL migration files in `supabase/migrations/`.
3. A full Supabase production database backup snapshot has been taken.

---

## 2. Step-by-Step Manual Deployment Steps

### Step 1: Merge PR to `main`
- Merge Pull Request `fix/p0-security-critical-finalization` → `main` (No auto-merge enabled).

### Step 2: Trigger GitHub Workflow Dispatch
1. Navigate to **GitHub Repository** → **Actions** → **Production Migration Workflow**.
2. Click **Run workflow**.
3. In the input box `confirm_deployment`, type exact string:
   ```text
   CONFIRM_PRODUCTION_MIGRATION
   ```
4. Select environment: `production`.
5. Click **Run workflow**.

### Step 3: Human Approval Gate
1. The GitHub Action will pause at step `migrate-production` requesting approval.
2. The designated reviewer opens GitHub Actions approval banner and clicks **Approve and deploy**.

### Step 4: Verification of Applied Migrations
Verify in Supabase SQL Editor that the following 5 tables/functions exist:
- `public.webhook_events`
- `public.acquire_ai_task_execution_lock(TEXT, UUID, TEXT, INT)`
- `public.product_video_requests`
- `public.media_files.sequence_number`
- `public.runtime_incidents`

---

## 3. Post-Deployment Verification Checklist

- [ ] Verify `https://indexes-store.com/robots.txt` returns 200 without private path leaks.
- [ ] Verify `https://indexes-store.com/sitemap.xml` returns valid XML.
- [ ] Log in as a tenant owner and verify `/admin/ai-developer` shows `NOT_MEASURED` status initially.
- [ ] Test uploading a product image in media library — verify it persists to `product-images` bucket without Base64 fallbacks.
