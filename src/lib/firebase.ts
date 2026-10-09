import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, dbId);
export const auth = getAuth(app);

async function testConnection() {
  try {
    // Try to get a non-existent doc from server to test connectivity
    // Using a more standard approach
    const testDoc = doc(db, '_connection_test_', 'test');
    await getDocFromServer(testDoc);
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.error("Firestore Error: The client is offline or database is unavailable. Please check Firebase configuration.");
    } else {
      console.log("Firestore connection check finished (Status OK, likely permission/missing doc):", error.code || error.message);
    }
  }
}

testConnection();
