import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function testAllFeatures() {
  console.log('====================================================');
  console.log('🧪 SNAPBOOK STUDIO - COMPREHENSIVE END-TO-END AUDIT');
  console.log('====================================================\n');

  // STEP 1: Verify All Public Web Pages
  console.log('1️⃣ Auditing Public UI Pages (SSR & React 19)...');
  const pages = ['/', '/book', '/cek-booking', '/admin/login'];
  for (const page of pages) {
    const res = await fetch(`${BASE_URL}${page}`);
    assert.strictEqual(res.status, 200, `Page ${page} must return 200 OK`);
    const html = await res.text();
    assert(html.length > 500, `Page ${page} must return valid HTML content`);
    console.log(`   ✅ ${page.padEnd(16)} -> 200 OK (${html.length} bytes)`);
  }
  console.log('   ✨ All public pages rendering cleanly.\n');

  // STEP 2: Verify Public Read APIs
  console.log('2️⃣ Auditing Public Data APIs...');
  
  // Packages API
  const pkgRes = await fetch(`${BASE_URL}/api/packages`);
  assert.strictEqual(pkgRes.status, 200);
  const pkgData = await pkgRes.json();
  assert(Array.isArray(pkgData.packages) && pkgData.packages.length > 0, 'Must have packages');
  assert(Array.isArray(pkgData.addOns) && pkgData.addOns.length > 0, 'Must have add-ons');
  console.log(`   ✅ GET /api/packages               -> 200 OK (${pkgData.packages.length} packages, ${pkgData.addOns.length} add-ons)`);

  // Settings API
  const setRes = await fetch(`${BASE_URL}/api/settings`);
  assert.strictEqual(setRes.status, 200);
  const setData = await setRes.json();
  assert(setData.studioName === 'Snapbook Studio', 'Studio name matches');
  console.log(`   ✅ GET /api/settings               -> 200 OK (Studio: ${setData.studioName})`);

  // Gallery API
  const galRes = await fetch(`${BASE_URL}/api/gallery`);
  assert.strictEqual(galRes.status, 200);
  const galData = await galRes.json();
  assert(Array.isArray(galData) && galData.length > 0, 'Must have gallery items');
  console.log(`   ✅ GET /api/gallery                -> 200 OK (${galData.length} showcase photos)`);

  // Available Slots API
  const testDate = '2026-11-20';
  const slotRes = await fetch(`${BASE_URL}/api/bookings/available-slots?date=${testDate}`);
  assert.strictEqual(slotRes.status, 200);
  const slotData = await slotRes.json();
  assert(Array.isArray(slotData.slots) && slotData.slots.length > 0, 'Must have time slots');
  const availableSlots = slotData.slots.filter((s: any) => s.available);
  console.log(`   ✅ GET /api/bookings/available-slots -> 200 OK (${availableSlots.length} available slots for ${testDate})\n`);

  // STEP 3: Complete Booking Lifecycle & Anti-Collision Engine
  console.log('3️⃣ Auditing Booking Creation & Anti-Collision Engine...');
  const targetPackage = pkgData.packages[0];
  const targetAddOn = pkgData.addOns[0];
  const targetSlot = availableSlots[0].time;

  const bookingPayload = {
    packageId: targetPackage.id,
    clientName: 'Auditor Test Person',
    clientPhone: '081298765432',
    clientEmail: 'audit@snapbook.studio',
    date: testDate,
    startTime: targetSlot,
    addOnIds: [targetAddOn.id],
    notes: 'Unit test automated verification suite',
  };

  // Submit Booking 1
  const createRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload),
  });
  assert.strictEqual(createRes.status, 200, 'Booking creation must succeed');
  const createData = await createRes.json();
  assert(createData.booking && createData.booking.bookingCode, 'Must return created booking');
  assert(createData.whatsappUrl && createData.whatsappUrl.includes('wa.me'), 'Must generate WhatsApp link');
  const createdBookingId = createData.booking.id;
  const createdBookingCode = createData.booking.bookingCode;
  console.log(`   ✅ POST /api/bookings (Booking 1)   -> 200 OK (Code: ${createdBookingCode})`);
  console.log(`   ✅ WhatsApp URL Generated          -> ${createData.whatsappUrl.substring(0, 50)}...`);

  // Collision Test: Attempt duplicate booking on exact same slot (MUST FAIL)
  const collisionRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...bookingPayload,
      clientName: 'Collision Imposter',
      clientPhone: '089999999999',
    }),
  });
  assert.notStrictEqual(collisionRes.status, 200, 'Duplicate booking must NOT succeed');
  console.log(`   ✅ Collision Protection Test       -> Blocked duplicate booking (Status ${collisionRes.status})\n`);

  // STEP 4: Client Self-Service Tracking API
  console.log('4️⃣ Auditing Client Self-Tracking (/cek-booking API)...');
  const trackRes = await fetch(`${BASE_URL}/api/bookings/track?query=${createdBookingCode}`);
  assert.strictEqual(trackRes.status, 200, 'Track query by booking code must succeed');
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.bookingCode, createdBookingCode);
  assert.strictEqual(trackData.clientName, 'Auditor Test Person');
  assert.strictEqual(trackData.status, 'PENDING');
  console.log(`   ✅ GET /api/bookings/track?query=.. -> 200 OK (Status: ${trackData.status}, Price: Rp ${trackData.totalPrice.toLocaleString('id-ID')})\n`);

  // STEP 5: Admin Authentication & Security
  console.log('5️⃣ Auditing Admin Authentication & Session Security...');
  
  // Test invalid login
  const invalidLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
  });
  assert.strictEqual(invalidLoginRes.status, 401, 'Invalid password must return 401');
  console.log('   ✅ POST /api/auth/login (Invalid)  -> 401 Unauthorized (Security check passed)');

  // Test valid login
  const validLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpassword123' }),
  });
  assert.strictEqual(validLoginRes.status, 200, 'Valid login must return 200');
  const rawSetCookie = validLoginRes.headers.get('set-cookie');
  assert(rawSetCookie && rawSetCookie.includes('snapbook_admin_session'), 'Must issue snapbook_admin_session cookie');
  const cookieHeader = rawSetCookie.split(';')[0];
  console.log('   ✅ POST /api/auth/login (Valid)    -> 200 OK (Signed HTTP-only session issued)\n');

  // STEP 6: Admin Back-Office Operations
  console.log('6️⃣ Auditing Admin Back-Office Operations & CRUD...');

  // Update Booking Status to CONFIRMED
  const statusUpdateRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
    body: JSON.stringify({ status: 'CONFIRMED' }),
  });
  assert.strictEqual(statusUpdateRes.status, 200, 'Status update must succeed');
  const statusData = await statusUpdateRes.json();
  assert.strictEqual(statusData.booking.status, 'CONFIRMED');
  console.log(`   ✅ PUT /api/bookings/[id]/status   -> 200 OK (Updated to CONFIRMED)`);

  // Package CRUD Audit
  const createPkgRes = await fetch(`${BASE_URL}/api/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({
      type: 'package',
      name: 'E2E Test Package',
      description: 'Temporary package for audit',
      price: 250000,
      duration: 45,
      category: 'Portrait',
      features: JSON.stringify(['Test Feature 1', 'Test Feature 2']),
      isActive: true,
    }),
  });
  assert.strictEqual(createPkgRes.status, 200, 'Package creation must succeed');
  const createdPkg = await createPkgRes.json();
  const pkgId = createdPkg.package.id;
  console.log(`   ✅ POST /api/packages (Create)     -> 200 OK (Created: ${pkgId})`);

  // Delete Test Package
  const deletePkgRes = await fetch(`${BASE_URL}/api/packages/${pkgId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookieHeader },
  });
  assert.strictEqual(deletePkgRes.status, 200, 'Package deletion must succeed');
  console.log(`   ✅ DELETE /api/packages/[id]       -> 200 OK (Cleanly deleted)`);

  // Gallery CRUD Audit
  const createGalRes = await fetch(`${BASE_URL}/api/gallery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
      title: 'Audit Test Gallery Photo',
      category: 'Portrait',
      aspectRatio: 'portrait',
    }),
  });
  assert.strictEqual(createGalRes.status, 200, 'Gallery creation must succeed');
  const createdGal = await createGalRes.json();
  const galId = createdGal.image.id;
  console.log(`   ✅ POST /api/gallery (Create)      -> 200 OK (Created: ${galId})`);

  const deleteGalRes = await fetch(`${BASE_URL}/api/gallery/${galId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookieHeader },
  });
  assert.strictEqual(deleteGalRes.status, 200, 'Gallery deletion must succeed');
  console.log(`   ✅ DELETE /api/gallery/[id]        -> 200 OK (Cleanly deleted)`);

  // Admin Logout
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Cookie': cookieHeader },
  });
  assert.strictEqual(logoutRes.status, 200, 'Logout must succeed');
  console.log(`   ✅ POST /api/auth/logout           -> 200 OK (Session terminated)\n`);

  // Cleanup Audit Test Booking from DB
  const { prisma } = await import('../src/lib/prisma');
  await prisma.bookingAddOn.deleteMany({ where: { bookingId: createdBookingId } });
  await prisma.booking.delete({ where: { id: createdBookingId } });
  await prisma.$disconnect();
  console.log('   🧹 Test booking data cleanly purged from database.\n');

  console.log('====================================================');
  console.log('🎉 100% SUCCESS: ALL SNAPBOOK STUDIO FEATURES PASSING!');
  console.log('====================================================');
}

testAllFeatures().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
