-- Additive operational schema. Existing reservations are not modified.
ALTER TABLE public."StudioConfig" ADD COLUMN IF NOT EXISTS "bufferMinutes" integer NOT NULL DEFAULT 0;
ALTER TABLE public."StudioConfig" ADD CONSTRAINT "StudioConfig_buffer_bounds" CHECK ("bufferMinutes" BETWEEN 0 AND 180);
CREATE TABLE public."ScheduleBlock" (
 "id" text PRIMARY KEY, "date" text NOT NULL, "startTime" text NOT NULL, "endTime" text NOT NULL,
 "reason" text NOT NULL, "createdById" text NOT NULL, "createdByUsername" text NOT NULL,
 "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ScheduleBlock_date_idx" ON public."ScheduleBlock" ("date");
CREATE TABLE public."BookingPayment" (
 "id" text PRIMARY KEY, "requestKey" text NOT NULL UNIQUE, "bookingId" text NOT NULL REFERENCES public."Booking"("id"),
 "amount" integer NOT NULL CHECK ("amount" <> 0), "method" text NOT NULL CHECK ("method" IN ('TRANSFER','CASH','OTHER')),
 "reference" text, "notes" text, "recordedById" text NOT NULL, "recordedByUsername" text NOT NULL,
 "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "BookingPayment_bookingId_idx" ON public."BookingPayment" ("bookingId");
CREATE TABLE public."AuditEvent" (
 "id" text PRIMARY KEY, "bookingId" text, "actorId" text NOT NULL, "actorUsername" text NOT NULL,
 "action" text NOT NULL, "before" jsonb, "after" jsonb,
 "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditEvent_bookingId_createdAt_idx" ON public."AuditEvent" ("bookingId","createdAt");
CREATE INDEX "AuditEvent_createdAt_idx" ON public."AuditEvent" ("createdAt");
ALTER TABLE public."ScheduleBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BookingPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."ScheduleBlock", public."BookingPayment", public."AuditEvent" FROM anon, authenticated;

CREATE FUNCTION public.snapbook_minutes(value text) RETURNS integer
LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT split_part(value, ':', 1)::integer * 60 + split_part(value, ':', 2)::integer $$;
REVOKE ALL ON FUNCTION public.snapbook_minutes(text) FROM PUBLIC, anon, authenticated;

-- VOLATILE functions take a fresh snapshot after the date lock at READ COMMITTED.
-- An exclusion constraint cannot be installed while old intervals overlap.
CREATE FUNCTION public.snapbook_booking_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE day_key text; buffer integer; opening text; closing text; start_min integer; end_min integer;
BEGIN
 IF TG_OP = 'UPDATE' AND (NEW."date",NEW."startTime",NEW."endTime",NEW."status",NEW."archivedAt") IS NOT DISTINCT FROM (OLD."date",OLD."startTime",OLD."endTime",OLD."status",OLD."archivedAt") THEN RETURN NEW; END IF;
 IF NEW."archivedAt" IS NOT NULL OR NEW."status" NOT IN ('PENDING','CONFIRMED') THEN RETURN NEW; END IF;
 IF current_setting('transaction_isolation') <> 'read committed' THEN RAISE EXCEPTION 'Schedule writes require READ COMMITTED' USING ERRCODE='0A000'; END IF;
 FOR day_key IN SELECT DISTINCT d FROM unnest(CASE WHEN TG_OP='UPDATE' THEN ARRAY[OLD."date",NEW."date"] ELSE ARRAY[NEW."date"] END) AS days(d) ORDER BY d LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended(day_key,0));
 END LOOP;
 IF NEW."date" !~ '^\d{4}-\d{2}-\d{2}$' OR to_char(NEW."date"::date,'YYYY-MM-DD') <> NEW."date" OR NEW."startTime" !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR NEW."endTime" !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Invalid booking interval' USING ERRCODE='23514'; END IF;
 SELECT "bufferMinutes","openingTime","closingTime" INTO buffer,opening,closing FROM public."StudioConfig" WHERE id='default';
 IF NOT FOUND THEN RAISE EXCEPTION 'Studio configuration missing' USING ERRCODE='23514'; END IF;
 start_min:=public.snapbook_minutes(NEW."startTime"); end_min:=public.snapbook_minutes(NEW."endTime");
 IF start_min>=end_min OR NEW."startTime"<opening OR end_min+buffer>public.snapbook_minutes(closing) THEN RAISE EXCEPTION 'Booking outside studio hours' USING ERRCODE='23514'; END IF;
 IF EXISTS (SELECT 1 FROM public."Booking" b WHERE b.id<>NEW.id AND b.date=NEW.date AND b."archivedAt" IS NULL AND b.status IN ('PENDING','CONFIRMED') AND public.snapbook_minutes(b."startTime")<end_min+buffer AND public.snapbook_minutes(b."endTime")+buffer>start_min) THEN RAISE EXCEPTION 'SLOT_COLLISION' USING ERRCODE='23P01'; END IF;
 IF EXISTS (SELECT 1 FROM public."ScheduleBlock" b WHERE b.date=NEW.date AND public.snapbook_minutes(b."startTime")<end_min+buffer AND public.snapbook_minutes(b."endTime")>start_min) THEN RAISE EXCEPTION 'STUDIO_BLOCKED' USING ERRCODE='23P01'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.snapbook_booking_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER snapbook_booking_guard BEFORE INSERT OR UPDATE OF "date","startTime","endTime","status","archivedAt" ON public."Booking" FOR EACH ROW EXECUTE FUNCTION public.snapbook_booking_guard();

CREATE FUNCTION public.snapbook_block_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE day_key text; buffer integer;
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN RAISE EXCEPTION 'Schedule writes require READ COMMITTED' USING ERRCODE='0A000'; END IF;
 FOR day_key IN SELECT DISTINCT d FROM unnest(CASE WHEN TG_OP='UPDATE' THEN ARRAY[OLD."date",NEW."date"] ELSE ARRAY[NEW."date"] END) AS days(d) ORDER BY d LOOP PERFORM pg_advisory_xact_lock(hashtextextended(day_key,0)); END LOOP;
 IF NEW."date" !~ '^\d{4}-\d{2}-\d{2}$' OR to_char(NEW."date"::date,'YYYY-MM-DD') <> NEW."date" OR NEW."startTime" !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR NEW."endTime" !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR NEW."startTime">=NEW."endTime" THEN RAISE EXCEPTION 'Invalid block interval' USING ERRCODE='23514'; END IF;
 SELECT "bufferMinutes" INTO buffer FROM public."StudioConfig" WHERE id='default';
 IF NOT FOUND THEN RAISE EXCEPTION 'Studio configuration missing' USING ERRCODE='23514'; END IF;
 IF EXISTS (SELECT 1 FROM public."Booking" b WHERE b.date=NEW.date AND b."archivedAt" IS NULL AND b.status IN ('PENDING','CONFIRMED') AND b."startTime"<NEW."endTime" AND public.snapbook_minutes(b."endTime")+buffer>public.snapbook_minutes(NEW."startTime")) THEN RAISE EXCEPTION 'BLOCK_COLLISION' USING ERRCODE='23P01'; END IF;
 IF EXISTS (SELECT 1 FROM public."ScheduleBlock" b WHERE b.id<>NEW.id AND b.date=NEW.date AND b."startTime"<NEW."endTime" AND b."endTime">NEW."startTime") THEN RAISE EXCEPTION 'BLOCK_COLLISION' USING ERRCODE='23P01'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.snapbook_block_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER snapbook_block_guard BEFORE INSERT OR UPDATE ON public."ScheduleBlock" FOR EACH ROW EXECUTE FUNCTION public.snapbook_block_guard();

CREATE FUNCTION public.snapbook_payment_guard() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE total integer; paid bigint;
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN RAISE EXCEPTION 'Ledger writes require READ COMMITTED' USING ERRCODE='0A000'; END IF;
 SELECT "totalPrice" INTO total FROM public."Booking" WHERE id=NEW."bookingId" AND "archivedAt" IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='23514'; END IF;
 SELECT coalesce(sum(amount),0) INTO paid FROM public."BookingPayment" WHERE "bookingId"=NEW."bookingId";
 IF paid+NEW.amount<0 OR paid+NEW.amount>total THEN RAISE EXCEPTION 'Payment outside outstanding balance' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.snapbook_payment_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER snapbook_payment_guard BEFORE INSERT ON public."BookingPayment" FOR EACH ROW EXECUTE FUNCTION public.snapbook_payment_guard();

CREATE FUNCTION public.snapbook_append_only() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Operational history is append only' USING ERRCODE='55000'; END $$;
REVOKE ALL ON FUNCTION public.snapbook_append_only() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER snapbook_payments_append_only BEFORE UPDATE OR DELETE ON public."BookingPayment" FOR EACH ROW EXECUTE FUNCTION public.snapbook_append_only();
CREATE TRIGGER snapbook_audit_append_only BEFORE UPDATE OR DELETE ON public."AuditEvent" FOR EACH ROW EXECUTE FUNCTION public.snapbook_append_only();
