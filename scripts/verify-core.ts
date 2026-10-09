import assert from 'assert';
import { formatIDR, generateTimeSlots, cn } from '../src/lib/utils';
import { sanitizeWhatsAppNumber, generateBookingWhatsAppUrl, generateReminderWhatsAppUrl } from '../src/lib/whatsapp';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';

async function runCoreTests() {
  console.log('🧪 Running Core Domain Unit Tests (TDD)...');

  // 1. Utils: formatIDR
  assert.strictEqual(formatIDR(450000), 'Rp 450.000', 'formatIDR should format with Rp and thousands dot');
  assert.strictEqual(formatIDR(0), 'Rp 0', 'formatIDR should format 0 correctly');
  assert.strictEqual(formatIDR(1250000), 'Rp 1.250.000', 'formatIDR should format millions');

  // 2. Utils: generateTimeSlots
  const slots = generateTimeSlots('09:00', '13:00', 60);
  assert.deepStrictEqual(slots, ['09:00', '10:00', '11:00', '12:00'], 'generateTimeSlots should create 60-min slots');

  const halfHourSlots = generateTimeSlots('09:00', '11:00', 30);
  assert.deepStrictEqual(halfHourSlots, ['09:00', '09:30', '10:00', '10:30'], 'generateTimeSlots should support 30-min slots');

  // 3. WhatsApp: sanitizeWhatsAppNumber
  assert.strictEqual(sanitizeWhatsAppNumber('08123456789'), '628123456789', 'Local 08.. should become 628..');
  assert.strictEqual(sanitizeWhatsAppNumber('+62 812-3456-7890'), '6281234567890', 'Symbols, spaces, plus should be stripped');
  assert.strictEqual(sanitizeWhatsAppNumber('6281234567890'), '6281234567890', 'Standard 628.. should stay intact');

  // 4. WhatsApp: generateBookingWhatsAppUrl
  const mockBooking = {
    bookingCode: 'SB-20261009-8472',
    clientName: 'Budi Santoso',
    packageName: 'Graduation Special',
    packagePrice: 450000,
    date: '2026-10-15',
    startTime: '14:00',
    endTime: '15:00',
    addOns: ['Ekstra Cetak 10R (Rp 60.000)'],
    totalPrice: 510000,
  };
  const bookingUrl = generateBookingWhatsAppUrl('081234567890', mockBooking);
  assert(bookingUrl.startsWith('https://wa.me/6281234567890?text='), 'WhatsApp URL must target sanitized studio phone');
  assert(decodeURIComponent(bookingUrl).includes('SB-20261009-8472'), 'Message must contain booking code');
  assert(decodeURIComponent(bookingUrl).includes('Budi Santoso'), 'Message must contain client name');
  assert(decodeURIComponent(bookingUrl).includes('Rp 510.000'), 'Message must contain formatted total price');

  // 5. WhatsApp: generateReminderWhatsAppUrl
  const reminderUrl = generateReminderWhatsAppUrl('089988776655', mockBooking, 'Snapbook Studio');
  assert(reminderUrl.startsWith('https://wa.me/6289988776655?text='), 'Reminder URL must target sanitized client phone');
  assert(decodeURIComponent(reminderUrl).includes('Snapbook Studio'), 'Reminder message must mention studio name');
  assert(decodeURIComponent(reminderUrl).includes('14:00'), 'Reminder message must mention session start time');

  // 6. Auth: Password Hashing & Verification
  const testPass = 'adminpassword123';
  const hashed = await hashPassword(testPass);
  assert(await verifyPassword(testPass, hashed), 'Password verification should succeed for valid password');
  assert(!(await verifyPassword('wrongpassword', hashed)), 'Password verification should fail for invalid password');

  // 7. Auth: Session Token Sign & Verification
  const payload = { id: 'admin-1', username: 'admin' };
  const token = createSessionToken(payload);
  assert(typeof token === 'string' && token.includes('.'), 'Session token should be signed token string');
  const verified = verifySessionToken(token);
  assert(verified !== null, 'Valid session token should verify');
  assert.strictEqual(verified?.username, 'admin', 'Verified username should match payload');

  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert.strictEqual(verifySessionToken(tamperedToken), null, 'Tampered token should fail verification');

  console.log('✅ ALL CORE TESTS PASSED!');
}

runCoreTests().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
