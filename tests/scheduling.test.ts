import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSlots, validateBookingInput, validateSessionTime, wibNow } from '../src/lib/scheduling';

const config = { openingTime: '09:00', closingTime: '20:00', slotDuration: 60 };
test('long sessions occupy all overlapping slots and must finish before closing', () => {
  const slots = buildSlots(config, 90, [{ startTime: '09:00', endTime: '10:30' }], '2027-01-02', new Date('2027-01-01T00:00:00Z'));
  assert.equal(slots.find(s => s.time === '10:00')?.available, false);
  assert.equal(slots.find(s => s.time === '11:00')?.available, true);
  assert.equal(slots.some(s => s.time === '19:00'), false);
});
test('rejects invalid calendar dates, off-grid times, elapsed WIB sessions, and invalid config', () => {
  const now = new Date('2027-01-01T03:00:00Z');
  assert.throws(() => validateSessionTime(config, 60, '2027-02-30', '10:00', now));
  assert.throws(() => validateSessionTime(config, 60, '2027-01-02', '10:17', now));
  assert.throws(() => validateSessionTime(config, 60, '2027-01-01', '10:00', now));
  assert.throws(() => buildSlots({ ...config, slotDuration: -1 }, 60, [], '2027-01-02', now));
  assert.deepEqual(wibNow(new Date('2027-01-01T18:00:00Z')), { date: '2027-01-02', time: '01:00' });
});
test('validates types, bounds, phones, email and deduplicates add-ons', () => {
  const input = { packageId: 'pkg', clientName: 'Nama Uji', clientPhone: '0812 3456 7890', date: '2027-01-02', startTime: '09:00', addOnIds: ['a', 'a'] };
  assert.equal(validateBookingInput(input).clientPhone, '081234567890');
  assert.deepEqual(validateBookingInput(input).addOnIds, ['a']);
  assert.throws(() => validateBookingInput({ ...input, clientEmail: 'broken' }));
  assert.throws(() => validateBookingInput({ ...input, clientName: {} }));
  assert.throws(() => validateBookingInput({ ...input, notes: 'x'.repeat(2001) }));
});

test('cleanup buffer prevents adjacent sessions and must finish by closing', () => {
  const buffered = { ...config, bufferMinutes: 30 };
  assert.throws(() => validateSessionTime(buffered, 60, '2099-01-02', '19:00'));
  const slots = buildSlots(buffered, 60, [{ startTime: '09:00', endTime: '10:00' }], '2099-01-02');
  assert.equal(slots.find(s => s.time === '10:00')?.available, false);
  assert.equal(slots.find(s => s.time === '11:00')?.available, true);
});
