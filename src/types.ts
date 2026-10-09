export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface PackageItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  imageUrl?: string | null;
  features: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  isActive: boolean;
}

export interface StudioConfigData {
  id: string;
  studioName: string;
  whatsappNumber: string;
  instagramHandle: string;
  openingTime: string;
  closingTime: string;
  slotDuration: number;
  address: string;
  aboutText: string;
}

export interface ShowcaseImageData {
  id: string;
  url: string;
  title?: string | null;
  category: string;
  aspectRatio: string;
  sortOrder: number;
}

export interface BookingData {
  id: string;
  bookingCode: string;
  packageId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  notes?: string | null;
  createdAt: string | Date;
  package: PackageItem;
  addOns: {
    id: string;
    addOnId: string;
    priceAtBooking: number;
    addOn: AddOnItem;
  }[];
}
