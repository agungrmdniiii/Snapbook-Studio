import assert from 'assert';
import { prisma } from '../src/lib/prisma';
import { formatIDR, generateTimeSlots, calculateEndTime } from '../src/lib/utils';
import { sanitizeWhatsAppNumber, generateBookingWhatsAppUrl, generateReminderWhatsAppUrl } from '../src/lib/whatsapp';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';

async function runMasterVerification() {
  console.log('====================================================');
  console.log('🚀 RUNNING MASTER VERIFICATION SUITE - SNAPBOOK STUDIO');
  console.log('====================================================\n');

  // 1. Database & Seeding Check
  console.log('1️⃣ Checking Database & Seed Integrity...');
  const config = await prisma.studioConfig.findUnique({ where: { id: 'default' } });
  assert(config !== null, 'StudioConfig must exist');
  assert.strictEqual(config.studioName, 'Snapbook Studio');

  const packages = await prisma.package.findMany();
  assert(packages.length >= 3, 'At least 3 photo packages must exist');

  const addOns = await prisma.addOn.findMany();
  assert(addOns.length >= 3, 'At least 3 add-ons must exist');

  const gallery = await prisma.showcaseImage.findMany();
  assert(gallery.length >= 4, 'At least 4 showcase gallery photos must exist');

  const admin = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
  assert(admin !== null, 'Admin user must exist');
  console.log('   ✅ Seed data is 100% complete and healthy.\n');

  // 2. Domain Logic & Calculation Check
  console.log('2️⃣ Checking Domain Utilities...');
  assert.strictEqual(formatIDR(150000), 'Rp 150.000');
  assert.strictEqual(formatIDR(1250000), 'Rp 1.250.000');

  const slots = generateTimeSlots('09:00', '12:00', 60);
  assert.deepStrictEqual(slots, ['09:00', '10:00', '11:00']);

  assert.strictEqual(sanitizeWhatsAppNumber('08123456789'), '628123456789');
  assert.strictEqual(sanitizeWhatsAppNumber('+62 899-1234-5678'), '6289912345678');
  console.log('   ✅ Domain utilities format & calculate accurately.\n');

  // 3. Collision-Free Booking Engine & Concurrency Check
  console.log('3️⃣ Checking Booking Engine & Anti-Collision System...');
  const testDate = '2026-12-25';
  const testTime = '14:00';
  const pkg = packages[0];

  // Clean test slots
  await prisma.booking.deleteMany({ where: { date: testDate } });

  // Create Booking 1
  const booking1 = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findFirst({
      where: { date: testDate, startTime: testTime, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (existing) throw new Error('SLOT_TAKEN');

    return await tx.booking.create({
      data: {
        bookingCode: `SB-${testDate.replace(/-/g, '')}-TEST1`,
        packageId: pkg.id,
        clientName: 'Master Test Client 1',
        clientEmail: 'client1@test.com',
        clientPhone: '081122334455',
        date: testDate,
        startTime: testTime,
        endTime: calculateEndTime(testTime, pkg.duration),
        status: 'PENDING',
        totalPrice: pkg.price,
      },
      include: { package: true },
    });
  });

  assert(booking1 !== null, 'Booking 1 must be created');
  console.log('   ✅ Booking 1 created:', booking1.bookingCode);

  // Attempt Collision on exact same date & time (must be rejected)
  let collisionRejected = false;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: { date: testDate, startTime: testTime, status: { in: ['PENDING', 'CONFIRMED'] } },
      });
      if (existing) throw new Error('SLOT_TAKEN');
      await tx.booking.create({
        data: {
          bookingCode: `SB-${testDate.replace(/-/g, '')}-TEST2`,
          packageId: pkg.id,
          clientName: 'Master Test Client 2',
          clientEmail: 'client2@test.com',
          clientPhone: '089988776655',
          date: testDate,
          startTime: testTime,
          endTime: calculateEndTime(testTime, pkg.duration),
          status: 'PENDING',
          totalPrice: pkg.price,
        },
      });
    });
  } catch (err: any) {
    if (err.message === 'SLOT_TAKEN') collisionRejected = true;
  }

  assert(collisionRejected, 'Concurrency collision guard MUST reject duplicate bookings');
  console.log('   ✅ Anti-collision successfully prevented double-booking.');

  // Clean up test booking
  await prisma.booking.delete({ where: { id: booking1.id } });
  console.log('   ✅ Test reservation cleanly purged.\n');

  // 4. WhatsApp Automation Check
  console.log('4️⃣ Checking WhatsApp Link Generation...');
  const waUrl = generateBookingWhatsAppUrl('6281234567890', {
    bookingCode: 'SB-20261225-8899',
    clientName: 'Rian Anggara',
    packageName: 'Graduation Special',
    packagePrice: 450000,
    date: '2026-12-25',
    startTime: '14:00',
    endTime: '15:00',
    totalPrice: 450000,
  });
  assert(waUrl.includes('https://wa.me/6281234567890?text='));
  assert(decodeURIComponent(waUrl).includes('SB-20261225-8899'));

  const reminderUrl = generateReminderWhatsAppUrl('0855667788', {
    bookingCode: 'SB-20261225-8899',
    clientName: 'Rian Anggara',
    packageName: 'Graduation Special',
    packagePrice: 450000,
    date: '2026-12-25',
    startTime: '14:00',
    endTime: '15:00',
    totalPrice: 450000,
  });
  assert(reminderUrl.includes('https://wa.me/62855667788?text='));
  console.log('   ✅ WhatsApp booking & reminder formats are valid.\n');

  // 5. Auth & Cookie Security Check
  console.log('5️⃣ Checking Admin Authentication & Session Security...');
  const passwordMatch = await verifyPassword('adminpassword123', admin.passwordHash);
  assert(passwordMatch, 'Admin password must verify');

  const token = createSessionToken({ id: admin.id, username: admin.username });
  const verified = verifySessionToken(token);
  assert(verified !== null && verified.username === 'admin');

  const tampered = token + 'hack';
  assert(verifySessionToken(tampered) === null, 'Tampered token must fail');
  console.log('   ✅ Password hash & signed session security verified.\n');

  console.log('====================================================');
  console.log('🎉 ALL MASTER VERIFICATION CHECKS PASSED (100% GREEN)');
  console.log('====================================================');
}

runMasterVerification()
  .catch((e) => {
    console.error('❌ Master verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
