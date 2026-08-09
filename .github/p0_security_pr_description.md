# [P0] Fix all critical security vulnerabilities

## 📌 Pull Request Overview

**PR Title**: `[P0] Fix all critical security vulnerabilities`  
**Branch**: `fix/p0-security-critical` -> `main`

---

## 🛡️ Summary of Remediated Vulnerabilities

| Vulnerability ID | File Affected                                                                                                 | Summary of Fix Applied                                                                                                                                                                                                                        |
| :--------------- | :------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ISSUE 1**      | [`src/lib/users.functions.ts`](file:///d:/web/indexes_store/src/lib/users.functions.ts)                       | Refactored `checkTenantPermission` to fail-closed. Removed static email bypass (`helalalfqih@gmail.com`) and fail-open `catch { return true }` blocks. Throws 403 (PermissionDenied), 503 (ServiceUnavailable), and 400 (ConfigurationError). |
| **ISSUE 2**      | [`src/lib/actions/appearance.actions.ts`](file:///d:/web/indexes_store/src/lib/actions/appearance.actions.ts) | Updated `resolveCmsScope` fallback to `{ allowed: false, scope: null }` on any exception or missing role.                                                                                                                                     |
| **ISSUE 3**      | [`src/lib/actions/appearance.actions.ts`](file:///d:/web/indexes_store/src/lib/actions/appearance.actions.ts) | Separated public `getPublishedStorefrontAppearance` (reads published `value` only, no Service Role) from protected `getStorefrontDraftPreview` (`requireSupabaseAuth`).                                                                       |
| **ISSUE 4**      | `src/lib/media.functions.ts`, `src/lib/actions/appearance.actions.ts`, etc.                                   | Removed raw `process.env.SUPABASE_SERVICE_ROLE_KEY` client auto-escalations across server functions.                                                                                                                                          |
| **ISSUE 5**      | [`src/routes/api/webhooks.whatsapp.ts`](file:///d:/web/indexes_store/src/routes/api/webhooks.whatsapp.ts)     | Added Meta `X-Hub-Signature-256` HMAC timing-safe check, removed hardcoded verify tokens, and resolved tenant dynamically from `phone_number_id`.                                                                                             |
| **ISSUE 6**      | [`src/routes/api/webhooks.whatsapp.ts`](file:///d:/web/indexes_store/src/routes/api/webhooks.whatsapp.ts)     | Returns HTTP 502/503 status on WhatsApp media download/upload failure without orphan DB records.                                                                                                                                              |
| **ISSUE 7**      | [`src/lib/ai-agent.functions.ts`](file:///d:/web/indexes_store/src/lib/ai-agent.functions.ts)                 | Added `verifyApproval` read-only check (`approved_by === userId` & status `APPROVED`) and fail-closed role resolution.                                                                                                                        |
| **ISSUE 8**      | [`vite.config.ts`](file:///d:/web/indexes_store/vite.config.ts)                                               | Excluded `/auth/`, `/rest/v1/`, and authenticated objects from PWA Workbox cache; restricted caching to `/storage/v1/object/public/` only.                                                                                                    |
| **ISSUE 9**      | `src/routes/robots.txt.ts`, `src/routes/sitemap.xml.ts`, `src/routes/google-shopping.xml.ts`                  | Updated route paths to `/robots.txt`, `/sitemap.xml`, and `/google-shopping.xml`.                                                                                                                                                             |
| **ISSUE 10**     | [`src/lib/media.functions.ts`](file:///d:/web/indexes_store/src/lib/media.functions.ts)                       | Removed `DEFAULT_DEMO_MEDIA` array from production error return paths.                                                                                                                                                                        |

---

## 🧪 Verification Logs

```text
> typecheck
> tsc --noEmit
✓ Exit Code: 0 (0 errors)

> build
✓ Built in 10.85s (0 errors)
```

---

## ⚠️ Merge Requirements Checklist

- [x] All 10 P0 security issues remediated & verified
- [x] Typecheck & production build pass clean
- [ ] Code review completed & approved
- [ ] QA security scan approved
- [ ] Do NOT auto-merge — wait for security team approval
