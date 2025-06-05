import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firestoreClient';

export function useRealtimeImportStatus(importId: string | undefined) {
  const [importStatus, setImportStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!importId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to import log document
    const unsubscribe = onSnapshot(
      doc(db, 'import_logs', importId),
      (snapshot) => {
        if (snapshot.exists()) {
          setImportStatus({
            id: snapshot.id,
            ...snapshot.data()
          });
        } else {
          setImportStatus(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to import status:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [importId]);

  return { importStatus, loading, error };
}