import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Ensure we don't initialize multiple times
const apps = getApps();
const adminApp = apps.length === 0 ? initializeApp(adminConfig, 'admin') : apps[0];

export const admin = {
  app: adminApp,
  auth: () => getAuth(adminApp),
  firestore: () => getFirestore(adminApp),
};

export default admin;