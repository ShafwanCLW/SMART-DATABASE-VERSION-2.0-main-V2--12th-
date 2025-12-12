// Firebase configuration and initialization
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Missing Firebase configuration. Using mock services for development.');
  // Instead of throwing an error, we'll use mock services
  // This allows the app to run without Firebase configuration for development
}

// Initialize Firebase or mock services based on configuration availability
let auth, db, storage, firebaseApp = null;

if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
  // Initialize Firebase with real configuration
  const existingApps = getApps();
  firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
} else {
  // Mock implementations for development
  auth = {
    // Mock auth methods
    signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid' } }),
    signOut: () => Promise.resolve()
  };
  
  db = {
    // Mock firestore methods
    collection: () => ({})
  };
  
  storage = {
    // Mock storage methods
    ref: () => ({})
  };
}

// Export the services (real or mock)
export { auth, db, storage, firebaseConfig, firebaseApp };

// Export initialized app (may be null/mocked)
export default firebaseApp;
