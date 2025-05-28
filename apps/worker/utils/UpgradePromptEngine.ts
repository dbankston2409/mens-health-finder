import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getClinicEngagement, ClinicEngagement } from './detectClinicEngagement';

export interface UpgradePrompt {
  reason: string;
  callToAction: string;
  timestamp: Date;
  type: 'engagement' | 'performance' | 'feature';
  priority: 'high' | 'medium' | 'low';
  packageRecommendation: string;
  expectedRevenue?: number;
}

export interface UpgradePromptResult {
  success: boolean;
  clinicId: string;
  prompt?: UpgradePrompt;
  shouldPrompt: boolean;
  error?: string;
}

/**
 * Analyze clinic and generate upgrade prompts
 */
export async function generateUpgradePrompt(
  clinicSlug: string
): Promise<UpgradePromptResult> {
  try {
    console.log(`💰 Analyzing upgrade opportunity for clinic: ${clinicSlug}`);
    
    // Get clinic data
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicSnap = await getDoc(clinicRef);
    
    if (!clinicSnap.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinicData = clinicSnap.data();
    const currentPackage = clinicData.package || 'free';
    
    // Get engagement data
    const engagement = await getClinicEngagement(clinicSlug);
    
    if (!engagement) {
      return {
        success: true,
        clinicId: clinicSlug,
        shouldPrompt: false
      };
    }
    
    // Analyze upgrade opportunities
    const upgradeAnalysis = analyzeUpgradeOpportunity(clinicData, engagement, currentPackage);
    
    if (upgradeAnalysis.shouldPrompt) {
      const prompt: UpgradePrompt = {
        reason: upgradeAnalysis.reason,
        callToAction: upgradeAnalysis.callToAction,
        timestamp: new Date(),
        type: upgradeAnalysis.type,
        priority: upgradeAnalysis.priority,
        packageRecommendation: upgradeAnalysis.packageRecommendation,
        expectedRevenue: upgradeAnalysis.expectedRevenue
      };
      
      // Save upgrade prompt to clinic
      await updateDoc(clinicRef, {
        upgradePrompt: {
          ...prompt,
          timestamp: Timestamp.fromDate(prompt.timestamp)
        },
        'seoMeta.upgradePromptLastGenerated': Timestamp.fromDate(new Date())
      });
      
      console.log(`✅ Upgrade prompt generated for ${clinicSlug}: ${prompt.type} - ${prompt.priority}`);
      
      return {
        success: true,
        clinicId: clinicSlug,
        prompt,
        shouldPrompt: true
      };
    } else {
      // Clear existing upgrade prompt if no longer relevant
      await updateDoc(clinicRef, {
        upgradePrompt: null,
        'seoMeta.upgradePromptLastGenerated': Timestamp.fromDate(new Date())
      });
      
      return {
        success: true,
        clinicId: clinicSlug,
        shouldPrompt: false
      };
    }
    
  } catch (error) {
    console.error(`❌ Failed to generate upgrade prompt for ${clinicSlug}:`, error);
    
    return {
      success: false,
      clinicId: clinicSlug,
      shouldPrompt: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze if clinic should receive upgrade prompt
 */
function analyzeUpgradeOpportunity(
  clinicData: any,
  engagement: ClinicEngagement,
  currentPackage: string
) {
  const { status, totalClicks30d, totalCalls30d, engagementScore } = engagement;
  
  // High engagement free/basic clinic
  if ((currentPackage === 'free' || currentPackage === 'basic') && status === 'engaged') {
    if (totalClicks30d >= 50 || totalCalls30d >= 5) {
      return {
        shouldPrompt: true,
        type: 'engagement' as const,
        priority: 'high' as const,
        reason: `This clinic is getting ${totalClicks30d} clicks/month and ${totalCalls30d} calls — high engagement shows potential for growth`,
        callToAction: 'Unlock call tracking and advanced analytics to capture more leads',
        packageRecommendation: 'premium',
        expectedRevenue: estimateRevenueOpportunity(totalClicks30d, totalCalls30d)
      };
    }
    
    if (totalClicks30d >= 20) {
      return {
        shouldPrompt: true,
        type: 'engagement' as const,
        priority: 'medium' as const,
        reason: `This clinic is getting ${totalClicks30d} clicks/month — good engagement shows growth potential`,
        callToAction: 'Add call tracking to start capturing phone leads',
        packageRecommendation: 'basic',
        expectedRevenue: estimateRevenueOpportunity(totalClicks30d, totalCalls30d)
      };
    }
  }
  
  // Low-performing paid listing
  if ((currentPackage === 'basic' || currentPackage === 'premium') && status === 'none') {
    return {
      shouldPrompt: true,
      type: 'performance' as const,
      priority: 'medium' as const,
      reason: `This paid clinic has very low engagement (${totalClicks30d} clicks, ${totalCalls30d} calls in 30 days)`,
      callToAction: 'Review SEO optimization or consider downgrading package',
      packageRecommendation: 'review',
      expectedRevenue: undefined
    };
  }
  
  // Missing features for engaged clinic
  if (currentPackage === 'basic' && status === 'engaged' && !clinicData.callTrackingNumber) {
    return {
      shouldPrompt: true,
      type: 'feature' as const,
      priority: 'medium' as const,
      reason: `Clinic has ${totalClicks30d} monthly clicks but no call tracking — missing valuable lead data`,
      callToAction: 'Upgrade to premium for call tracking and detailed analytics',
      packageRecommendation: 'premium',
      expectedRevenue: estimateRevenueOpportunity(totalClicks30d, totalCalls30d)
    };
  }
  
  // No upgrade opportunity
  return {
    shouldPrompt: false,
    type: null,
    priority: null,
    reason: '',
    callToAction: '',
    packageRecommendation: '',
    expectedRevenue: undefined
  };
}

/**
 * Estimate potential revenue opportunity
 */
function estimateRevenueOpportunity(clicks30d: number, calls30d: number): number {
  // Simple revenue estimation model
  // Assumes:
  // - $200 average patient value
  // - 2% click-to-patient conversion
  // - 20% call-to-patient conversion
  
  const avgPatientValue = 200;
  const clickConversionRate = 0.02;
  const callConversionRate = 0.20;
  
  const patientsFromClicks = clicks30d * clickConversionRate;
  const patientsFromCalls = calls30d * callConversionRate;
  
  const monthlyRevenue = (patientsFromClicks + patientsFromCalls) * avgPatientValue;
  
  return Math.round(monthlyRevenue);
}

/**
 * Batch generate upgrade prompts for multiple clinics
 */
export async function batchGenerateUpgradePrompts(
  clinicSlugs: string[],
  batchSize: number = 20
): Promise<UpgradePromptResult[]> {
  const results: UpgradePromptResult[] = [];
  
  console.log(`🚀 Starting batch upgrade prompt generation for ${clinicSlugs.length} clinics`);
  
  for (let i = 0; i < clinicSlugs.length; i += batchSize) {
    const batch = clinicSlugs.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clinicSlugs.length / batchSize)}`);
    
    const batchPromises = batch.map(slug => generateUpgradePrompt(slug));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < clinicSlugs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const summary = {
    total: results.length,
    prompted: results.filter(r => r.shouldPrompt).length,
    highPriority: results.filter(r => r.prompt?.priority === 'high').length,
    mediumPriority: results.filter(r => r.prompt?.priority === 'medium').length,
    lowPriority: results.filter(r => r.prompt?.priority === 'low').length,
    errors: results.filter(r => !r.success).length
  };
  
  console.log(`✅ Batch upgrade prompt generation complete:`, summary);
  
  return results;
}

/**
 * Get upgrade prompt for a clinic
 */
export async function getUpgradePrompt(clinicSlug: string): Promise<UpgradePrompt | null> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicSnap = await getDoc(clinicRef);
    
    if (!clinicSnap.exists()) {
      return null;
    }
    
    const clinicData = clinicSnap.data();
    const prompt = clinicData.upgradePrompt;
    
    if (!prompt) {
      return null;
    }
    
    // Convert Firestore timestamp to Date
    return {
      ...prompt,
      timestamp: prompt.timestamp?.toDate() || new Date()
    };
    
  } catch (error) {
    console.error(`Error getting upgrade prompt for ${clinicSlug}:`, error);
    return null;
  }
}

/**
 * Clear upgrade prompt for a clinic
 */
export async function clearUpgradePrompt(clinicSlug: string): Promise<boolean> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    await updateDoc(clinicRef, {
      upgradePrompt: null,
      'seoMeta.upgradePromptCleared': Timestamp.fromDate(new Date())
    });
    
    console.log(`✅ Upgrade prompt cleared for ${clinicSlug}`);
    return true;
    
  } catch (error) {
    console.error(`Error clearing upgrade prompt for ${clinicSlug}:`, error);
    return false;
  }
}