import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { Clinic as ClinicType } from '../../types';

export type Clinic = ClinicType;

export const useClinic = (clinicId: string | undefined) => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const clinicRef = doc(db, 'clinics', clinicId);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      clinicRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Convert timestamps to Date objects
          const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
          const updatedAt = data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date();
          
          setClinic({
            id: docSnap.id,
            ...data,
            createdAt,
            updatedAt,
            services: data.services || [],
            tags: data.tags || [],
          } as Clinic);
        } else {
          setClinic(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching clinic:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [clinicId]);

  return { clinic, loading, error };
};

export default useClinic;