# Studio Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Complete the six follow-up improvements approved by the user: database integrity, dependency security, operational calendar/rescheduling, time blocks/buffer, payment history, and fresh admin data.

**Architecture:** Keep Next15/React19/Prisma6 and existing Indonesian dark UI. Add private Postgres operational tables and authenticated APIs. Use a database trigger with per-date advisory locks to reject new overlaps even for SQL writers; preserve historical conflicts for admin review. No new external service.

**Tech Stack:** Existing Next.js, Prisma/PostgreSQL Supabase, Node24, built-in node:test, Playwright.

**Spec:** This document records the accepted six-item follow-up list and concrete implementation decisions. User previously requested autonomous execution, GitHub push and live deployment; cancellation remains manual.

## Global constraints and rulings
- Never reschedule, cancel or delete historical client bookings automatically. Show legacy conflicts to admin.
- Preserve local videos, screenshots, skills and credentials. Never log/extract existing production secrets.
- Ruling: retain current checkout on a new codex branch — existing unrelated assets must remain intact.
- Ruling: use a VOLATILE database trigger rather than exclusion constraint — old overlaps prohibit a universal exclusion constraint without modifying client data. Serialize by date and check current intervals; test concurrency in an isolated schema.
- Ruling: bufferMinutes defaults0, accepts0–180; session plus cleanup must finish within closing time. Zero preserves current behavior.
- Ruling: payments are a manual ledger, not gateway or proof upload. Positive payment/refund input becomes signed amount; no editing/deletion, refund bounded by paid amount, no overpayment. Does not automatically confirm or cancel bookings.
- Ruling: blocked dates use00:00–23:59; existing reservations prevent creating an overlapping block. Blocks may be removed explicitly and are logged.
- Ruling: admin refresh every30s only while visible, plus on focus, avoid overlapping requests and keep selection/forms stable.

## Shared data contract (parent owns Prisma and SQL)
StudioConfig adds `bufferMinutes Int @default(0)`.
ScheduleBlock: id String cuid PK, date/startTime/endTime/reason String, createdById/createdByUsername String, createdAt DateTime now; index date.
BookingPayment: id String cuid PK, bookingId String FK Booking, amount Int signed, method String, reference String?, notes String?, recordedById/recordedByUsername String, createdAt DateTime now; index bookingId, relation Booking.payments.
AuditEvent: id String cuid PK, bookingId String? (plain historical reference), actorId/actorUsername/action String, before Json?, after Json?, createdAt DateTime now; indexes [bookingId,createdAt], createdAt. Append-only through app.
All new tables private: RLS enabled, anon/authenticated privileges revoked.

## Shared API contract (backend agent)
- GET /api/admin/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD inclusive, max31days. Auth required. Returns `{from,to,config:{openingTime,closingTime,slotDuration,bufferMinutes},bookings,blocks}`; bookings contain normal booking fields/package snapshot + `paidAmount` and `hasConflict`; omit archived. include active pending/confirmed and completed for context, conflict only active.
- PATCH /api/bookings/[id]/reschedule `{date,startTime,expectedUpdatedAt}`. Auth, valid future WIB/grid/old duration snapshot, active booking only, full overlap/block/buffer check, atomic audit; stale409, missing404, invalid400, unavailable503.
- GET /api/bookings/[id]/payments returns `{payments,paidAmount,balance}`. POST `{amount,kind:'PAYMENT'|'REFUND',method:'TRANSFER'|'CASH'|'OTHER',reference?,notes?}` positive integer rupiah, transaction row lock, ledger+audit atomic. Returns summary, never mutates status.
- GET /api/bookings/[id]/history returns `{events}` newest50, auth.
- POST /api/admin/blocks `{date,startTime,endTime,reason}`; DELETE /api/admin/blocks/[id]. Auth, validate/lock/check bookings, audit. GET calendar supplies block list.
- Extend settings PUT/GET bufferMinutes (optional PUT defaults existing value, invalid400); cache invalidation.
- Extend public POST/availability and status restore to honor blocks/buffer; log create/status/archive/reschedule in same transaction. Avoid exposing audit/payment data publicly.

## File ownership
- Dependency worker: package.json, package-lock.json only (security patches/overrides, no forced major Next/Prisma migration).
- Backend worker: src/app/api/** except auth/gallery/packages; src/lib/scheduling.ts; new src/lib/studio-operations.ts; backend tests. No Prisma/package/UI/remote changes.
- UI worker: new /admin/calendar page/components; AdminSidebar; admin/bookings auto-refresh/link; admin/settings buffer input; types if needed; UI tests. No API/schema/package changes.
- Parent: schema, SQL/migrations/triggers, DB verification, docs, integration/review/browser QA, commit/push/deploy.

## Tasks
- [x] 1. Baseline metadata/dependency audit and write failing regression cases; dependency patches and install/generate verification.
- [x] 2. Add additive schema and private SQL tables. Test DB guard in isolated fixture schema before applying production migration; old conflict count unchanged.
- [x] 3. Backend APIs and scheduling/persistence changes, fail-first meaningful tests for stale requests, overlaps, blocks/buffer, unauthorized, refunds and atomic history.
- [x] 4. Calendar/day-week UI, booking details reschedule/payments/history, block controls, buffer settings, visible-tab30s refresh.
- [x] 5. Whole change review: lock ordering, privacy, legacy conflicts, idempotency/stale updates, disabled forms, mobile overflow and keyboard labels.
- [x] 6. Full tests/typecheck/Prisma generation/build, isolated DB concurrency proof, mocked browser admin flows and public read-only smoke.
- [x] 7. Apply compatible production schema/guard, run advisors and verify; commit/push main without force; wait automatic Vercel deployment and verify domain.

## Review focus
- Reschedule two admins / direct SQL concurrent writes must not double-book.
- Legacy overlaps are visible and unchanged; historical non-schedule metadata writes still work.
- Blocking or buffer changes must not silently create customer bookings outside operational constraints.
- Payment/refund race cannot exceed total or refund more than paid; histories do not leak to public tracking.
- Auto refresh must preserve pagination, typed input and selected booking, and stop when hidden.

## Ledger
- Baseline: GitHub main210439b; 42 tests previously passed. Unrelated videos and preview screenshots remain local.

- Parent integrated after worker usage limits. 54 tests/typecheck/build/DB fixtures/browser desktop-mobile passed. Production additive migration applied. Push/deploy pending. Payment requestKey unique UUID added for idempotency.

- Application6bd8c44 pushed main; Vercel dpl_6hLKUawQ26ekeMmwZ4MgkJPFcoxH Ready and primary domain verified. Public200/private401/calendar login redirect confirmed; see operations-production.json. All seven tasks complete.
