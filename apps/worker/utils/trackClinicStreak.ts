import admin from '../lib/firebase';

export interface ClinicStreak {
  type: string;
  name: string;
  description: string;
  count: number;
  active: boolean;
  lastUpdated: Date;
  startedAt: Date;
  bestCount?: number;
  totalEarned?: number;
}

export interface StreakDefinition {
  type: string;
  name: string;
  description: string;
  checkFunction: (clinicSlug: string, lastCheck: Date) => Promise<boolean>;
  resetOnMiss: boolean;
  maxCount?: number;
  rewards?: Array<{ count: number; badge: string; points: number }>;
}

// Define all available streaks
const STREAK_DEFINITIONS: StreakDefinition[] = [
  {
    type: 'profile_updates',
    name: 'Profile Perfectionist',
    description: 'Update your profile information daily',
    checkFunction: async (clinicSlug: string, lastCheck: Date) => {
      const db = admin.firestore();
      const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
      const clinic = clinicDoc.data();
      
      if (!clinic) return false;
      
      // Check if profile was updated since last check
      const lastUpdate = clinic.updatedAt?.toDate() || new Date(0);
      return lastUpdate > lastCheck;
    },
    resetOnMiss: true,
    maxCount: 365,
    rewards: [
      { count: 3, badge: 'Profile Starter', points: 50 },
      { count: 7, badge: 'Weekly Updater', points: 100 },
      { count: 30, badge: 'Monthly Master', points: 300 },
      { count: 90, badge: 'Profile Pro', points: 500 }
    ]
  },

  {
    type: 'seo_indexed',
    name: 'SEO Consistency',
    description: 'Keep your clinic indexed in search engines',
    checkFunction: async (clinicSlug: string, lastCheck: Date) => {
      const db = admin.firestore();
      const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
      const clinic = clinicDoc.data();
      
      return clinic?.seoMeta?.indexed === true;
    },
    resetOnMiss: false, // Don't reset if temporarily not indexed
    maxCount: 365,
    rewards: [
      { count: 7, badge: 'Search Visible', points: 100 },
      { count: 30, badge: 'SEO Steady', points: 200 },
      { count: 90, badge: 'Index Champion', points: 500 }
    ]
  },

  {
    type: 'reviews_collected',
    name: 'Review Collector',
    description: 'Collect patient reviews regularly',
    checkFunction: async (clinicSlug: string, lastCheck: Date) => {
      const db = admin.firestore();
      
      // Check if any reviews were collected since last check
      const reviewsQuery = await db
        .collection('reviews')
        .where('clinicSlug', '==', clinicSlug)
        .where('createdAt', '>=', lastCheck)
        .limit(1)
        .get();
      
      return !reviewsQuery.empty;
    },
    resetOnMiss: true,
    maxCount: 52, // Weekly for a year
    rewards: [
      { count: 2, badge: 'Review Starter', points: 100 },
      { count: 4, badge: 'Feedback Collector', points: 200 },
      { count: 8, badge: 'Review Master', points: 400 }
    ]
  },

  {
    type: 'content_freshness',
    name: 'Content Creator',
    description: 'Update your content regularly',
    checkFunction: async (clinicSlug: string, lastCheck: Date) => {
      const db = admin.firestore();
      const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
      const clinic = clinicDoc.data();
      
      if (!clinic?.seoContent) return false;
      
      // Check if content was updated in the last week
      const contentUpdate = clinic.updatedAt?.toDate() || new Date(0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return contentUpdate > weekAgo;
    },
    resetOnMiss: true,
    maxCount: 52,
    rewards: [
      { count: 2, badge: 'Content Starter', points: 75 },
      { count: 4, badge: 'Content Creator', points: 150 },
      { count: 12, badge: 'Content Master', points: 300 }
    ]
  },

  {
    type: 'engagement_boost',
    name: 'Engagement Expert',
    description: 'Maintain high engagement (calls + clicks) weekly',
    checkFunction: async (clinicSlug: string, lastCheck: Date) => {
      const db = admin.firestore();
      
      // Get engagement logs for the past week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const engagementQuery = await db
        .collection('clinics')
        .doc(clinicSlug)
        .collection('engagement_logs')
        .where('timestamp', '>=', weekAgo)
        .get();
      
      const totalEngagement = engagementQuery.size;
      return totalEngagement >= 5; // At least 5 engagement actions per week
    },
    resetOnMiss: true,
    maxCount: 52,
    rewards: [
      { count: 2, badge: 'Engagement Starter', points: 100 },
      { count: 4, badge: 'Popular Clinic', points: 200 },
      { count: 8, badge: 'Engagement Expert', points: 400 }
    ]
  },

  {
    type: 'seo_score_high',
    name: 'SEO Excellence',
    description: 'Maintain SEO score above 80',
    checkFunction: async (clinicSlug: string, lastCheck: Date) => {
      const seoScore = await calculateSeoScore(clinicSlug);
      return seoScore >= 80;
    },
    resetOnMiss: false, // Don't immediately reset if score drops temporarily
    maxCount: 365,
    rewards: [
      { count: 7, badge: 'SEO Strong', points: 150 },
      { count: 30, badge: 'SEO Expert', points: 300 },
      { count: 90, badge: 'SEO Legend', points: 600 }
    ]
  }
];

export async function trackClinicStreak(clinicSlug: string, streakType?: string): Promise<void> {
  console.log(`🔥 Tracking streaks for clinic: ${clinicSlug}${streakType ? ` (${streakType})` : ''}`);
  
  const db = admin.firestore();
  
  try {
    // Get clinic document
    const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
    if (!clinicDoc.exists) {
      console.warn(`⚠️  Clinic not found: ${clinicSlug}`);
      return;
    }
    
    const clinic = clinicDoc.data()!;
    const currentStreaks = clinic.streaks || [];
    
    // Filter streak definitions to check
    const streaksToCheck = streakType 
      ? STREAK_DEFINITIONS.filter(def => def.type === streakType)
      : STREAK_DEFINITIONS;
    
    const updatedStreaks: ClinicStreak[] = [];
    const earnedRewards: any[] = [];
    
    // Process each streak type
    for (const streakDef of streaksToCheck) {
      try {
        const result = await processStreak(clinicSlug, streakDef, currentStreaks);
        updatedStreaks.push(result.streak);
        
        if (result.newRewards.length > 0) {
          earnedRewards.push(...result.newRewards);
        }
        
      } catch (error) {
        console.error(`❌ Error processing streak ${streakDef.type}:`, error);
        // Continue with other streaks even if one fails
      }
    }
    
    // Merge with existing streaks (for types we didn't check)
    const finalStreaks = mergeStreaks(currentStreaks, updatedStreaks);
    
    // Update clinic document
    await db.collection('clinics').doc(clinicSlug).update({
      streaks: finalStreaks,
      updatedAt: new Date()
    });
    
    // Process any earned rewards
    if (earnedRewards.length > 0) {
      await processEarnedRewards(clinicSlug, earnedRewards);
    }
    
    console.log(`✅ Streak tracking completed for ${clinicSlug}: ${updatedStreaks.length} streaks updated, ${earnedRewards.length} rewards earned`);
    
  } catch (error) {
    console.error(`❌ Streak tracking failed for ${clinicSlug}:`, error);
    throw error;
  }
}

export async function trackAllClinicStreaks(): Promise<void> {
  console.log('🔄 Running streak tracking for all clinics...');
  
  const db = admin.firestore();
  
  try {
    // Get all active clinics
    const clinicsSnapshot = await db
      .collection('clinics')
      .where('status', '==', 'active')
      .get();
    
    console.log(`📋 Tracking streaks for ${clinicsSnapshot.size} clinics`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    // Process clinics in batches
    const batchSize = 10;
    const clinics = clinicsSnapshot.docs.map(doc => doc.id);
    
    for (let i = 0; i < clinics.length; i += batchSize) {
      const batch = clinics.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (clinicSlug) => {
          try {
            await trackClinicStreak(clinicSlug);
            processedCount++;
          } catch (error) {
            console.error(`❌ Failed to track streaks for ${clinicSlug}:`, error);
            errorCount++;
          }
        })
      );
      
      // Add delay between batches
      if (i + batchSize < clinics.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Streak tracking completed: ${processedCount} processed, ${errorCount} errors`);
    
    // Log summary
    await logStreakSummary({
      totalClinics: clinics.length,
      processedCount,
      errorCount,
      completedAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ Bulk streak tracking failed:', error);
    throw error;
  }
}

async function processStreak(
  clinicSlug: string, 
  streakDef: StreakDefinition, 
  currentStreaks: ClinicStreak[]
): Promise<{ streak: ClinicStreak; newRewards: any[] }> {
  
  const now = new Date();
  const existingStreak = currentStreaks.find(s => s.type === streakDef.type);
  
  // Get last check time (yesterday for daily streaks, last week for weekly)
  const lastCheck = existingStreak?.lastUpdated || new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Check if the streak condition is met
  const conditionMet = await streakDef.checkFunction(clinicSlug, lastCheck);
  
  let updatedStreak: ClinicStreak;
  const newRewards: any[] = [];
  
  if (existingStreak) {
    // Update existing streak
    if (conditionMet) {
      // Condition met - increment or maintain streak
      const newCount = Math.min(
        existingStreak.count + 1, 
        streakDef.maxCount || Number.MAX_SAFE_INTEGER
      );
      
      updatedStreak = {
        ...existingStreak,
        count: newCount,
        active: true,
        lastUpdated: now,
        bestCount: Math.max(existingStreak.bestCount || 0, newCount),
        totalEarned: (existingStreak.totalEarned || 0) + 1
      };
      
      // Check for rewards
      if (streakDef.rewards) {
        const earnedReward = streakDef.rewards.find(r => r.count === newCount);
        if (earnedReward) {
          newRewards.push({
            type: 'streak_badge',
            streakType: streakDef.type,
            badge: earnedReward.badge,
            points: earnedReward.points,
            count: newCount
          });
        }
      }
      
    } else {
      // Condition not met
      if (streakDef.resetOnMiss) {
        // Reset streak
        updatedStreak = {
          ...existingStreak,
          count: 0,
          active: false,
          lastUpdated: now
        };
      } else {
        // Just mark as inactive but don't reset count
        updatedStreak = {
          ...existingStreak,
          active: false,
          lastUpdated: now
        };
      }
    }
    
  } else {
    // Create new streak
    updatedStreak = {
      type: streakDef.type,
      name: streakDef.name,
      description: streakDef.description,
      count: conditionMet ? 1 : 0,
      active: conditionMet,
      lastUpdated: now,
      startedAt: now,
      bestCount: conditionMet ? 1 : 0,
      totalEarned: conditionMet ? 1 : 0
    };
    
    // Check for first-day reward
    if (conditionMet && streakDef.rewards) {
      const firstReward = streakDef.rewards.find(r => r.count === 1);
      if (firstReward) {
        newRewards.push({
          type: 'streak_badge',
          streakType: streakDef.type,
          badge: firstReward.badge,
          points: firstReward.points,
          count: 1
        });
      }
    }
  }
  
  return { streak: updatedStreak, newRewards };
}

function mergeStreaks(currentStreaks: ClinicStreak[], updatedStreaks: ClinicStreak[]): ClinicStreak[] {
  const updatedTypes = new Set(updatedStreaks.map(s => s.type));
  
  // Keep existing streaks that weren't updated
  const keptStreaks = currentStreaks.filter(s => !updatedTypes.has(s.type));
  
  // Combine with updated streaks
  return [...keptStreaks, ...updatedStreaks];
}

async function processEarnedRewards(clinicSlug: string, rewards: any[]): Promise<void> {
  const db = admin.firestore();
  
  try {
    // Add badges to clinic
    const badges = rewards
      .filter(r => r.type === 'streak_badge')
      .map(r => ({
        name: r.badge,
        type: 'streak',
        earnedAt: new Date(),
        streakType: r.streakType,
        streakCount: r.count
      }));
    
    if (badges.length > 0) {
      const clinicRef = db.collection('clinics').doc(clinicSlug);
      await clinicRef.update({
        badges: admin.firestore.FieldValue.arrayUnion(...badges)
      });
    }
    
    // Send notifications for achievements
    for (const reward of rewards) {
      if (reward.type === 'streak_badge') {
        // This would trigger a notification
        console.log(`🏆 Badge earned: ${reward.badge} for ${clinicSlug}`);
        
        // In a real implementation, you'd use the notification queue here
        // await notificationQueue.enqueue(NotificationTemplates.achievement(...))
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to process earned rewards:', error);
  }
}

async function calculateSeoScore(clinicSlug: string): Promise<number> {
  const db = admin.firestore();
  const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
  const clinic = clinicDoc.data();
  
  if (!clinic) return 0;
  
  let score = 0;
  
  // Basic info completeness (40 points)
  if (clinic.name) score += 5;
  if (clinic.address) score += 5;
  if (clinic.phone) score += 5;
  if (clinic.website) score += 5;
  if (clinic.services && clinic.services.length > 0) score += 10;
  if (clinic.seoMeta?.description) score += 10;
  
  // SEO optimization (30 points)
  if (clinic.seoMeta?.title) score += 10;
  if (clinic.seoMeta?.keywords && clinic.seoMeta.keywords.length > 0) score += 10;
  if (clinic.seoContent) score += 10;
  
  // Engagement (30 points)
  if (clinic.rating && clinic.rating > 4) score += 15;
  if (clinic.package !== 'free') score += 15;
  
  return Math.min(score, 100);
}

async function logStreakSummary(summary: any): Promise<void> {
  const db = admin.firestore();
  
  try {
    await db.collection('streakJobs').add({
      ...summary,
      jobType: 'streak_tracking'
    });
  } catch (error) {
    console.error('Failed to log streak summary:', error);
  }
}

// Helper function to get a clinic's current streaks
export async function getClinicStreaks(clinicSlug: string): Promise<ClinicStreak[]> {
  const db = admin.firestore();
  const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
  
  if (!clinicDoc.exists) {
    return [];
  }
  
  const clinic = clinicDoc.data()!;
  return clinic.streaks || [];
}

// Helper function to get streak leaderboard
export async function getStreakLeaderboard(streakType: string, limit: number = 10): Promise<any[]> {
  const db = admin.firestore();
  
  // This is a simplified version - in production you'd use a more efficient query
  const clinicsSnapshot = await db
    .collection('clinics')
    .where('status', '==', 'active')
    .get();
  
  const clinicsWithStreaks = clinicsSnapshot.docs
    .map(doc => {
      const clinic = doc.data();
      const streak = clinic.streaks?.find((s: any) => s.type === streakType);
      return {
        clinicSlug: doc.id,
        clinicName: clinic.name,
        count: streak?.count || 0,
        active: streak?.active || false,
        bestCount: streak?.bestCount || 0
      };
    })
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return clinicsWithStreaks;
}