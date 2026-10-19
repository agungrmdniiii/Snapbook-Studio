# Database mutation fixes — 19 October 2026

## Reproduced root cause
Production runtime logs showed Prisma validation failures mentioning sortOrder on package edits. The actual modal sends no sortOrder, while the API evaluated Number(undefined), yielding NaN for a required integer update. A regression using the modal payload failed500 before the fix and now passes200 with original order/image preserved.

## Changes
- Shared catalog validation for create/edit, bounded JSON body, text/boolean/integer/feature/image validation. Omitted edit fields stay omitted. Invalid values are rejected400 before any write.
- Partial addon edits preserve omitted price/status. Zero-priced addon edits display0. Client duration0 is not silently replaced with60.
- Settings reject invalid field types rather than passing them into Prisma. Form fields stay disabled until initial data has loaded and while saving, avoiding user edits being overwritten by late initial responses.
- Missing catalog/gallery rows404, relational conflict409, database connectivity/pool errors503; sanitized error logging. Invalid/null status body400.
- UI deletion messaging uses server results: referenced package/addon is archived, not falsely reported physically deleted. Existing customer/payment history remains.

## Verification
60 node:test cases, TypeScript, and production build pass. New real end-to-end script verify-database-flows.mts creates a private random schema, clones the eleven app tables and relational constraints, installs the real scheduling/payment guards, generates a fixture admin secret/password, and launches a real production Next server against that schema. Uses a separate temporary build/cache copy, blocks remote browser requests, then removes only its generated schema/build. No public customer table writes.

Thirteen tested groups are recorded in results.json: real browser login; package edit plus untouched order/image; free addon edit; create/delete unreferenced catalog; invalid/missing edits; settings form persistence/audit; booking/snapshots/buffer collision; reschedule/stale request; payments/refunds/idempotency; blocks/availability; status/archive and ledger preservation; referenced catalog archival; gallery create/delete/missing404. Form interactions use the actual rendered UI; other cases use actual HTTP APIs and independent Prisma persistence assertions, not mocked database responses.

After cleanup: public Bookings4, ShowcaseImages7, remaining qa_crud schemas0. Earlier mocked UI checks were insufficient to detect the Prisma sortOrder failure; this new test verifies the complete persistence boundary.

Run npm run build first, then node --import tsx scripts/verify-database-flows.mts. Requires schema creation permission; normal completion/failure cleans its fixtures. Do not run concurrent builds. No production schema migration, credential reset, automatic customer rescheduling or cancellation was performed. File upload to Blob and heavy load were not repeated in this fix; image metadata/database lifecycle is covered.

Release: GitHub main automatic Vercel deployment; final deployment status reported in chat.
