
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { InstitutionProfile, InstitutionProfileContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      setInstitutionProfile(defaultProfile);
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

          // One-time migration for the name to ensure it's correct
          if (profileData.name === 'SmartAttend Institute') {
              updateDoc(profileDocRef, { name: 'Smart Institute' });
              profileData.name = 'Smart Institute'; // Optimistically update for immediate UI change
          }
          
          setInstitutionProfile(profileData);

        } else {
          // If doc doesn't exist, use the local default and create it in Firestore.
          setInstitutionProfile(defaultProfile);
          setDoc(profileDocRef, defaultProfile).catch(err => {
              console.error("Failed to set default institution profile in Firestore:", err);
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching institution profile:", error);
        setInstitutionProfile(defaultProfile);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);
  
  const updateInstitutionProfile = useCallback(async (data: Partial<Omit<InstitutionProfile, 'id'>>) => {
      if (!firestore) {
          toast({ variant: 'destructive', title: 'Update Failed', description: 'Database not available.' });
          return;
      }
      const profileDocRef = doc(firestore, 'institution', 'profile');
      try {
          await setDoc(profileDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
          toast({ title: 'Profile Updated', description: 'Institution details have been saved.' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
          throw error;
      }
  }, [firestore, toast]);


  const value = { institutionProfile, loading, updateInstitutionProfile };

  return (
    <InstitutionProfileContext.Provider value={value}>
      {children}
    </InstitutionProfileContext.Provider>
  );
}
