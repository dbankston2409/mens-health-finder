import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface IndexingMetrics {
  clicks: number;
  ctr: number;
  queries: string[];
  impressions?: number;
  position?: number;
}

interface ClinicIndexStatus {
  slug: string;
  name: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  indexed: boolean;
  lastIndexed?: Date;
  indexingMetrics?: IndexingMetrics;
  tier?: string;
}

interface FilterOptions {
  city?: string;
  state?: string;
  tier?: string;
  indexed?: boolean;
}

interface UseSeoIndexStatusResult {
  clinics: ClinicIndexStatus[];
  loading: boolean;
  error: string | null;
  summary: {
    total: number;
    indexed: number;
    notIndexed: number;
    totalClicks: number;
    avgCTR: number;
    topQueries: string[];
  };
  refresh: () => Promise<void>;
}

export function useSeoIndexStatus(filters?: FilterOptions): UseSeoIndexStatusResult {
  const [clinics, setClinics] = useState<ClinicIndexStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    indexed: 0,
    notIndexed: 0,
    totalClicks: 0,
    avgCTR: 0,
    topQueries: [] as string[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicsRef = collection(db, 'clinics');
      let clinicsQuery = query(clinicsRef, where('status', '==', 'active'));

      // Apply filters
      if (filters?.city) {
        clinicsQuery = query(clinicsQuery, where('city', '==', filters.city));
      }
      if (filters?.state) {
        clinicsQuery = query(clinicsQuery, where('state', '==', filters.state));
      }
      if (filters?.tier) {
        clinicsQuery = query(clinicsQuery, where('tier', '==', filters.tier));
      }

      const snapshot = await getDocs(clinicsQuery);
      const clinicData: ClinicIndexStatus[] = [];
      
      let totalClicks = 0;
      let totalCTR = 0;
      let ctrCount = 0;
      const allQueries: string[] = [];
      let indexedCount = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const seoMeta = data.seoMeta;
        
        // Apply indexed filter if specified
        if (filters?.indexed !== undefined && !!seoMeta?.indexed !== filters.indexed) {
          return;
        }
        
        const clinic: ClinicIndexStatus = {
          slug: doc.id,
          name: data.name || 'Unknown Clinic',
          city: data.city || '',
          state: data.state || '',
          lat: data.coordinates?.lat,
          lng: data.coordinates?.lng,
          indexed: !!seoMeta?.indexed,
          lastIndexed: seoMeta?.lastIndexed?.toDate(),
          indexingMetrics: seoMeta?.indexingMetrics,
          tier: data.tier
        };
        
        clinicData.push(clinic);
        
        if (clinic.indexed) {
          indexedCount++;
          
          if (clinic.indexingMetrics) {
            totalClicks += clinic.indexingMetrics.clicks || 0;
            if (clinic.indexingMetrics.ctr) {
              totalCTR += clinic.indexingMetrics.ctr;
              ctrCount++;
            }
            if (clinic.indexingMetrics.queries) {
              allQueries.push(...clinic.indexingMetrics.queries);
            }
          }
        }
      });
      
      // Calculate top queries
      const queryCount: { [query: string]: number } = {};
      allQueries.forEach(query => {
        queryCount[query] = (queryCount[query] || 0) + 1;
      });
      
      const topQueries = Object.entries(queryCount)
        .sort(([a], [b]) => b - a)
        .slice(0, 10)
        .map(([query]) => query);
      
      setClinics(clinicData);
      setSummary({
        total: clinicData.length,
        indexed: indexedCount,
        notIndexed: clinicData.length - indexedCount,
        totalClicks,
        avgCTR: ctrCount > 0 ? totalCTR / ctrCount : 0,
        topQueries
      });
      
    } catch (err) {
      console.error('Error fetching SEO index status:', err);
      setError('Failed to load SEO index status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters?.city, filters?.state, filters?.tier, filters?.indexed]);

  return {
    clinics,
    loading,
    error,
    summary,
    refresh: fetchData
  };
}

export function useAdminSeoStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsRef = doc(db, 'adminStats', 'seo');
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        const data = statsSnap.data();
        setStats({
          ...data,
          lastPingTime: data.lastPingTime?.toDate(),
          lastIndexCheck: data.lastIndexCheck?.toDate(),
          lastUpdated: data.lastUpdated?.toDate()
        });
      } else {
        setStats({});
      }
    } catch (err) {
      console.error('Error fetching admin SEO stats:', err);
      setError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}

export function useRecentlyIndexed(limit = 10) {
  const [recentClinics, setRecentClinics] = useState<ClinicIndexStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentlyIndexed = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicsRef = collection(db, 'clinics');
        const activeQuery = query(
          clinicsRef, 
          where('status', '==', 'active'),
          where('seoMeta.indexed', '==', true)
        );
        
        const snapshot = await getDocs(activeQuery);
        const clinicData: ClinicIndexStatus[] = [];

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const seoMeta = data.seoMeta;
          
          if (seoMeta?.lastIndexed) {
            clinicData.push({
              slug: doc.id,
              name: data.name || 'Unknown Clinic',
              city: data.city || '',
              state: data.state || '',
              indexed: true,
              lastIndexed: seoMeta.lastIndexed.toDate(),
              indexingMetrics: seoMeta.indexingMetrics
            });
          }
        });
        
        // Sort by lastIndexed date (most recent first)
        clinicData.sort((a, b) => {
          if (!a.lastIndexed || !b.lastIndexed) return 0;
          return b.lastIndexed.getTime() - a.lastIndexed.getTime();
        });
        
        setRecentClinics(clinicData.slice(0, limit));
        
      } catch (err) {
        console.error('Error fetching recently indexed clinics:', err);
        setError('Failed to load recently indexed clinics');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyIndexed();
  }, [limit]);

  return { recentClinics, loading, error };
}