
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// This is a server-only file.

const apps = getApps();

const firebaseApp = !apps.length
  ? initializeApp({
      ...firebaseConfig,
      // If you have a service account, you can add it here.
      // credential: applicationDefault(),
    })
  : getApp();

export const firestore = getFirestore(firebaseApp);
