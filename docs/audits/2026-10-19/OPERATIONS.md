# Studio operations — 19 October 2026

## Delivered
- Private day/week calendar and authenticated rescheduling with optimistic version check and booked-duration snapshot.
- Time blocks/holidays and 0–180 minute buffer shared across booking, availability, status restoration and rescheduling.
- Append-only manual payment/refund ledger: row locks, idempotent request UUID, no overpayment/refund below zero; atomic audit events.
- Visible-tab 30s/focus refresh preserving input and selection. Dependency patches: zero npm audit advisories.

## Database
Applied additive migration studio_operations_guards_and_ledger to whiyncjfocmnatbpknam. Four bookings, seven gallery images and one historical overlapping active pair preserved. Buffer initially zero; no customer schedules/payment balances invented or changed. Historical pair requires owner/customer agreement. Trigger checks and sorted date advisory locks at READ COMMITTED prevent new overlaps and invalid intervals. Other isolation levels rejected for capacity/ledger writes. Payments and audit reject UPDATE/DELETE.

Eleven tables have RLS and no anon/authenticated privileges. Supabase advisor security only INFO RLS-without-policy: intentional server-only Prisma access. Performance INFO unused indexes retained until meaningful traffic warrants removal. References: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index.

## Evidence
54 tests, TypeScript and production build passed. Isolated random database schema proved raw SQL interval/block/buffer rejection, booking/payment concurrency, refund bounds and append-only history, then removed fixtures. Hardening check confirmed eleven protected tables and limiter rollback.

Browser fixture at 1440px and 390px: rejected/successful reschedule, payment, block create/remove, focus refresh preserving typed amount, no page errors or page overflow. Results/screenshots in operations-browser/. All API requests mocked; no customer writes. React review covered parallel reads, auth boundaries, stale request aborts, bounded calendar, polling cleanup and stable forms.

## Limits
No mutation through owner's production admin login: browser uses dummy responses, backend tested through routes and isolated SQL. No gateway, auto-message or auto-cancellation. Ledger starts at activation. Calendar maximum1000 agendas/31days; asks to narrow excessive ranges. Per-booking payment list is unpaginated; paginate if unusually many transactions accumulate. No high-volume load test or pooler credential change. Retained Vercel Node24/bom1 near Mumbai database.

## Release
Pending Git push and automatic deployment verification.
