-- Applied using Supabase migrations restrict_direct_public_access and
-- harden_sessions_and_booking_snapshots on 2026-10-19.
-- Review before applying to another database; statements are transactional.
BEGIN;
ALTER TABLE public."AdminUser" ADD COLUMN IF NOT EXISTS "sessionVersion" integer NOT NULL DEFAULT 0;
ALTER TABLE public."Booking" ADD COLUMN IF NOT EXISTS "packageNameAtBooking" text,
 ADD COLUMN IF NOT EXISTS "packagePriceAtBooking" integer,
 ADD COLUMN IF NOT EXISTS "packageDurationAtBooking" integer,
 ADD COLUMN IF NOT EXISTS "archivedAt" timestamp(3);
CREATE TABLE IF NOT EXISTS public."RequestLimit" ("key" text PRIMARY KEY, "count" integer NOT NULL, "resetAt" timestamp(3) NOT NULL);
CREATE INDEX IF NOT EXISTS "RequestLimit_resetAt_idx" ON public."RequestLimit" ("resetAt");
CREATE INDEX IF NOT EXISTS "Booking_packageId_idx" ON public."Booking" ("packageId");
CREATE INDEX IF NOT EXISTS "BookingAddOn_bookingId_idx" ON public."BookingAddOn" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingAddOn_addOnId_idx" ON public."BookingAddOn" ("addOnId");
ALTER TABLE public."AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BookingAddOn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudioConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AddOn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShowcaseImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RequestLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AdminUser",public."Booking",public."BookingAddOn",public."StudioConfig",public."Package",public."AddOn",public."ShowcaseImage",public."RequestLimit" FROM anon, authenticated;
COMMIT;
