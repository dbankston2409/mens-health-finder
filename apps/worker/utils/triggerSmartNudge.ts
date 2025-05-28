import admin from '../../../packages/firebase/init';
import { notificationQueue, NotificationTemplates } from './pushNotificationQueue';

interface NudgeRule {
  id: string;
  name: string;
  condition: (clinic: any, metrics: any) => boolean;
  message: (clinic: any, metrics: any) => {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  };
  priority: 'low' | 'medium' | 'high';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  category: string;
  cooldownHours?: number;
}

const NUDGE_RULES: NudgeRule[] = [
  {
    id: 'seo_score_drop',
    name: 'SEO Score Dropped',
    condition: (clinic, metrics) => {
      return metrics.seoScore < 70 && metrics.seoScoreChange < -5;
    },
    message: (clinic, metrics) => ({
      title: '📉 SEO Score Alert',
      message: `Your SEO score dropped to ${metrics.seoScore}/100. Take action to improve your search visibility.`,
      actionUrl: '/admin/seo',
      actionText: 'Improve SEO'
    }),
    priority: 'high',
    frequency: 'weekly',
    category: 'seo',
    cooldownHours: 168 // 1 week
  },

  {
    id: 'traffic_spike',
    name: 'Traffic Spike Detected',
    condition: (clinic, metrics) => {
      return metrics.trafficChange > 25 && metrics.uniqueVisitors > 50;
    },
    message: (clinic, metrics) => ({
      title: '🚀 Traffic is Trending!',
      message: `Your clinic is getting ${metrics.trafficChange.toFixed(1)}% more visitors! Keep up the momentum.`,
      actionUrl: '/admin/analytics',
      actionText: 'View Analytics'
    }),
    priority: 'low',
    frequency: 'once',
    category: 'milestone'
  },

  {
    id: 'no_clicks_warning',
    name: 'Low Engagement Warning',
    condition: (clinic, metrics) => {
      return metrics.totalClicks === 0 && metrics.profileViews > 20;
    },
    message: (clinic, metrics) => ({
      title: '💡 Boost Your Engagement',
      message: `${metrics.profileViews} people viewed your profile but no one clicked. Try updating your description or adding a compelling call-to-action.`,
      actionUrl: '/admin/profile',
      actionText: 'Update Profile'
    }),
    priority: 'medium',
    frequency: 'weekly',
    category: 'engagement',
    cooldownHours: 72 // 3 days
  },

  {
    id: 'missing_phone_number',
    name: 'Missing Contact Information',
    condition: (clinic, metrics) => {
      return !clinic.phone || clinic.phone.length < 10;
    },
    message: (clinic, metrics) => ({
      title: '📞 Add Your Phone Number',
      message: 'Clinics with phone numbers get 3x more calls. Add your contact information to boost engagement.',
      actionUrl: '/admin/profile',
      actionText: 'Add Phone Number'
    }),
    priority: 'high',
    frequency: 'weekly',
    category: 'profile',
    cooldownHours: 168
  },

  {
    id: 'incomplete_profile',
    name: 'Incomplete Profile Warning',
    condition: (clinic, metrics) => {
      return metrics.completionScore < 80;
    },
    message: (clinic, metrics) => ({
      title: '⚡ Complete Your Profile',
      message: `Your profile is ${metrics.completionScore}% complete. Complete profiles get 50% more visibility.`,
      actionUrl: '/admin/profile',
      actionText: 'Complete Profile'
    }),
    priority: 'medium',
    frequency: 'weekly',
    category: 'profile',
    cooldownHours: 168
  },

  {
    id: 'review_opportunity',
    name: 'Review Collection Opportunity',
    condition: (clinic, metrics) => {
      return metrics.totalCalls >= 5 && metrics.reviewsThisMonth === 0;
    },
    message: (clinic, metrics) => ({
      title: '⭐ Time to Collect Reviews',
      message: `You've received ${metrics.totalCalls} calls this month. Send review invites to boost your reputation.`,
      actionUrl: '/admin/reviews',
      actionText: 'Send Review Invites'
    }),
    priority: 'medium',
    frequency: 'monthly',
    category: 'reviews',
    cooldownHours: 720 // 30 days
  },

  {
    id: 'upgrade_suggestion',
    name: 'Upgrade Opportunity',
    condition: (clinic, metrics) => {
      return clinic.package === 'free' && 
             metrics.profileViews > 100 && 
             metrics.totalCalls > 10;
    },
    message: (clinic, metrics) => ({
      title: '🔥 Your Clinic is Popular!',
      message: `${metrics.profileViews} profile views and ${metrics.totalCalls} calls this month. Upgrade to capture even more leads.`,
      actionUrl: '/admin/billing',
      actionText: 'View Upgrade Options'
    }),
    priority: 'low',
    frequency: 'monthly',
    category: 'upgrade',
    cooldownHours: 720
  },

  {
    id: 'streak_encouragement',
    name: 'Streak Encouragement',
    condition: (clinic, metrics) => {
      const streak = clinic.streaks?.find((s: any) => s.type === 'profile_updates' && s.active);
      return streak && streak.count >= 3;
    },
    message: (clinic, metrics) => {
      const streak = clinic.streaks.find((s: any) => s.type === 'profile_updates');
      return {
        title: '🔥 You\'re on Fire!',
        message: `${streak.count} days of profile updates! Keep the momentum going to unlock special badges.`,
        actionUrl: '/admin/achievements',
        actionText: 'View Progress'
      };
    },
    priority: 'low',
    frequency: 'daily',
    category: 'gamification'
  },

  {
    id: 'content_freshness',
    name: 'Content Update Reminder',
    condition: (clinic, metrics) => {
      const daysSinceUpdate = metrics.daysSinceContentUpdate;
      return daysSinceUpdate > 30;
    },
    message: (clinic, metrics) => ({
      title: '📝 Refresh Your Content',
      message: `It's been ${metrics.daysSinceContentUpdate} days since your last content update. Fresh content improves SEO rankings.`,
      actionUrl: '/admin/content',
      actionText: 'Update Content'
    }),
    priority: 'medium',
    frequency: 'monthly',
    category: 'content',
    cooldownHours: 720
  },

  {
    id: 'competitor_alert',
    name: 'Competitive Analysis',
    condition: (clinic, metrics) => {
      return metrics.marketRank && metrics.marketRank > 5 && clinic.package !== 'free';
    },
    message: (clinic, metrics) => ({
      title: '🎯 Competitive Opportunity',
      message: `You're ranked #${metrics.marketRank} in your market. Optimize your listing to climb higher.`,
      actionUrl: '/admin/seo',
      actionText: 'Improve Ranking'
    }),
    priority: 'medium',
    frequency: 'weekly',
    category: 'competition',
    cooldownHours: 168
  }
];

export async function triggerSmartNudge(clinicSlug: string): Promise<void> {
  console.log(`🧠 Analyzing nudge opportunities for clinic: ${clinicSlug}`);
  
  try {
    // Get clinic data
    const clinic = await getClinicData(clinicSlug);
    if (!clinic) {
      console.warn(`⚠️  Clinic not found: ${clinicSlug}`);
      return;
    }
    
    // Calculate metrics for this clinic
    const metrics = await calculateClinicMetrics(clinicSlug, clinic);
    
    // Evaluate each nudge rule
    const triggeredNudges: Array<{rule: NudgeRule, clinic: any, metrics: any}> = [];
    
    for (const rule of NUDGE_RULES) {
      try {
        // Check if this rule should trigger
        if (rule.condition(clinic, metrics)) {
          // Check cooldown period
          const canTrigger = await checkCooldown(clinicSlug, rule);
          
          if (canTrigger) {
            triggeredNudges.push({ rule, clinic, metrics });
            console.log(`✅ Nudge rule triggered: ${rule.name} for ${clinicSlug}`);
          } else {
            console.log(`⏰ Nudge rule in cooldown: ${rule.name} for ${clinicSlug}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error evaluating nudge rule ${rule.name}:`, error);
      }
    }
    
    // Process triggered nudges
    for (const { rule, clinic, metrics } of triggeredNudges) {
      await processNudge(rule, clinic, metrics);
    }
    
    console.log(`📊 Nudge analysis complete for ${clinicSlug}: ${triggeredNudges.length} nudges triggered`);
    
  } catch (error) {
    console.error(`❌ Smart nudge analysis failed for ${clinicSlug}:`, error);
    throw error;
  }
}

export async function triggerSmartNudgeForAllClinics(): Promise<void> {
  console.log('🔄 Running smart nudge analysis for all clinics...');
  
  const db = admin.firestore();
  
  try {
    // Get all active clinics
    const clinicsSnapshot = await db
      .collection('clinics')
      .where('status', '==', 'active')
      .get();
    
    console.log(`📋 Analyzing ${clinicsSnapshot.size} clinics for nudge opportunities`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    // Process clinics in batches to avoid overwhelming the system
    const batchSize = 10;
    const clinics = clinicsSnapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() }));
    
    for (let i = 0; i < clinics.length; i += batchSize) {
      const batch = clinics.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (clinic) => {
          try {
            await triggerSmartNudge(clinic.slug);
            processedCount++;
          } catch (error) {
            console.error(`❌ Failed to process nudges for ${clinic.slug}:`, error);
            errorCount++;
          }
        })
      );
      
      // Add delay between batches
      if (i + batchSize < clinics.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Smart nudge analysis completed: ${processedCount} processed, ${errorCount} errors`);
    
    // Log summary
    await logNudgeSummary({
      totalClinics: clinics.length,
      processedCount,
      errorCount,
      completedAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ Bulk smart nudge analysis failed:', error);
    throw error;
  }
}

async function getClinicData(clinicSlug: string): Promise<any> {
  const db = admin.firestore();
  const doc = await db.collection('clinics').doc(clinicSlug).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { slug: clinicSlug, ...doc.data() };
}

async function calculateClinicMetrics(clinicSlug: string, clinic: any): Promise<any> {
  const db = admin.firestore();
  const now = new Date();
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Get traffic data
  const trafficQuery = await db
    .collection('clinics')
    .doc(clinicSlug)
    .collection('traffic_logs')
    .where('timestamp', '>=', lastMonth)
    .get();
  
  // Get engagement data
  const engagementQuery = await db
    .collection('clinics')
    .doc(clinicSlug)
    .collection('engagement_logs')
    .where('timestamp', '>=', lastMonth)
    .get();
  
  // Get reviews
  const reviewsQuery = await db
    .collection('reviews')
    .where('clinicSlug', '==', clinicSlug)
    .where('createdAt', '>=', lastMonth)
    .get();
  
  // Process data
  const trafficLogs = trafficQuery.docs.map(doc => doc.data());
  const engagementLogs = engagementQuery.docs.map(doc => doc.data());
  
  const uniqueVisitors = new Set(trafficLogs.map(log => log.sessionId)).size;
  const profileViews = trafficLogs.length;
  const totalCalls = engagementLogs.filter(log => log.type === 'call').length;
  const totalClicks = engagementLogs.filter(log => log.type === 'website_click').length;
  const reviewsThisMonth = reviewsQuery.size;
  
  // Calculate SEO score
  const seoScore = calculateSeoScore(clinic);
  
  // Calculate completion score
  const completionScore = calculateCompletionScore(clinic);
  
  // Calculate days since last content update
  const daysSinceContentUpdate = clinic.seoContent ? 
    Math.floor((now.getTime() - clinic.updatedAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 
    999;
  
  // Calculate traffic change (simplified)
  const trafficChange = Math.random() * 40 - 20; // Mock data
  
  return {
    uniqueVisitors,
    profileViews,
    totalCalls,
    totalClicks,
    reviewsThisMonth,
    seoScore,
    seoScoreChange: Math.random() * 20 - 10, // Mock data
    completionScore,
    daysSinceContentUpdate,
    trafficChange,
    marketRank: Math.floor(Math.random() * 10) + 1 // Mock data
  };
}

function calculateSeoScore(clinic: any): number {
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

function calculateCompletionScore(clinic: any): number {
  let score = 0;
  const fields = ['name', 'address', 'phone', 'website', 'services', 'seoMeta', 'seoContent'];
  
  fields.forEach(field => {
    if (clinic[field]) {
      if (field === 'services' && Array.isArray(clinic[field]) && clinic[field].length > 0) {
        score += 100 / fields.length;
      } else if (field === 'seoMeta' && clinic[field]?.title && clinic[field]?.description) {
        score += 100 / fields.length;
      } else if (field !== 'services' && field !== 'seoMeta' && clinic[field]) {
        score += 100 / fields.length;
      }
    }
  });
  
  return Math.round(score);
}

async function checkCooldown(clinicSlug: string, rule: NudgeRule): Promise<boolean> {
  if (!rule.cooldownHours) {
    return true;
  }
  
  const db = admin.firestore();
  const cooldownStart = new Date();
  cooldownStart.setHours(cooldownStart.getHours() - rule.cooldownHours);
  
  // Check if this rule was triggered recently
  const recentNudges = await db
    .collection('notifications')
    .where('clinicSlug', '==', clinicSlug)
    .where('category', '==', rule.category)
    .where('createdAt', '>=', cooldownStart)
    .limit(1)
    .get();
  
  return recentNudges.empty;
}

async function processNudge(rule: NudgeRule, clinic: any, metrics: any): Promise<void> {
  try {
    const messageData = rule.message(clinic, metrics);
    
    // Create notification
    await notificationQueue.enqueue({
      clinicSlug: clinic.slug,
      type: getNotificationType(rule.category),
      priority: rule.priority,
      title: messageData.title,
      message: messageData.message,
      actionUrl: messageData.actionUrl,
      actionText: messageData.actionText,
      category: rule.category,
      tags: [rule.id],
      data: {
        ruleId: rule.id,
        metrics: {
          seoScore: metrics.seoScore,
          completionScore: metrics.completionScore,
          profileViews: metrics.profileViews,
          totalCalls: metrics.totalCalls
        }
      }
    });
    
    // Log nudge trigger
    await logNudgeTrigger(clinic.slug, rule.id, rule.name, messageData);
    
  } catch (error) {
    console.error(`❌ Failed to process nudge ${rule.name} for ${clinic.slug}:`, error);
    throw error;
  }
}

function getNotificationType(category: string): 'reminder' | 'achievement' | 'seo-issue' | 'milestone' | 'warning' | 'tip' {
  switch (category) {
    case 'seo': return 'seo-issue';
    case 'milestone': return 'milestone';
    case 'gamification': return 'achievement';
    case 'engagement':
    case 'profile':
    case 'content':
    case 'reviews':
    case 'competition': return 'reminder';
    case 'upgrade': return 'tip';
    default: return 'reminder';
  }
}

async function logNudgeTrigger(clinicSlug: string, ruleId: string, ruleName: string, messageData: any): Promise<void> {
  const db = admin.firestore();
  
  try {
    await db.collection('nudgeLogs').add({
      clinicSlug,
      ruleId,
      ruleName,
      title: messageData.title,
      message: messageData.message,
      triggeredAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log nudge trigger:', error);
  }
}

async function logNudgeSummary(summary: any): Promise<void> {
  const db = admin.firestore();
  
  try {
    await db.collection('nudgeJobs').add({
      ...summary,
      jobType: 'smart_nudge_analysis'
    });
  } catch (error) {
    console.error('Failed to log nudge summary:', error);
  }
}