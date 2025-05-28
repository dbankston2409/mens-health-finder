import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { batchCheckIndexStatus } from '../utils/trackSeoIndexStatus';
import { updateAdminStats } from '../utils/adminStatsUpdater';

interface IndexingJobResult {
  processed: number;
  indexed: number;
  failed: number;
  stats: {
    mostCommonQuery: string;
    mostIndexedState: string;
    avgCTR: number;
    totalClicks: number;
  };
  duration: number;
}

export async function seoIndexingJob(useMockData = true): Promise<IndexingJobResult> {
  const startTime = Date.now();
  console.log('🔍 Starting SEO indexing job...');
  
  try {
    // Get all active clinics
    const clinicsRef = collection(db, 'clinics');
    const activeQuery = query(clinicsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(activeQuery);
    
    const clinicSlugs = snapshot.docs.map(doc => doc.id);
    console.log(`📊 Found ${clinicSlugs.length} active clinics to check`);
    
    if (clinicSlugs.length === 0) {
      return {
        processed: 0,
        indexed: 0,
        failed: 0,
        stats: {
          mostCommonQuery: '',
          mostIndexedState: '',
          avgCTR: 0,
          totalClicks: 0
        },
        duration: Date.now() - startTime
      };
    }
    
    // Process in batches of 50 to avoid overwhelming the system
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < clinicSlugs.length; i += batchSize) {
      batches.push(clinicSlugs.slice(i, i + batchSize));
    }
    
    let totalProcessed = 0;
    let totalIndexed = 0;
    let totalFailed = 0;
    const allResults: any[] = [];
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} clinics)`);
      
      const batchResult = await batchCheckIndexStatus(batch, useMockData);
      
      totalProcessed += batchResult.processed;
      totalIndexed += batchResult.indexed;
      totalFailed += batchResult.failed;
      
      // Collect results for statistics
      Object.entries(batchResult.results).forEach(([slug, status]) => {
        if (status.indexed && status.indexingMetrics) {
          allResults.push({
            slug,
            ...status.indexingMetrics
          });
        }
      });
      
      // Small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Calculate aggregated statistics
    const stats = calculateStats(allResults, snapshot.docs.map(doc => doc.data()));
    
    // Update admin stats
    await updateAdminStats({
      totalIndexed,
      totalUnindexed: totalProcessed - totalIndexed,
      lastIndexCheck: new Date(),
      indexingStats: stats
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ SEO indexing job completed');
    console.log(`📊 Results: ${totalIndexed}/${totalProcessed} indexed, ${totalFailed} failed`);
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(1)}s`);
    
    return {
      processed: totalProcessed,
      indexed: totalIndexed,
      failed: totalFailed,
      stats,
      duration
    };
    
  } catch (error) {
    console.error('❌ SEO indexing job failed:', error);
    throw error;
  }
}

function calculateStats(results: any[], clinics: any[]) {
  if (results.length === 0) {
    return {
      mostCommonQuery: '',
      mostIndexedState: '',
      avgCTR: 0,
      totalClicks: 0
    };
  }
  
  // Count queries
  const queryCount: { [query: string]: number } = {};
  const stateCount: { [state: string]: number } = {};
  let totalCTR = 0;
  let totalClicks = 0;
  
  results.forEach(result => {
    if (result.queries) {
      result.queries.forEach((query: string) => {
        queryCount[query] = (queryCount[query] || 0) + 1;
      });
    }
    
    totalCTR += result.ctr || 0;
    totalClicks += result.clicks || 0;
  });
  
  // Count states from clinic data
  clinics.forEach(clinic => {
    if (clinic.state) {
      stateCount[clinic.state] = (stateCount[clinic.state] || 0) + 1;
    }
  });
  
  // Find most common query
  const mostCommonQuery = Object.entries(queryCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  
  // Find most indexed state
  const mostIndexedState = Object.entries(stateCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  
  return {
    mostCommonQuery,
    mostIndexedState,
    avgCTR: results.length > 0 ? totalCTR / results.length : 0,
    totalClicks
  };
}

export async function quickIndexCheck(limit = 20): Promise<{
  sampleSize: number;
  indexed: number;
  avgResponseTime: number;
}> {
  console.log(`🔍 Quick index check (sample size: ${limit})`);
  
  try {
    const clinicsRef = collection(db, 'clinics');
    const activeQuery = query(clinicsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(activeQuery);
    
    const sampleSlugs = snapshot.docs
      .slice(0, limit)
      .map(doc => doc.id);
    
    const startTime = Date.now();
    const result = await batchCheckIndexStatus(sampleSlugs, true);
    const avgResponseTime = (Date.now() - startTime) / sampleSlugs.length;
    
    return {
      sampleSize: result.processed,
      indexed: result.indexed,
      avgResponseTime
    };
    
  } catch (error) {
    console.error('Quick index check failed:', error);
    throw error;
  }
}