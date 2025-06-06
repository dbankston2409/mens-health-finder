import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Review {
  id: string;
  source: 'google' | 'yelp' | 'healthgrades' | 'internal';
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: Timestamp;
  language?: string;
  relative_time_description?: string;
  // Internal review fields
  verified?: boolean;
  userId?: string;
  clinicResponse?: string;
  clinicResponseDate?: Timestamp;
}

interface UseClinicReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  averageRating: number;
  lastUpdated: Date | null;
  refetch: () => void;
}

export function useClinicReviews(
  clinicId: string | undefined,
  options?: {
    limit?: number;
    source?: Review['source'];
    minRating?: number;
  }
): UseClinicReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReviews = () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query
      let reviewsQuery = query(
        collection(db, 'clinics', clinicId, 'reviews'),
        orderBy('time', 'desc')
      );

      // Apply filters
      if (options?.source) {
        reviewsQuery = query(reviewsQuery, where('source', '==', options.source));
      }
      if (options?.minRating) {
        reviewsQuery = query(reviewsQuery, where('rating', '>=', options.minRating));
      }
      if (options?.limit) {
        reviewsQuery = query(reviewsQuery, limit(options.limit));
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        reviewsQuery,
        (snapshot) => {
          const reviewsData: Review[] = [];
          let totalRating = 0;
          let latestUpdate: Date | null = null;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const review: Review = {
              id: doc.id,
              ...data,
              time: data.time || Timestamp.now()
            } as Review;
            
            reviewsData.push(review);
            totalRating += review.rating;

            // Track latest update time
            const reviewTime = review.time.toDate();
            if (!latestUpdate || reviewTime > latestUpdate) {
              latestUpdate = reviewTime;
            }
          });

          setReviews(reviewsData);
          setTotalCount(reviewsData.length);
          setAverageRating(reviewsData.length > 0 ? totalRating / reviewsData.length : 0);
          setLastUpdated(latestUpdate);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching reviews:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup function
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up reviews listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const cleanup = fetchReviews();
    return cleanup;
  }, [clinicId, options?.source, options?.minRating, options?.limit]);

  return {
    reviews,
    loading,
    error,
    totalCount,
    averageRating,
    lastUpdated,
    refetch: fetchReviews
  };
}

// Hook for getting review stats without loading all reviews
export function useReviewStats(clinicId: string | undefined) {
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    sourceBreakdown: { google: 0, yelp: 0, healthgrades: 0, internal: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const reviewsRef = collection(db, 'clinics', clinicId, 'reviews');
    
    const unsubscribe = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const sources = { google: 0, yelp: 0, healthgrades: 0, internal: 0 };
        let totalRating = 0;

        snapshot.forEach((doc) => {
          const review = doc.data();
          const rating = Math.round(review.rating);
          
          if (rating >= 1 && rating <= 5) {
            distribution[rating as keyof typeof distribution]++;
          }
          
          if (review.source in sources) {
            sources[review.source as keyof typeof sources]++;
          }
          
          totalRating += review.rating;
        });

        setStats({
          totalReviews: snapshot.size,
          averageRating: snapshot.size > 0 ? totalRating / snapshot.size : 0,
          ratingDistribution: distribution,
          sourceBreakdown: sources
        });
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching review stats:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { stats, loading };
}