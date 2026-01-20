
"use client";

import { useContext } from 'react';
import { LiveCapturesContext } from '@/contexts/live-captures-context';
import type { LiveCapturesContextType } from '@/lib/types';


export const useLiveCaptures = () => {
  const context = useContext(LiveCapturesContext);
  if (context === undefined) {
    throw new Error('useLiveCaptures must be used within a LiveCapturesProvider');
  }
  return context as LiveCapturesContextType;
};
