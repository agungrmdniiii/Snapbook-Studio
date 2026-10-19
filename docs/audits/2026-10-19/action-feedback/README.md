# Action feedback UX

User clarified feedback means action results, not a suggestion/feedback collection form. No schema/API/database mutation or new service introduced.

Shared ToastProvider in admin layout: success status/check icon, error alert/error icon, up to three notices, deduplicated messages. Success auto-dismisses after five seconds; hover/focus pauses dismissal; errors remain until closed. Responsive portal stays above modal overlays, with keyboard-accessible close buttons and live regions.

Integrated create/edit/delete package/add-on, gallery upload/delete, booking status/archive, settings, reschedule/DP and time-block create/remove. Form validation errors stay inline with alert semantics. Save/upload/archive buttons expose busy state and descriptive progress labels. Password update redirect explains why login is needed again. Removed duplicate per-page success-colored error toasts.

Fixed related correctness issue: BookingTable previously updated its detail status or closed the archive dialog even after the parent caught a server rejection. Callbacks now return success booleans, and detail state changes only after confirmed success. Regression reproduced with a failing browser assertion before fixing it.

Verification: 54 node:test cases passed; TypeScript and production build passed. verify-action-feedback.mjs tests real components with mocked APIs at1440/390: pending save, failed save retaining text, save success, failed/successful delete, settings success, gallery failure, success expiry/error persistence/manual dismissal, failed status retains old value, failed archive retains detail. Existing calendar browser flow still passes reschedule/DP/block/focus refresh. No production customer records were changed. Mechanical Impeccable scan found zero deterministic issues; mobile screenshot checked for legibility and overflow. Screenshots are dummy data.

Run npm run build first, then node scripts/verify-action-feedback.mjs and node scripts/verify-operations-ui.mjs. Do not run build concurrently with browser fixture scripts because build replaces .next/static/css.

Release: push GitHub main triggers automatic Vercel production deployment. Domain/status verification is reported in the final chat reply.
