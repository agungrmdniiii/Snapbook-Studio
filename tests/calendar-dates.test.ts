import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates, shiftCalendarDate, studioToday } from '../src/lib/calendar-dates';

test('studio day changes at midnight WIB, independently of the browser timezone', () => {
  assert.equal(studioToday(new Date('2026-10-18T16:59:59Z')), '2026-10-18');
  assert.equal(studioToday(new Date('2026-10-18T17:00:00Z')), '2026-10-19');
});

test('week is Monday through Sunday, including year and month boundaries', () => {
  assert.deepEqual(calendarDates('2027-01-03', 'week'), [
    '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
  ]);
  assert.deepEqual(calendarDates('2026-10-19', 'day'), ['2026-10-19']);
  assert.equal(shiftCalendarDate('2024-03-01', -1), '2024-02-29');
  assert.equal(calendarDates('2026-10-19', 'week')[0], '2026-10-19');
});
