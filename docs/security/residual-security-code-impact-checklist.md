# Residual security hardening code-impact checklist

This checklist records the server boundaries that must be verified before applying the residual migration to production.

- [ ] Tenant membership create/update/delete uses a server-only Supabase secret/service-role client.
- [ ] `update_order_branch` is invoked from a server function, not directly from a browser Supabase client.
- [ ] `increment_review_helpful` is invoked from a rate-limited server function, not directly from a browser Supabase client.
- [ ] Audit log inserts use a server-only client.
- [ ] WhatsApp media writes use a server-only client and keep the `whatsapp/...` object prefix.
- [ ] Browser media uploads use `uploads/{tenant_id}/...` and send the authenticated user's JWT.
- [ ] CMS version inserts set `edited_by = auth.uid()` and preserve the page's `tenant_id`.
- [ ] Checkout, order admin, CMS, media upload/upsert/delete, and AI journal smoke tests pass after both P0 migrations.

Repository code search was requested for these call sites. If GitHub code search is not indexed for this repository, reviewers must verify the items above from a checked-out repository before production deployment.
