import { Booking, Package, StudioConfig, ShowcaseImage } from '../types';
import { getDB, migrateFromLocalStorage } from './db';

// Initiate migration in the background
migrateFromLocalStorage();

// Mock Data Awal jika localStorage kosong
const DEFAULT_PACKAGES: Package[] = [
  {
    id: 'basic-self-photo',
    name: 'Basic Session',
    description: '15 minutes photo session, unlimited shots, 2 printed photos.',
    price: 150000,
    duration: 15,
    features: ['15 Mins Session', 'Unlimited Shots', '2 Physical Prints', 'All Soft Files'],
    category: 'Self-Photo'
  },
  {
    id: 'pro-self-photo',
    name: 'Pro Session',
    description: '30 minutes photo session, unlimited shots, 4 printed photos + frame.',
    price: 250000,
    duration: 30,
    features: ['30 Mins Session', 'Unlimited Shots', '4 Physical Prints', '1 Wooden Frame', 'All Soft Files'],
    category: 'Self-Photo'
  }
];

const DEFAULT_CONFIG: StudioConfig = {
  studioName: 'LUMINA STUDIO',
  whatsappNumber: '628123456789',
  openingTime: '09:00',
  closingTime: '21:00',
  aboutText: 'Lumina Studio is a premium photography destination.'
};

// Helper untuk localStorage
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export async function loginWithGoogle() {
  // Mock login - kita anggap user selalu admin jika mengklik login di versi lokal ini
  const mockUser = {
    uid: 'local-admin',
    email: 'agungrmdniiii@gmail.com',
    displayName: 'Local Admin',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  };
  localStorage.setItem('auth_user', JSON.stringify(mockUser));
  return mockUser;
}

export async function logout() {
  localStorage.removeItem('auth_user');
}

export async function getPackages(): Promise<Package[]> {
  const db = await getDB();
  const packages = await db.getAll('packages');
  if (packages.length === 0) {
    // Seed with defaults if empty
    const tx = db.transaction('packages', 'readwrite');
    for (const pkg of DEFAULT_PACKAGES) {
      await tx.store.put(pkg);
    }
    await tx.done;
    return DEFAULT_PACKAGES;
  }
  return packages;
}

export async function savePackage(pkg: Package): Promise<void> {
  const db = await getDB();
  await db.put('packages', pkg);
}

export async function deletePackage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('packages', id);
}

export async function getStudioConfig(): Promise<StudioConfig> {
  return getLocalStorage<StudioConfig>('studio_config', DEFAULT_CONFIG);
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const bookings = getLocalStorage<Booking[]>('bookings', []);
  const id = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const newBooking: Booking = {
    ...bookingData,
    id,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  bookings.push(newBooking);
  setLocalStorage('bookings', bookings);
  return id;
}

export async function getBookings(): Promise<Booking[]> {
  const bookings = getLocalStorage<any[]>('bookings', []);
  // Convert date strings back to Date objects
  return bookings.map(b => ({
    ...b,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt)
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function checkAvailability(date: string, time: string): Promise<boolean> {
  const bookings = await getBookings();
  return !bookings.some(b => b.date === date && b.startTime === time && b.status !== 'cancelled');
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].status = status;
    bookings[index].updatedAt = new Date();
    setLocalStorage('bookings', bookings);
  }
}

export async function getShowcaseImages(): Promise<ShowcaseImage[]> {
  const db = await getDB();
  const images = await db.getAll('showcase');
  return images.map(img => ({
    ...img,
    createdAt: new Date(img.createdAt)
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function addShowcaseImage(image: Omit<ShowcaseImage, 'id' | 'createdAt'>): Promise<string> {
  const db = await getDB();
  const id = 'SH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const newImage: ShowcaseImage = {
    ...image,
    id,
    createdAt: new Date()
  };
  await db.put('showcase', newImage);
  return id;
}

export async function deleteShowcaseImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('showcase', id);
}

