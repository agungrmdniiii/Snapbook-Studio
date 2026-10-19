-- Server-only Prisma application: public HTTP roles must not bypass Next.js authorization.
ALTER TABLE public."AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BookingAddOn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudioConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AddOn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShowcaseImage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AdminUser", public."Booking", public."BookingAddOn", public."StudioConfig", public."Package", public."AddOn", public."ShowcaseImage" FROM anon, authenticated;
