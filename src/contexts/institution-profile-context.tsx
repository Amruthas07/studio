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
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile | null>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !firestore) {
        setLoading(!authLoading); // If auth is still loading, we are loading. If not, we are done.
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
          // If doc doesn't exist, just use the local default profile.
          // Do not attempt to create it. This should be done manually by an admin if needed.
          setInstitutionProfile(defaultProfile);
        }
        setLoading(false);
      },
      (err) => {
        if (err.code === 'permission-denied') {
            // This is expected if rules are strict and user isn't logged in.
            // We can just use the default profile.
            console.warn("Permission denied to read institution profile. Using default.");
        } else {
            console.error("Error fetching institution profile:", err);
        }
        setInstitutionProfile(defaultProfile); // Fallback to default
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, authLoading]);
  
  const updateInstitutionProfile = useCallback((data: Partial<Omit<InstitutionProfile, 'id'>>) => {
      if (!firestore || !user) {
          toast({ variant: 'destructive', title: 'Update Failed', description: 'You must be logged in.' });
          return;
      }
      
      // Note: This will fail for the mocked admin as it's not a real Firebase user.
      // This would need to be handled by creating a real admin user or using a backend function.
      if (user.role !== 'admin') {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only administrators can update the institution profile.' });
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
  }, [firestore, toast, user]);


  const value = { institutionProfile, loading, updateInstitutionProfile };

  return (
    <InstitutionProfileContext.Provider value={value}>
      {children}
    </InstitutionProfileContext.Provider>
  );
}
