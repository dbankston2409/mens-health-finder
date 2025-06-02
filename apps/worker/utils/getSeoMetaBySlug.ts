import admin from '../lib/firebase';
import { SeoMeta, ClinicDocument } from '../types/clinic';

export interface SeoData {
  seoMeta: SeoMeta | null;
  seoContent: string | null;
  slug: string;
  exists: boolean;
}

export async function getSeoMetaBySlug(slug: string): Promise<SeoData> {
  try {
    const db = admin.firestore();
    const clinicDoc = await db.collection('clinics').doc(slug).get();
    
    if (!clinicDoc.exists) {
      return {
        seoMeta: null,
        seoContent: null,
        slug,
        exists: false
      };
    }
    
    const data = clinicDoc.data() as ClinicDocument;
    
    return {
      seoMeta: data.seoMeta || null,
      seoContent: data.seoContent || null,
      slug,
      exists: true
    };
    
  } catch (error) {
    console.error(`Error fetching SEO data for slug ${slug}:`, error);
    return {
      seoMeta: null,
      seoContent: null,
      slug,
      exists: false
    };
  }
}

export async function getSeoMetaByMultipleSlugs(slugs: string[]): Promise<SeoData[]> {
  const db = admin.firestore();
  const results: SeoData[] = [];
  
  // Firestore batched reads (up to 10 at a time)
  const batchSize = 10;
  
  for (let i = 0; i < slugs.length; i += batchSize) {
    const batch = slugs.slice(i, i + batchSize);
    
    try {
      const promises = batch.map(slug => 
        db.collection('clinics').doc(slug).get()
      );
      
      const docs = await Promise.all(promises);
      
      docs.forEach((doc, index) => {
        const slug = batch[index];
        
        if (doc.exists) {
          const data = doc.data() as ClinicDocument;
          results.push({
            seoMeta: data.seoMeta || null,
            seoContent: data.seoContent || null,
            slug,
            exists: true
          });
        } else {
          results.push({
            seoMeta: null,
            seoContent: null,
            slug,
            exists: false
          });
        }
      });
      
    } catch (error) {
      console.error(`Error fetching batch SEO data:`, error);
      
      // Add error results for this batch
      batch.forEach(slug => {
        results.push({
          seoMeta: null,
          seoContent: null,
          slug,
          exists: false
        });
      });
    }
  }
  
  return results;
}

export async function getAllClinicsNeedingSeo(): Promise<string[]> {
  try {
    const db = admin.firestore();
    const clinicsRef = db.collection('clinics');
    
    // Query for clinics that either don't have SEO data or have outdated data
    const snapshot = await clinicsRef
      .where('status', '==', 'active')
      .get();
    
    const slugsNeedingSeo: string[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    snapshot.forEach(doc => {
      const data = doc.data() as ClinicDocument;
      const seoMeta = data.seoMeta;
      
      // Check if SEO data is missing or outdated
      const needsSeo = !seoMeta || 
                      !seoMeta.title || 
                      !seoMeta.description || 
                      !data.seoContent ||
                      !seoMeta.lastGenerated ||
                      (seoMeta.lastGenerated instanceof Date && seoMeta.lastGenerated < thirtyDaysAgo);
      
      if (needsSeo) {
        slugsNeedingSeo.push(data.slug);
      }
    });
    
    console.log(`Found ${slugsNeedingSeo.length} clinics needing SEO updates`);
    return slugsNeedingSeo;
    
  } catch (error) {
    console.error('Error finding clinics needing SEO:', error);
    return [];
  }
}

export async function getSeoStats(): Promise<{
  total: number;
  withSeoMeta: number;
  withSeoContent: number;
  complete: number;
  needsUpdate: number;
  indexed: number;
}> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('clinics').get();
    
    const stats = {
      total: 0,
      withSeoMeta: 0,
      withSeoContent: 0,
      complete: 0,
      needsUpdate: 0,
      indexed: 0
    };
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    snapshot.forEach(doc => {
      const data = doc.data() as ClinicDocument;
      stats.total++;
      
      const hasSeoMeta = !!(data.seoMeta?.title && data.seoMeta?.description);
      const hasSeoContent = !!(data.seoContent && data.seoContent.trim() !== '');
      
      if (hasSeoMeta) stats.withSeoMeta++;
      if (hasSeoContent) stats.withSeoContent++;
      if (hasSeoMeta && hasSeoContent) stats.complete++;
      
      if (data.seoMeta?.indexed) stats.indexed++;
      
      // Check if needs update
      const isOld = !data.seoMeta?.lastGenerated || 
                   (data.seoMeta.lastGenerated instanceof Date && data.seoMeta.lastGenerated < thirtyDaysAgo);
      
      if (!hasSeoMeta || !hasSeoContent || isOld) {
        stats.needsUpdate++;
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting SEO stats:', error);
    return {
      total: 0,
      withSeoMeta: 0,
      withSeoContent: 0,
      complete: 0,
      needsUpdate: 0,
      indexed: 0
    };
  }
}