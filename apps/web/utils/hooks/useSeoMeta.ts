import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SeoMeta } from '../../../worker/types/clinic';

interface UseSeoMetaResult {
  seoMeta: SeoMeta | null;
  loading: boolean;
  error: string | null;
}

export function useSeoMeta(clinicSlug: string): UseSeoMetaResult {
  const [seoMeta, setSeoMeta] = useState<SeoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicSlug) {
      setLoading(false);
      return;
    }

    const fetchSeoMeta = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicRef = doc(db, 'clinics', clinicSlug);
        const clinicSnap = await getDoc(clinicRef);

        if (clinicSnap.exists()) {
          const clinicData = clinicSnap.data();
          if (clinicData.seoMeta) {
            setSeoMeta(clinicData.seoMeta);
          } else {
            setError('SEO metadata not available for this clinic');
          }
        } else {
          setError('Clinic not found');
        }
      } catch (err) {
        console.error('Error fetching SEO metadata:', err);
        setError('Failed to load SEO metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchSeoMeta();
  }, [clinicSlug]);

  return { seoMeta, loading, error };
}

export function useBatchSeoMeta(clinicSlugs: string[]) {
  const [seoMetas, setSeoMetas] = useState<Record<string, SeoMeta>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicSlugs.length) {
      setLoading(false);
      return;
    }

    const fetchBatchSeoMeta = async () => {
      try {
        setLoading(true);
        setError(null);

        const results: Record<string, SeoMeta> = {};
        
        // Batch fetch in chunks of 10 to avoid Firestore limits
        const chunks = [];
        for (let i = 0; i < clinicSlugs.length; i += 10) {
          chunks.push(clinicSlugs.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const promises = chunk.map(async (slug) => {
            const clinicRef = doc(db, 'clinics', slug);
            const clinicSnap = await getDoc(clinicRef);
            
            if (clinicSnap.exists()) {
              const clinicData = clinicSnap.data();
              if (clinicData.seoMeta) {
                results[slug] = clinicData.seoMeta;
              }
            }
          });

          await Promise.all(promises);
        }

        setSeoMetas(results);
      } catch (err) {
        console.error('Error fetching batch SEO metadata:', err);
        setError('Failed to load SEO metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchSeoMeta();
  }, [clinicSlugs.join(',')]);

  return { seoMetas, loading, error };
}