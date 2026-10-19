/** Calendar dates are date-only UTC values; today's date follows the studio's WIB clock. */
export function studioToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function shiftCalendarDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function calendarDates(date: string, view: 'day' | 'week'): string[] {
  if (view === 'day') return [date];
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const monday = shiftCalendarDate(date, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftCalendarDate(monday, index));
}
