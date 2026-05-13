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
import { db, auth } from '../lib/firebase';
import { Booking, Package, StudioConfig, ShowcaseImage } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Error Handler helper for Firebase as required by the Skill
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  adminPw: 'akuadmin',
  holidays: [],
  categories: ['Self-Photo', 'Professional', 'Event', 'Special']
};

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
    // We don't throw here to prevent app crash on first ever load if seeding fails
    console.warn("Could not fetch config, using defaults", e);
    return DEFAULT_CONFIG;
  }
}

export async function saveStudioConfig(config: StudioConfig): Promise<void> {
  const path = `${COLLECTIONS.CONFIG}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOC_ID);
    await setDoc(docRef, config, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

export async function getPackages(): Promise<Package[]> {
  try {
    const colRef = collection(db, COLLECTIONS.PACKAGES);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Package));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, COLLECTIONS.PACKAGES);
    return [];
  }
}

export async function savePackage(pkg: Package): Promise<void> {
  const path = `${COLLECTIONS.PACKAGES}/${pkg.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.PACKAGES, pkg.id);
    await setDoc(docRef, pkg);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

export async function deletePackage(id: string): Promise<void> {
  const path = `${COLLECTIONS.PACKAGES}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PACKAGES, id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, path);
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
    handleFirestoreError(e, OperationType.LIST, COLLECTIONS.BOOKINGS);
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
    handleFirestoreError(e, OperationType.CREATE, COLLECTIONS.BOOKINGS);
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
  const path = `${COLLECTIONS.BOOKINGS}/${bookingId}`;
  try {
    const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
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
    handleFirestoreError(e, OperationType.LIST, COLLECTIONS.SHOWCASE);
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
    handleFirestoreError(e, OperationType.CREATE, COLLECTIONS.SHOWCASE);
    return '';
  }
}

export async function deleteShowcaseImage(id: string): Promise<void> {
  const path = `${COLLECTIONS.SHOWCASE}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.SHOWCASE, id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, path);
  }
}

export async function loginWithGoogle() { return null; }
export async function logout() { }
