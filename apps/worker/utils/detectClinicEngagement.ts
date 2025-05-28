import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface ClinicEngagement {
  status: 'engaged' | 'low' | 'none';
  lastClick?: Date;
  lastCall?: Date;
  lastVisit?: Date;
  totalClicks30d: number;
  totalCalls30d: number;
  totalVisits30d: number;
  engagementScore: number; // 0-100
  lastUpdated: Date;
}

export interface EngagementDetectionResult {
  success: boolean;
  clinicId: string;
  engagement: ClinicEngagement;
  previousStatus?: string;
  statusChanged: boolean;
  error?: string;
}

/**
 * Detect and calculate clinic engagement metrics
 */
export async function detectClinicEngagement(
  clinicSlug: string
): Promise<EngagementDetectionResult> {
  try {
    console.log(`🔍 Detecting engagement for clinic: ${clinicSlug}`);
    
    // Get clinic document
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicSnap = await getDoc(clinicRef);
    
    if (!clinicSnap.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinicData = clinicSnap.data();
    const previousStatus = clinicData.engagement?.status;
    
    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Collect engagement metrics
    const metrics = await collectEngagementMetrics(clinicSlug, thirtyDaysAgo, ninetyDaysAgo);
    
    // Calculate engagement status
    const engagement = calculateEngagementStatus(metrics, now);
    
    // Update clinic document
    await updateDoc(clinicRef, {
      engagement: {
        ...engagement,
        lastUpdated: Timestamp.fromDate(engagement.lastUpdated)
      },
      'seoMeta.engagementLastScanned': Timestamp.fromDate(now)
    });
    
    const statusChanged = previousStatus !== engagement.status;
    
    console.log(`✅ Engagement detected for ${clinicSlug}: ${engagement.status} (score: ${engagement.engagementScore})`);
    
    return {
      success: true,
      clinicId: clinicSlug,
      engagement,
      previousStatus,
      statusChanged
    };
    
  } catch (error) {
    console.error(`❌ Failed to detect engagement for ${clinicSlug}:`, error);
    
    return {
      success: false,
      clinicId: clinicSlug,
      engagement: {
        status: 'none',
        totalClicks30d: 0,
        totalCalls30d: 0,
        totalVisits30d: 0,
        engagementScore: 0,
        lastUpdated: new Date()
      },
      previousStatus: undefined,
      statusChanged: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Collect engagement metrics from various sources
 */
async function collectEngagementMetrics(
  clinicSlug: string, 
  thirtyDaysAgo: Date, 
  ninetyDaysAgo: Date
) {
  const metrics = {
    clicks30d: 0,
    calls30d: 0,
    visits30d: 0,
    lastClick: null as Date | null,
    lastCall: null as Date | null,
    lastVisit: null as Date | null
  };
  
  try {
    // Get click/traffic data (mock for now - in real implementation, query analytics collections)
    const clicksQuery = query(
      collection(db, 'traffic_logs'),
      where('clinicId', '==', clinicSlug),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      where('type', '==', 'click'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    // Mock data generation for demo purposes
    metrics.clicks30d = Math.floor(Math.random() * 100);
    metrics.calls30d = Math.floor(Math.random() * 20);
    metrics.visits30d = Math.floor(Math.random() * 200);
    
    // Generate realistic last activity dates
    if (metrics.clicks30d > 0) {
      metrics.lastClick = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    }
    
    if (metrics.calls30d > 0) {
      metrics.lastCall = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    }
    
    if (metrics.visits30d > 0) {
      metrics.lastVisit = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    }
    
    // In a real implementation, you would:
    // 1. Query traffic_logs collection for clicks
    // 2. Query call_logs collection for calls  
    // 3. Query analytics for profile visits
    // 4. Get most recent timestamps
    
  } catch (error) {
    console.error('Error collecting engagement metrics:', error);
  }
  
  return metrics;
}

/**
 * Calculate engagement status based on metrics
 */
function calculateEngagementStatus(
  metrics: ReturnType<typeof collectEngagementMetrics> extends Promise<infer T> ? T : never,
  now: Date
): ClinicEngagement {
  const {
    clicks30d,
    calls30d,
    visits30d,
    lastClick,
    lastCall,
    lastVisit
  } = metrics;
  
  // Calculate engagement score (0-100)
  let score = 0;
  
  // Weight clicks (40% of score)
  score += Math.min(clicks30d * 0.4, 40);
  
  // Weight calls heavily (50% of score)
  score += Math.min(calls30d * 2.5, 50);
  
  // Weight visits (10% of score)
  score += Math.min(visits30d * 0.05, 10);
  
  // Determine status based on score and recency
  let status: 'engaged' | 'low' | 'none' = 'none';
  
  if (score >= 50 || (clicks30d >= 20 && calls30d >= 2)) {
    status = 'engaged';
  } else if (score >= 15 || clicks30d >= 5 || calls30d >= 1) {
    status = 'low';
  } else {
    status = 'none';
  }
  
  // Check recency - downgrade if no recent activity
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hasRecentActivity = (
    (lastClick && lastClick > sevenDaysAgo) ||
    (lastCall && lastCall > sevenDaysAgo) ||
    (lastVisit && lastVisit > sevenDaysAgo)
  );
  
  if (!hasRecentActivity && status === 'engaged') {
    status = 'low';
  }
  
  return {
    status,
    lastClick,
    lastCall,
    lastVisit,
    totalClicks30d: clicks30d,
    totalCalls30d: calls30d,
    totalVisits30d: visits30d,
    engagementScore: Math.round(score),
    lastUpdated: now
  };
}

/**
 * Batch process engagement detection for multiple clinics
 */
export async function batchDetectEngagement(
  clinicSlugs: string[],
  batchSize: number = 20
): Promise<EngagementDetectionResult[]> {
  const results: EngagementDetectionResult[] = [];
  
  console.log(`🚀 Starting batch engagement detection for ${clinicSlugs.length} clinics`);
  
  for (let i = 0; i < clinicSlugs.length; i += batchSize) {
    const batch = clinicSlugs.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clinicSlugs.length / batchSize)}`);
    
    const batchPromises = batch.map(slug => detectClinicEngagement(slug));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < clinicSlugs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const summary = {
    total: results.length,
    engaged: results.filter(r => r.engagement.status === 'engaged').length,
    low: results.filter(r => r.engagement.status === 'low').length,
    none: results.filter(r => r.engagement.status === 'none').length,
    errors: results.filter(r => !r.success).length
  };
  
  console.log(`✅ Batch engagement detection complete:`, summary);
  
  return results;
}

/**
 * Get engagement status for a single clinic
 */
export async function getClinicEngagement(clinicSlug: string): Promise<ClinicEngagement | null> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicSnap = await getDoc(clinicRef);
    
    if (!clinicSnap.exists()) {
      return null;
    }
    
    const clinicData = clinicSnap.data();
    return clinicData.engagement || null;
    
  } catch (error) {
    console.error(`Error getting engagement for ${clinicSlug}:`, error);
    return null;
  }
}