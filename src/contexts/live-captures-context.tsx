
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { LiveCaptureRecord } from '@/lib/types';
import { useFirestore } from '@/hooks/use-firebase';

interface LiveCapturesContextType {
  liveCaptures: LiveCaptureRecord[];
  loading: boolean;
}

export const LiveCapturesContext = createContext<LiveCapturesContextType | undefined>(
  undefined
);

export function LiveCapturesProvider({ children }: { children: ReactNode }) {
  const [liveCaptures, setLiveCaptures] = useState<LiveCaptureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const capturesCollection = collection(firestore, 'liveCaptures');
    const q = query(capturesCollection, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const capturesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
          } as LiveCaptureRecord;
        });
        setLiveCaptures(capturesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching live captures:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  const value = { liveCaptures, loading };

  return (
    <LiveCapturesContext.Provider value={value}>
      {children}
    </LiveCapturesContext.Provider>
  );
}
