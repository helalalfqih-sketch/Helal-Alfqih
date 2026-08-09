# Residual Security Hardening Runbook

Target project: `wtudcippyxbaobqzbmok`

## Required order

1. Confirm a restorable backup or Point-in-Time Recovery checkpoint.
2. Apply `20260731000000_p0_production_hardening.sql`.
3. Run its smoke tests for checkout, order administration, media, CMS, AI
   execution, and provider configuration.
4. Apply `20260731000001_residual_security_hardening.sql`.
5. Run
   `supabase/verification/20260731000001_residual_security_hardening_verify.sql`.
6. Re-run Supabase Security Advisor.

Do not use a repository-wide `supabase db push` while production migration
history is behind the repository. Apply the two reviewed files explicitly and
record their commit SHAs and execution timestamps.

## Auth leaked-password protection

The leaked-password setting belongs to Supabase Auth configuration, not the
Postgres schema, so it is deliberately not represented as SQL.

After the database migrations succeed:

1. Open the production project in Supabase Dashboard.
2. Go to **Authentication > Settings**.
3. Enable **Leaked password protection**.
4. Save the Auth configuration.
5. Re-run Security Advisor and confirm that
   `auth_leaked_password_protection` is gone.

Reference:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Expected behavior changes

- Direct authenticated writes to `tenant_members` are removed. Membership
  mutations must use a reviewed server function with the server-only Supabase
  secret/service role.
- `update_order_branch` and `increment_review_helpful` are service-role RPCs.
  Browser callers must use server functions.
- Public product image URLs remain available because `product-images` stays a
  public bucket. Public SQL listing and all public writes are removed.
- Authenticated media management is limited to
  `uploads/{tenant_id}/...`. The `whatsapp/...` prefix remains server-only.
- CMS staff can read, insert, and update their tenant pages. Page deletion and
  version deletion require the tenant owner.
- Audit log writes are server-only; tenant staff may read their own tenant logs.

## Rollback

The migrations are transactional and automatically roll back if they fail
before `COMMIT`. After a successful commit, restore from the recorded backup or
apply a separately reviewed rollback migration. Do not restore the old
always-true policies as an emergency workaround.
