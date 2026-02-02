'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { InstitutionProfile, InstitutionProfileContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/hooks/use-auth';


export const InstitutionProfileContext = createContext<InstitutionProfileContextType | undefined>(undefined);

const defaultProfile: InstitutionProfile = {
    id: 'profile',
    name: "Smart Institute",
    address: "123 Innovation Drive, Electronic City, Bengaluru",
    contact: "08221 - 226491 | Cell: +91 9886618231",
    email: "info@smartinstitute.edu",
    coverImageUrl: "https://picsum.photos/seed/college-campus/1920/1080",
};

export function InstitutionProfileProvider({ children }: { children: ReactNode }) {
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!firestore || authLoading) {
      if (!authLoading) { // If auth is done but no firestore, use default.
          setInstitutionProfile(defaultProfile);
          setLoading(false);
      }
      return;
    }

    setLoading(true);
    const profileDocRef = doc(firestore, 'institution', 'profile');

    const unsubscribe = onSnapshot(profileDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const profileData: InstitutionProfile = { 
              id: snapshot.id, 
              name: data.name,
              address: data.address,
              contact: data.contact,
              email: data.email,
              coverImageUrl: data.coverImageUrl
          };
          setInstitutionProfile(profileData);
        } else {
          // If doc doesn't exist, use the local default.
          setInstitutionProfile(defaultProfile);
          // Only an admin should be able to create the document.
          if (user?.role === 'admin') {
              setDoc(profileDocRef, defaultProfile).catch(err => {
                  if (err.code === 'permission-denied') {
                      errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: profileDocRef.path,
                        operation: 'create',
                        requestResourceData: defaultProfile
                      }));
                  } else {
                      toast({ variant: 'destructive', title: 'Error', description: 'Could not create institution profile.' });
                  }
              });
          }
        }
        setLoading(false);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
            path: profileDocRef.path,
            operation: 'get'
        });
        errorEmitter.emit('permission-error', permissionError);
        setInstitutionProfile(defaultProfile); // Fallback to default
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user, authLoading, toast]);
  
  const updateInstitutionProfile = useCallback((data: Partial<Omit<InstitutionProfile, 'id'>>) => {
      if (!firestore) {
          toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
          return;
      }
      const profileDocRef = doc(firestore, 'institution', 'profile');
      const dataToSave = { ...data, updatedAt: serverTimestamp() };
      
      setDoc(profileDocRef, dataToSave, { merge: true })
        .then(() => {
          toast({ title: 'Profile Updated', description: 'Institution details have been saved.' });
        })
        .catch((error: any) => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: profileDocRef.path,
                    operation: 'update',
                    requestResourceData: dataToSave
                }));
            } else {
                toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
            }
        });
  }, [firestore, toast]);


  const value = { institutionProfile, loading, updateInstitutionProfile };

  return (
    <InstitutionProfileContext.Provider value={value}>
      {children}
    </InstitutionProfileContext.Provider>
  );
}
