import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.resolve('docs/images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function saveCompressedPng(buffer, targetPath) {
  let compressed = await sharp(buffer)
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 85 })
    .toBuffer();

  // If still above 480 KB, decrease quality slightly to guarantee < 500 KB limit
  if (compressed.length > 480 * 1024) {
    compressed = await sharp(buffer)
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 75 })
      .toBuffer();
  }

  fs.writeFileSync(targetPath, compressed);
  const sizeKB = compressed.length / 1024;
  console.log(`   Saved ${targetPath} (${sizeKB.toFixed(1)} KB)`);
  return sizeKB;
}

async function takeScreenshots() {
  console.log('🚀 Launching Chromium browser (1440x900)...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    // 1. Preview Home
    console.log('📸 1. Capturing preview-home.png...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    await page.waitForTimeout(1000);
    const homePath = path.join(OUTPUT_DIR, 'preview-home.png');
    const homeBuffer = await page.screenshot();
    await saveCompressedPng(homeBuffer, homePath);

    // 2. Preview Gallery
    console.log('📸 2. Capturing preview-gallery.png...');
    await page.evaluate(() => {
      const el = document.getElementById('galeri');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(1000);
    const galleryPath = path.join(OUTPUT_DIR, 'preview-gallery.png');
    const galleryBuffer = await page.screenshot();
    await saveCompressedPng(galleryBuffer, galleryPath);

    // 3. Preview Booking (Wizard to Date & Time selection)
    console.log('📸 3. Capturing preview-booking.png...');
    await page.goto(`${BASE_URL}/book`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Select package and proceed to Step 2 (Date & Time)
    const nextBtn = page.locator('button:has-text("Lanjut ke Jadwal")');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
    const bookingPath = path.join(OUTPUT_DIR, 'preview-booking.png');
    const bookingBuffer = await page.screenshot();
    await saveCompressedPng(bookingBuffer, bookingPath);

    // 4. Preview Cek Booking (Tracking E-Receipt)
    console.log('📸 4. Capturing preview-cek-booking.png...');
    await page.goto(`${BASE_URL}/cek-booking`, { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="SB-"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('SB-20261014-001');
      const submitBtn = page.locator('button:has-text("Lacak"), button[type="submit"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1200);
      }
    }
    const cekBookingPath = path.join(OUTPUT_DIR, 'preview-cek-booking.png');
    const cekBookingBuffer = await page.screenshot();
    await saveCompressedPng(cekBookingBuffer, cekBookingPath);

    // 5. Preview Admin (Dashboard / Bookings table after login)
    console.log('📸 5. Capturing preview-admin.png...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#username-admin, input[type="text"]');
    if (process.env.SCREENSHOT_ADMIN_USERNAME && process.env.SCREENSHOT_ADMIN_PASSWORD) {
    await page.locator('#username-admin, input[type="text"]').first().fill(process.env.SCREENSHOT_ADMIN_USERNAME);
    await page.locator('#password, input[type="password"]').first().fill(process.env.SCREENSHOT_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/admin', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // Ensure we are on admin overview/bookings
    if (!page.url().includes('/admin/bookings')) {
      await page.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }
    } else {
      console.log('   Kredensial admin tidak diberikan; mengambil halaman login saja.');
    }

    const adminPath = path.join(OUTPUT_DIR, 'preview-admin.png');
    const adminBuffer = await page.screenshot();
    await saveCompressedPng(adminBuffer, adminPath);

    console.log('✨ All screenshots captured and compressed successfully in docs/images/!');

    // Check size limit: each under 500 KB
    const files = ['preview-home.png', 'preview-gallery.png', 'preview-booking.png', 'preview-cek-booking.png', 'preview-admin.png'];
    let allUnderLimit = true;
    for (const f of files) {
      const filePath = path.join(OUTPUT_DIR, f);
      const sizeKB = fs.statSync(filePath).size / 1024;
      if (sizeKB > 500) {
        console.warn(`⚠️ Warning: ${f} is ${sizeKB.toFixed(1)} KB (exceeds 500 KB)`);
        allUnderLimit = false;
      } else {
        console.log(`✅ ${f}: ${sizeKB.toFixed(1)} KB (< 500 KB)`);
      }
    }

    if (allUnderLimit) {
      console.log('🎉 All screenshots are strictly below 500 KB!');
    }
  } catch (err) {
    console.error('❌ Error capturing screenshots:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
