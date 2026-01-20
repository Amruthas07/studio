'use client';
import { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => {
    const apps = getApps();
    const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);

    // Enable offline persistence
    try {
      enableIndexedDbPersistence(firestore)
        .then(() => console.log("Firestore offline persistence enabled."))
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn("Firestore offline persistence failed: Can only be enabled in one tab at a time.");
          } else if (err.code === 'unimplemented') {
            console.warn("Firestore offline persistence is not supported in this browser.");
          }
        });
    } catch (e) {
      console.error("Failed to enable firestore persistence", e);
    }
    
    return { firebaseApp, auth, firestore };
  }, []);

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
