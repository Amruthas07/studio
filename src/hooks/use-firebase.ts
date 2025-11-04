
'use client';

import { useContext } from 'react';
import {
  FirebaseAppContext,
  FirebaseAuthContext,
  FirestoreContext,
} from '@/firebase/provider';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

export function useFirebaseApp(): FirebaseApp {
  const firebaseApp = useContext(FirebaseAppContext);
  if (!firebaseApp) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return firebaseApp;
}

export function useAuth(): Auth {
  const auth = useContext(FirebaseAuthContext);
  if (!auth) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return auth;
}

export function useFirestore(): Firestore {
  const firestore = useContext(FirestoreContext);
  if (!firestore) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return firestore;
}
