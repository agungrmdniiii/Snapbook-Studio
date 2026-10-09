# Snapbook Studio Full-Stack Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Snapbook Studio from scratch into a modular, high-performance Next.js 15 App Router full-stack application with SQLite + Prisma ORM, collision-free booking wizard, WhatsApp automation, self-service tracking, and a comprehensive admin portal.

**Architecture:** Next.js App Router (Server & Client Components) with SQLite for zero-config local persistence, Prisma ORM for type safety, signed HTTP-only cookies for admin session security, and Tailwind CSS for modern editorial photo studio UI.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide React, Prisma ORM, bcryptjs.

**Spec:** [docs/superpowers/specs/2026-10-09-snapbook-studio-revamp-design.md](file:///e:/Snapbook-Studio-main/docs/superpowers/specs/2026-10-09-snapbook-studio-revamp-design.md)

## Global Constraints
- Framework: Next.js 15 App Router with TypeScript.
- Database: SQLite file at `prisma/dev.db` via Prisma ORM.
- Styling: Tailwind CSS with clean editorial aesthetic.
- Currency: Indonesian Rupiah (IDR) formatted as `Rp XXX.XXX`.
- Admin Auth: HTTP-only secure signed session cookie (`snapbook_admin_session`).
- Anti-Double Booking: Atomic database query validating slot availability before insertion.
- WhatsApp Integration: Standard `https://wa.me/{phone}?text={encoded}` links for booking confirmation & reminder.

## Review Focus
1. Concurrency collision: Two clients booking the same time slot at the same second must not result in double booking; second request must receive a 409 conflict error.
2. Past date booking: Booking wizard must reject dates in the past or times outside studio operational hours.
3. Phone number formatting: WhatsApp numbers must be sanitized (strip spaces, hyphens, leading 0 to international format `628...`).
4. Session guard bypass: Direct navigation to `/admin`, `/admin/bookings`, or API mutations without valid cookie must redirect to `/admin/login` or return 401.
5. Tracking privacy: Public tracking endpoint must never expose admin credentials or other clients' sensitive booking records.

---

### Task 1: Clean Foundation, Dependencies & Prisma Setup

**Files:**
- Create: `next.config.ts`, `postcss.config.mjs`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`
- Test: `scripts/test-prisma.ts`

**Interfaces:**
- Produces: `prisma` client singleton from `src/lib/prisma.ts`, database models (`StudioConfig`, `AdminUser`, `Package`, `AddOn`, `Booking`, `BookingAddOn`, `ShowcaseImage`).

- [ ] **Step 1: Update `package.json` with Next.js, Prisma, and core dependencies**
  Configure dependencies: `next`, `react`, `react-dom`, `lucide-react`, `@prisma/client`, `bcryptjs`, `clsx`, `tailwind-merge`. Dev dependencies: `prisma`, `typescript`, `@types/node`, `@types/react`, `@types/bcryptjs`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tsx`. Configure scripts: `"dev": "next dev --port 3000"`, `"build": "next build"`, `"start": "next start"`, `"seed": "tsx prisma/seed.ts"`.

- [ ] **Step 2: Create `next.config.ts`, `postcss.config.mjs`, and update `tsconfig.json`**
  Setup standard Next.js config with path alias `@/*` pointing to `./src/*`.

- [ ] **Step 3: Define `prisma/schema.prisma`**
  Implement exact SQLite models: `StudioConfig`, `AdminUser`, `Package`, `AddOn`, `Booking`, `BookingAddOn`, `ShowcaseImage`.

- [ ] **Step 4: Create `src/lib/prisma.ts`**
  Implement standard global singleton pattern for PrismaClient.

- [ ] **Step 5: Create `prisma/seed.ts`**
  Seed initial default data:
  - StudioConfig (Snapbook Studio, 6281234567890, 09:00 - 20:00, slot 60 mins).
  - AdminUser (username: `admin`, passwordHash of `adminpassword123`).
  - Packages: 3 default packages (Graduation Special, Self Portrait Express, Family & Group).
  - AddOns: 3 default add-ons (Ekstra Cetak 10R, Ekstra Softcopy Edit, Wardrobe Tambahan).
  - ShowcaseImages: 4 sample showcase portfolio images with varied categories.

- [ ] **Step 6: Run `npx prisma db push` and `npx tsx prisma/seed.ts`**
  Verify database creates `prisma/dev.db` and populates seed data.

- [ ] **Step 7: Commit foundation**
  ```bash
  git add package.json tsconfig.json next.config.ts postcss.config.mjs prisma/ src/lib/prisma.ts
  git commit -m "feat: setup next.js foundation and prisma sqlite schema with seed"
  ```

---

### Task 2: Core Domain Logic & Unit Verification (TDD)

**Files:**
- Create: `src/lib/utils.ts`, `src/lib/whatsapp.ts`, `src/lib/auth.ts`, `scripts/verify-core.ts`

**Interfaces:**
- Consumes: Prisma models
- Produces:
  - `formatIDR(amount: number): string`
  - `generateTimeSlots(openingTime: string, closingTime: string, durationMinutes: number): string[]`
  - `sanitizeWhatsAppNumber(phone: string): string`
  - `generateBookingWhatsAppUrl(studioPhone: string, booking: BookingData): string`
  - `generateReminderWhatsAppUrl(clientPhone: string, booking: BookingData, studioName: string): string`
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - `createSessionToken(payload: { id: string; username: string }): string`
  - `verifySessionToken(token: string): { id: string; username: string } | null`

- [ ] **Step 1: Write failing core verification test in `scripts/verify-core.ts`**
  Assert IDR formatting (`formatIDR(450000) === "Rp 450.000"`), slot generation (`generateTimeSlots("09:00", "12:00", 60)` produces `["09:00", "10:00", "11:00"]`), phone sanitizing (`"0812345678"` -> `"62812345678"`), WhatsApp link generation contains booking code, and password hashing + verification.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx tsx scripts/verify-core.ts`
  Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `src/lib/utils.ts`**
  Implement `cn`, `formatIDR`, `generateTimeSlots`, and date formatting utilities.

- [ ] **Step 4: Implement `src/lib/whatsapp.ts`**
  Implement phone sanitization, booking confirmation message template builder, and reminder message template builder.

- [ ] **Step 5: Implement `src/lib/auth.ts`**
  Implement secure password hashing (`bcryptjs`) and session cookie signing/decoding using HMAC-SHA256 (`crypto` node stdlib).

- [ ] **Step 6: Run test to verify it passes**
  Run: `npx tsx scripts/verify-core.ts`
  Expected: PASS all assertions.

- [ ] **Step 7: Commit core domain utilities**
  ```bash
  git add src/lib/ scripts/verify-core.ts
  git commit -m "feat: implement core domain utilities and verification script"
  ```

---

### Task 3: Backend API Route Handlers & Anti-Collision Booking Engine

**Files:**
- Create:
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/logout/route.ts`
  - `src/app/api/auth/me/route.ts`
  - `src/app/api/settings/route.ts`
  - `src/app/api/packages/route.ts`
  - `src/app/api/packages/[id]/route.ts`
  - `src/app/api/gallery/route.ts`
  - `src/app/api/gallery/[id]/route.ts`
  - `src/app/api/bookings/route.ts`
  - `src/app/api/bookings/available-slots/route.ts`
  - `src/app/api/bookings/track/route.ts`
  - `src/app/api/bookings/[id]/status/route.ts`
- Test: `scripts/verify-api.ts`

**Interfaces:**
- Consumes: `prisma`, `src/lib/auth.ts`, `src/lib/utils.ts`
- Produces: REST API endpoints for all frontend modules and admin operations.

- [ ] **Step 1: Write automated API verification test in `scripts/verify-api.ts`**
  Test available slots calculation for a date, create booking via API, assert second attempt to book the exact same slot is blocked with 409 Conflict, test booking tracking endpoint by bookingCode, and test admin auth session verification.

- [ ] **Step 2: Implement Auth routes (`/api/auth/login`, `/logout`, `/me`)**
  Handle credentials verification, set `snapbook_admin_session` HTTP-only cookie, and clear cookie on logout.

- [ ] **Step 3: Implement Settings & Packages & Gallery routes**
  - `GET /api/settings`: Returns studio config.
  - `PUT /api/settings`: Updates studio config (requires admin cookie).
  - `GET /api/packages`: Returns active packages and add-ons.
  - `POST /api/packages`: Creates package (admin).
  - `PUT/DELETE /api/packages/[id]`: Updates/deletes package (admin).
  - `GET/POST/DELETE /api/gallery`: Manages showcase portfolio images.

- [ ] **Step 4: Implement Booking Engine with Atomic Collision Check**
  - `GET /api/bookings/available-slots?date=YYYY-MM-DD`:
    Queries all bookings on that date with status in `['PENDING', 'CONFIRMED']`. Returns list of time slots with `available: boolean` flags.
  - `POST /api/bookings`:
    Validates input with atomic transaction (`prisma.$transaction`). Check if date + startTime already has active booking. If yes, throw 409 Conflict. If free, creates Booking with unique code `SB-YYYYMMDD-XXXX` and returns booking data.
  - `GET /api/bookings`:
    Admin list with query filters (`status`, `search`).
  - `PATCH /api/bookings/[id]/status`:
    Admin status update (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
  - `GET /api/bookings/track?code=SB-...`:
    Public endpoint returning sanitized booking detail (date, time, package name, status, studio address) without exposing customer credentials.

- [ ] **Step 5: Run API verification script**
  Run: `npx tsx scripts/verify-api.ts`
  Expected: PASS

- [ ] **Step 6: Commit backend API endpoints**
  ```bash
  git add src/app/api/ scripts/verify-api.ts
  git commit -m "feat: implement backend api route handlers and collision-free booking engine"
  ```

---

### Task 4: UI Components & Landing Page Experience

**Files:**
- Create:
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Input.tsx`
  - `src/components/ui/Badge.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Modal.tsx`
  - `src/components/landing/Navbar.tsx`
  - `src/components/landing/HeroSection.tsx`
  - `src/components/landing/ShowcaseGallery.tsx`
  - `src/components/landing/PackagesSection.tsx`
  - `src/components/landing/FaqSection.tsx`
  - `src/components/landing/Footer.tsx`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/globals.css`
- Modify: None

**Interfaces:**
- Consumes: `/api/packages`, `/api/gallery`, `/api/settings`
- Produces: Complete responsive public landing page with editorial studio theme.

- [ ] **Step 1: Implement base UI components in `src/components/ui/`**
  Build clean, reusable `Button`, `Input`, `Badge`, `Card`, and `Modal` components with Tailwind CSS.

- [ ] **Step 2: Setup `src/app/globals.css` and `src/app/layout.tsx`**
  Import Tailwind CSS, setup meta tags, title "Snapbook Studio - Modern Photo Studio Booking", and root HTML shell.

- [ ] **Step 3: Implement Landing Page Sections**
  - `Navbar`: Studio logo, navigation links (Portofolio, Paket, FAQ, Cek Booking), operating status indicator, "Booking Sekarang" button.
  - `HeroSection`: Aesthetic editorial headline, quick tagline, studio badges, CTA buttons ("Pesan Sesi Foto" & "Lihat Portofolio").
  - `ShowcaseGallery`: Dynamic category filter tabs (Semua, Portrait, Graduation, Family, Couple), responsive masonry/grid gallery.
  - `PackagesSection`: Side-by-side package cards, duration, price in IDR, included feature items, and "Pilih Paket" CTA linking to booking.
  - `FaqSection`: Clear collapsible Q&A covering rules, late arrivals, wardrobe, softcopy delivery.
  - `Footer`: Studio address, WhatsApp and Instagram links, copyright, and subtle link to `/admin/login`.

- [ ] **Step 4: Implement `src/app/page.tsx`**
  Assemble all sections with SSR data loading for instant page loads.

- [ ] **Step 5: Verify build & render**
  Run: `npm run build`
  Expected: Successfully compiles without errors.

- [ ] **Step 6: Commit landing page**
  ```bash
  git add src/components/ src/app/globals.css src/app/layout.tsx src/app/page.tsx
  git commit -m "feat: implement modern landing page and ui component system"
  ```

---

### Task 5: Interactive Booking Wizard (`/book`) & Tracking Page (`/cek-booking`)

**Files:**
- Create:
  - `src/components/booking/BookingWizard.tsx`
  - `src/components/booking/StepPackage.tsx`
  - `src/components/booking/StepDateTime.tsx`
  - `src/components/booking/StepAddOns.tsx`
  - `src/components/booking/StepClientInfo.tsx`
  - `src/components/booking/StepConfirmation.tsx`
  - `src/app/book/page.tsx`
  - `src/app/cek-booking/page.tsx`

**Interfaces:**
- Consumes: `/api/packages`, `/api/bookings/available-slots`, `/api/bookings`, `/api/bookings/track`, `src/lib/whatsapp.ts`
- Produces: Full self-contained customer booking flow and order tracking interface.

- [ ] **Step 1: Implement Step Components**
  - `StepPackage`: Card selector for package choice.
  - `StepDateTime`: Calendar date picker + time slot grid. Real-time fetch of `/api/bookings/available-slots`. Visual status (Tersedia / Penuh).
  - `StepAddOns`: Checklist of add-ons with dynamic subtotal updates.
  - `StepClientInfo`: Name, WhatsApp number, email, and notes inputs with client validation.
  - `StepConfirmation`: Booking code banner, summary breakdown, and primary button "Kirim Konfirmasi via WhatsApp" linking to formatted WhatsApp message.

- [ ] **Step 2: Implement `src/components/booking/BookingWizard.tsx` and `src/app/book/page.tsx`**
  Coordinate step transitions (1 -> 2 -> 3 -> 4 -> 5), error alerts for slot collision, and state persistence during the booking flow.

- [ ] **Step 3: Implement `src/app/cek-booking/page.tsx`**
  Build customer tracking screen:
  - Search input for Booking Code or WhatsApp Phone Number.
  - Status display card with status badge (Pending / Terkonfirmasi / Selesai).
  - Booking breakdown details, studio address, and arrival instructions.

- [ ] **Step 4: Test booking submission & tracking flow**
  Verify complete booking submission, WhatsApp link opening, and `/cek-booking` lookup in development environment.

- [ ] **Step 5: Commit booking wizard & tracking**
  ```bash
  git add src/components/booking/ src/app/book/ src/app/cek-booking/
  git commit -m "feat: implement interactive booking wizard and tracking page"
  ```

---

### Task 6: Comprehensive Admin Portal (`/admin/*`)

**Files:**
- Create:
  - `src/app/admin/login/page.tsx`
  - `src/app/admin/layout.tsx`
  - `src/app/admin/page.tsx`
  - `src/app/admin/bookings/page.tsx`
  - `src/app/admin/packages/page.tsx`
  - `src/app/admin/gallery/page.tsx`
  - `src/app/admin/settings/page.tsx`
  - `src/components/admin/AdminSidebar.tsx`
  - `src/components/admin/StatsCard.tsx`
  - `src/components/admin/BookingTable.tsx`
  - `src/components/admin/PackageModal.tsx`

**Interfaces:**
- Consumes: Admin APIs (`/api/auth/*`, `/api/bookings/*`, `/api/packages/*`, `/api/gallery/*`, `/api/settings/*`)
- Produces: Protected management dashboard for photo studio staff.

- [ ] **Step 1: Implement Admin Auth & Protection in `src/app/admin/login/page.tsx` and `src/app/admin/layout.tsx`**
  Create clean login screen. Layout checks session cookie on server; if missing/invalid, redirects to `/admin/login`. Includes responsive sidebar with links (Dashboard, Reservasi, Paket Foto, Portofolio, Pengaturan) and logout button.

- [ ] **Step 2: Implement Admin Overview Dashboard (`src/app/admin/page.tsx`)**
  Display metric cards: Total Booking Bulan Ini, Menunggu Konfirmasi (Pending), Estimasi Omset (Revenue), Jadwal Sesi Hari Ini. Table of upcoming bookings for today and tomorrow.

- [ ] **Step 3: Implement Bookings Management (`src/app/admin/bookings/page.tsx`)**
  - Filter tabs: Semua, Pending, Confirmed, Completed, Cancelled.
  - Search by client name, phone, or booking code.
  - Status action dropdown/buttons (Konfirmasi Jadwal, Tandai Selesai, Batalkan).
  - Quick action: "Chat Klien via WhatsApp".
  - Quick action: "Kirim Reminder Jadwal" with pre-filled WhatsApp reminder text.

- [ ] **Step 4: Implement Package & Add-on Management (`src/app/admin/packages/page.tsx`)**
  List packages and add-ons. Add/edit modal (`PackageModal`) with fields for name, category, price, duration, features, and active toggle.

- [ ] **Step 5: Implement Gallery Management (`src/app/admin/gallery/page.tsx`)**
  Grid of portfolio showcase photos with add image modal and delete button.

- [ ] **Step 6: Implement Settings (`src/app/admin/settings/page.tsx`)**
  Form to edit Studio Name, WhatsApp Number, Instagram Handle, Opening Time, Closing Time, Slot Duration, Address, and change admin password.

- [ ] **Step 7: Commit admin portal**
  ```bash
  git add src/app/admin/ src/components/admin/
  git commit -m "feat: implement comprehensive admin portal and management screens"
  ```

---

### Task 7: Legacy Cleanup, E2E Verification & Documentation

**Files:**
- Create: `scripts/verify-all.ts`
- Modify: `README.md`
- Remove: Legacy monolithic files (`src/App.tsx`, `src/services/bookingService.ts`, `src/services/db.ts`, `src/services/seedService.ts`, `src/lib/firebase.ts`, `index.html`, `vite.config.ts`, `firebase-*.json`, `firestore.rules`)

- [ ] **Step 1: Create master automated verification script `scripts/verify-all.ts`**
  Comprehensive test script validating:
  1. Database connection and seed integrity.
  2. Domain logic (IDR formatting, slot generator, WhatsApp URL generator).
  3. Collision guard: concurrent double-booking prevention.
  4. Client booking tracking query.
  5. Admin session generation and authentication.

- [ ] **Step 2: Run verification script**
  Run: `npx tsx scripts/verify-all.ts`
  Expected: All checks pass (100% green).

- [ ] **Step 3: Safely delete legacy dead files**
  Delete old Vite monolith files (`src/App.tsx`, `index.html`, `vite.config.ts`, `src/services/`, old `src/lib/firebase.ts`, `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`).

- [ ] **Step 4: Update `README.md`**
  Document the revamped modern architecture, setup steps (`npm install`, `npx prisma db push`, `npm run seed`), running locally (`npm run dev`), default admin credentials, and production deployment guide.

- [ ] **Step 5: Run production build check**
  Run: `npm run build`
  Expected: Clean Next.js build with 0 TypeScript/lint errors.

- [ ] **Step 6: Final commit**
  ```bash
  git add -A
  git commit -m "chore: cleanup legacy files and finalize snapbook studio revamp"
  ```
