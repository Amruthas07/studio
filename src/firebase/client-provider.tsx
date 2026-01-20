'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase and enable persistence ONCE at the module level.
// This ensures it runs before any other Firebase methods are called.
const apps = getApps();
const firebaseApp: FirebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);

// This check must be done outside of the React component lifecycle.
// As this is a 'use client' file, this code only runs on the client.
enableIndexedDbPersistence(firestore)
  .then(() => console.log("Firestore offline persistence enabled."))
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // This is a common warning in development with hot-reloading.
      // It means persistence is already enabled in another tab. Safe to ignore.
      console.warn("Firestore offline persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore offline persistence is not supported in this browser.");
    } else {
        console.error("Failed to enable Firestore persistence:", err);
    }
  });


type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The provider now simply passes down the instances that were already created.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
