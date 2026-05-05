import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

async function testConnection() {
  try {
    // Try to get a non-existent doc from server to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore Error: The client is offline. Please check your Firebase configuration and database ID.");
    } else {
      console.warn("Firestore connection test finished (expected if doc missing or rules apply):", error);
    }
  }
}

testConnection();
