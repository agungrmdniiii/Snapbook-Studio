export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  category: string;
  imageUrl?: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  packageId: string;
  packageName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  selectedAddOns?: AddOn[];
  createdAt: any;
  updatedAt: any;
}

export interface StudioConfig {
  studioName: string;
  whatsappNumber: string;
  instagramHandle?: string;
  openingTime: string;
  closingTime: string;
  aboutText: string;
  adminId?: string;
  adminPw?: string;
  holidays?: string[];
  categories?: string[];
  addOns?: AddOn[];
}

export interface ShowcaseImage {
  id: string;
  url: string;
  title?: string;
  category?: string;
  aspectRatio: 'portrait' | 'landscape' | 'square';
  createdAt: any;
}

