import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
export const app: FirebaseApp = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApp();

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore targeting the provisioned custom database ID
export const db: Firestore = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Configure Google Auth Provider with interactive account selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: 'select_account' 
});

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Eliminates undefined properties from documents prior to Firestore persistence.
 */
export function sanitizePayload<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  return JSON.parse(JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  }));
}
