import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firestoreClient';

export function useRealtimeClinic(clinicId: string | undefined) {
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'clinics', clinicId),
      (snapshot) => {
        if (snapshot.exists()) {
          setClinic({
            id: snapshot.id,
            ...snapshot.data()
          });
        } else {
          setClinic(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to clinic:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [clinicId]);

  return { clinic, loading, error };
}