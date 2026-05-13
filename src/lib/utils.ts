import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatIDR(value: string | number): string {
  const num = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString();
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num));
}

export function parseIDR(formattedValue: string): number {
  return parseInt(formattedValue.replace(/\D/g, '')) || 0;
}

export function generateWhatsAppLink(phone: string, message: string) {
  // Remove non-digit characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  // If phone starts with 0, replace with 62
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
