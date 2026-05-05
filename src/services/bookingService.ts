import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, Package, StudioConfig, ShowcaseImage } from '../types';

const CONFIG_DOC_ID = 'main_config';
const COLLECTIONS = {
  PACKAGES: 'packages',
  CONFIG: 'studioConfig',
  BOOKINGS: 'bookings',
  SHOWCASE: 'showcase'
};

const DEFAULT_CONFIG: StudioConfig = {
  studioName: 'LUMINA STUDIO',
  whatsappNumber: '628123456789',
  openingTime: '09:00',
  closingTime: '21:00',
  aboutText: 'Lumina Studio is a premium photography destination.',
  adminId: 'admin',
  adminPw: 'akuadmin'
};

// Error Handler helper for Firebase
function handleFirestoreError(error: any, operation: string, path: string) {
  console.error(`Firestore Error [${operation}] on ${path}:`, error);
  throw error;
}

export async function getStudioConfig(): Promise<StudioConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StudioConfig;
    }
    // Auto-seed if missing
    await setDoc(docRef, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (e) {
    handleFirestoreError(e, 'GET', COLLECTIONS.CONFIG);
    return DEFAULT_CONFIG;
  }
}

export async function saveStudioConfig(config: StudioConfig): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID);
    await setDoc(docRef, config, { merge: true });
  } catch (e) {
    handleFirestoreError(e, 'SET', COLLECTIONS.CONFIG);
  }
}

export async function getPackages(): Promise<Package[]> {
  try {
    const colRef = collection(db, COLLECTIONS.PACKAGES);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Package));
  } catch (e) {
    handleFirestoreError(e, 'LIST', COLLECTIONS.PACKAGES);
    return [];
  }
}

export async function savePackage(pkg: Package): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PACKAGES, pkg.id);
    await setDoc(docRef, pkg);
  } catch (e) {
    handleFirestoreError(e, 'SET', COLLECTIONS.PACKAGES);
  }
}

export async function deletePackage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PACKAGES, id));
  } catch (e) {
    handleFirestoreError(e, 'DELETE', COLLECTIONS.PACKAGES);
  }
}

export async function getBookings(): Promise<Booking[]> {
  try {
    const colRef = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Booking;
    });
  } catch (e) {
    handleFirestoreError(e, 'LIST', COLLECTIONS.BOOKINGS);
    return [];
  }
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  try {
    const colRef = collection(db, COLLECTIONS.BOOKINGS);
    const docRef = await addDoc(colRef, {
      ...bookingData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, 'CREATE', COLLECTIONS.BOOKINGS);
    return '';
  }
}

export async function checkAvailability(date: string, time: string): Promise<boolean> {
  try {
    const bookings = await getBookings();
    return !bookings.some(b => b.id && b.date === date && b.startTime === time && b.status !== 'cancelled');
  } catch (e) {
    return true;
  }
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, 'UPDATE', COLLECTIONS.BOOKINGS);
  }
}

export async function getShowcaseImages(): Promise<ShowcaseImage[]> {
  try {
    const colRef = collection(db, COLLECTIONS.SHOWCASE);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt?.toDate() || new Date()
      } as ShowcaseImage;
    });
  } catch (e) {
    handleFirestoreError(e, 'LIST', COLLECTIONS.SHOWCASE);
    return [];
  }
}

export async function addShowcaseImage(image: Omit<ShowcaseImage, 'id' | 'createdAt'>): Promise<string> {
  try {
    const colRef = collection(db, COLLECTIONS.SHOWCASE);
    const docRef = await addDoc(colRef, {
      ...image,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, 'CREATE', COLLECTIONS.SHOWCASE);
    return '';
  }
}

export async function deleteShowcaseImage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SHOWCASE, id));
  } catch (e) {
    handleFirestoreError(e, 'DELETE', COLLECTIONS.SHOWCASE);
  }
}

export async function loginWithGoogle() { return null; }
export async function logout() { }
