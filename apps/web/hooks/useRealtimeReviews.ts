import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firestoreClient';

export function useRealtimeReviews(clinicId: string | undefined) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create query for clinic reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('clinicId', '==', clinicId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(reviewsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to reviews:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [clinicId]);

  return { reviews, loading, error };
}