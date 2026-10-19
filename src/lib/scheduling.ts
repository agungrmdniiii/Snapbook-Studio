export class BookingValidationError extends Error {}
type Schedule = { openingTime: string; closingTime: string; slotDuration: number };
export function wibNow(now = new Date()) {
  const value = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString();
  return { date: value.slice(0, 10), time: value.slice(11, 16) };
}
export function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}
export function timeMinutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BookingValidationError('Format jam tidak valid.');
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}
export function minuteTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
function validateConfig(config: Schedule, duration: number) {
  const opening = timeMinutes(config.openingTime), closing = timeMinutes(config.closingTime);
  if (closing <= opening || !Number.isInteger(config.slotDuration) || config.slotDuration < 1 || config.slotDuration > 1440 || !Number.isInteger(duration) || duration < 1 || duration > 1440) throw new BookingValidationError('Pengaturan jadwal studio belum valid.');
  return { opening, closing };
}
export function validateSessionTime(config: Schedule, duration: number, date: string, startTime: string, now = new Date()) {
  const { opening, closing } = validateConfig(config, duration);
  const current = wibNow(now), start = timeMinutes(startTime);
  if (!validDate(date) || date < current.date || (date === current.date && startTime <= current.time)) throw new BookingValidationError('Pilih tanggal dan jam yang belum lewat (WIB).');
  if (start < opening || (start - opening) % config.slotDuration !== 0 || start + duration > closing) throw new BookingValidationError('Jam sesi tidak sesuai jadwal atau melewati jam tutup studio.');
  return minuteTime(start + duration);
}
export function buildSlots(config: Schedule, duration: number, bookings: { startTime: string; endTime: string }[], date: string, now = new Date()) {
  const { opening, closing } = validateConfig(config, duration), current = wibNow(now);
  if (!validDate(date)) throw new BookingValidationError('Tanggal tidak valid.');
  const slots = [];
  for (let start = opening; start + duration <= closing; start += config.slotDuration) {
    const time = minuteTime(start), endTime = minuteTime(start + duration);
    const isPast = date < current.date || (date === current.date && time <= current.time);
    slots.push({ time, available: !isPast && !bookings.some(b => b.startTime < endTime && b.endTime > time), isPast });
  }
  return slots;
}
export function validateBookingInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BookingValidationError('Data reservasi tidak valid.');
  const input = body as Record<string, unknown>;
  const string = (key: string, max: number, required = true) => {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new BookingValidationError(`Data ${key} tidak valid.`);
    return value.trim();
  };
  const packageId = string('packageId', 128), clientName = string('clientName', 100), clientEmail = string('clientEmail', 254, false), rawPhone = string('clientPhone', 30);
  const clientPhone = rawPhone.replace(/[\s()+-]/g, '');
  if (!/^\d{8,15}$/.test(clientPhone) || !/^[\d\s()+-]+$/.test(rawPhone)) throw new BookingValidationError('Nomor WhatsApp harus berisi 8–15 digit.');
  if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) throw new BookingValidationError('Alamat email tidak valid.');
  const ids = input.addOnIds ?? [];
  if (!Array.isArray(ids) || ids.length > 30 || ids.some(id => typeof id !== 'string' || !id || id.length > 128)) throw new BookingValidationError('Pilihan add-on tidak valid.');
  return { packageId, clientName, clientEmail, clientPhone, date: string('date', 10), startTime: string('startTime', 5), notes: string('notes', 2000, false), addOnIds: [...new Set(ids as string[])] };
}
