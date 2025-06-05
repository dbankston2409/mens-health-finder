import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firestoreClient';

export function useRealtimeAdminMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Listen to admin metrics document
    const unsubscribe = onSnapshot(
      doc(db, 'admin_metrics', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          setMetrics(snapshot.data());
        } else {
          // Initialize with default metrics
          setMetrics({
            total_clinics: 0,
            active_clinics: 0,
            total_reviews: 0,
            total_users: 0,
            clinics_by_tier: {
              free: 0,
              basic: 0,
              advanced: 0
            },
            revenue_metrics: {
              total: 0,
              monthly: 0,
              growth: 0
            }
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to admin metrics:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return { metrics, loading, error };
}