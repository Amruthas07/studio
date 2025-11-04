
'use client';
import { ReactNode, createContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

export const FirebaseAppContext = createContext<FirebaseApp | undefined>(
  undefined
);
export const FirebaseAuthContext = createContext<Auth | undefined>(undefined);
export const FirestoreContext = createContext<Firestore | undefined>(undefined);

type FirebaseProviderProps = {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: FirebaseProviderProps) {
  return (
    <FirebaseAppContext.Provider value={firebaseApp}>
      <FirebaseAuthContext.Provider value={auth}>
        <FirestoreContext.Provider value={firestore}>
          {children}
        </FirestoreContext.Provider>
      </FirebaseAuthContext.Provider>
    </FirebaseAppContext.Provider>
  );
}
