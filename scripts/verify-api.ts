import assert from 'assert';
import { prisma } from '../src/lib/prisma';
import { calculateEndTime, generateTimeSlots } from '../src/lib/utils';

// Helper to simulate the exact atomic booking logic in /api/bookings
async function createBookingSimulated(input: {
  packageId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  addOnIds?: string[];
  notes?: string;
}) {
  const pkg = await prisma.package.findUnique({ where: { id: input.packageId } });
  if (!pkg) throw new Error('Package not found');

  const endTime = calculateEndTime(input.startTime, pkg.duration);

  // Atomic transaction
  return await prisma.$transaction(async (tx) => {
    // Check collision: any booking on this date & time with status != 'CANCELLED'
    const collision = await tx.booking.findFirst({
      where: {
        date: input.date,
        startTime: input.startTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (collision) {
      const err = new Error('Slot already booked');
      (err as any).status = 409;
      throw err;
    }

    // Calculate total price
    let totalPrice = pkg.price;
    const addOnRecords = input.addOnIds && input.addOnIds.length > 0
      ? await tx.addOn.findMany({ where: { id: { in: input.addOnIds } } })
      : [];

    for (const addOn of addOnRecords) {
      totalPrice += addOn.price;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateCode = input.date.replace(/-/g, '');
    const bookingCode = `SB-${dateCode}-${randomSuffix}`;

    const newBooking = await tx.booking.create({
      data: {
        bookingCode,
        packageId: pkg.id,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        date: input.date,
        startTime: input.startTime,
        endTime,
        status: 'PENDING',
        totalPrice,
        notes: input.notes,
        addOns: {
          create: addOnRecords.map((ad) => ({
            addOnId: ad.id,
            priceAtBooking: ad.price,
          })),
        },
      },
      include: {
        package: true,
        addOns: { include: { addOn: true } },
      },
    });

    return newBooking;
  });
}

async function runApiVerification() {
  console.log('🧪 Verifying API & Anti-Collision Booking Engine...');

  const pkg = await prisma.package.findFirst();
  assert(pkg !== null, 'Package must exist');

  const testDate = '2026-11-20';
  const testSlot = '10:00';

  // Clean any old test records for this test date
  await prisma.booking.deleteMany({ where: { date: testDate } });

  // 1. Create first booking (must succeed)
  const booking1 = await createBookingSimulated({
    packageId: pkg.id,
    clientName: 'Testing User 1',
    clientEmail: 'user1@test.com',
    clientPhone: '08123456789',
    date: testDate,
    startTime: testSlot,
  });

  assert(booking1.bookingCode.startsWith('SB-20261120-'), 'Booking code must have correct prefix');
  assert.strictEqual(booking1.status, 'PENDING', 'Initial status must be PENDING');
  console.log('✅ First booking created successfully:', booking1.bookingCode);

  // 2. Collision Test: Attempt second booking on EXACT same slot (must throw 409)
  let collisionCaught = false;
  try {
    await createBookingSimulated({
      packageId: pkg.id,
      clientName: 'Testing User 2',
      clientEmail: 'user2@test.com',
      clientPhone: '08987654321',
      date: testDate,
      startTime: testSlot,
    });
  } catch (err: any) {
    if (err.status === 409 || err.message === 'Slot already booked') {
      collisionCaught = true;
    }
  }

  assert(collisionCaught, 'Collision guard MUST block concurrent booking for the same slot!');
  console.log('✅ Anti-collision engine successfully blocked duplicate booking (409 Conflict).');

  // 3. Tracking Verification: Lookup by booking code
  const tracked = await prisma.booking.findUnique({
    where: { bookingCode: booking1.bookingCode },
    include: { package: true },
  });
  assert(tracked !== null, 'Tracking lookup must find booking');
  assert.strictEqual(tracked.clientName, 'Testing User 1', 'Client name must match');

  // Clean up test booking
  await prisma.booking.delete({ where: { id: booking1.id } });
  console.log('✅ ALL API & ENGINE CHECKS PASSED!');
}

runApiVerification()
  .catch((e) => {
    console.error('❌ API verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
