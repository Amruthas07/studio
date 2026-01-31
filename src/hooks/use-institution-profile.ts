
"use client";

import { useContext } from 'react';
import { InstitutionProfileContext } from '@/contexts/institution-profile-context';
import type { InstitutionProfileContextType } from '@/lib/types';


export const useInstitutionProfile = () => {
  const context = useContext(InstitutionProfileContext);
  if (context === undefined) {
    throw new Error('useInstitutionProfile must be used within an InstitutionProfileProvider');
  }
  return context as InstitutionProfileContextType;
};
