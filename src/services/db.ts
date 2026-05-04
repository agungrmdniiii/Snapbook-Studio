import { openDB, IDBPDatabase } from 'idb';
import { ShowcaseImage } from '../types';

const DB_NAME = 'LuminaStudioDB';
const DB_VERSION = 2; // Incremented version
const SHOWCASE_STORE = 'showcase';
const PACKAGES_STORE = 'packages';

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(SHOWCASE_STORE, { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(PACKAGES_STORE)) {
            db.createObjectStore(PACKAGES_STORE, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function migrateFromLocalStorage() {
  // Showcase Migration
  const localShowcase = localStorage.getItem('showcase');
  if (localShowcase) {
    try {
      const images: ShowcaseImage[] = JSON.parse(localShowcase);
      const db = await getDB();
      const tx = db.transaction(SHOWCASE_STORE, 'readwrite');
      for (const img of images) {
        await tx.store.put(img);
      }
      await tx.done;
      localStorage.removeItem('showcase');
      console.log('Migrated showcase from localStorage to IndexedDB');
    } catch (e) {
      console.error('Showcase migration failed:', e);
    }
  }

  // Packages Migration
  const localPackages = localStorage.getItem('packages');
  if (localPackages) {
    try {
      const packages: any[] = JSON.parse(localPackages);
      const db = await getDB();
      const tx = db.transaction(PACKAGES_STORE, 'readwrite');
      for (const pkg of packages) {
        await tx.store.put(pkg);
      }
      await tx.done;
      localStorage.removeItem('packages');
      console.log('Migrated packages from localStorage to IndexedDB');
    } catch (e) {
      console.error('Packages migration failed:', e);
    }
  }
}
