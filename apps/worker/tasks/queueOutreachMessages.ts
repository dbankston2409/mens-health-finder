import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { generateSalesCopy, SalesCopyInput } from '../utils/generateSalesCopy';

export interface OutreachCriteria {
  highTrafficThreshold: number;
  minEngagementScore: number;
  maxMessagesPerDay: number;
  excludeRecentlyContacted: boolean;
  daysSinceLastContact: number;
  campaignTypes: string[];
  targetTiers: string[];
  requireTags?: string[];
  excludeTags?: string[];
}

export interface OutreachQueueResult {
  messagesQueued: number;
  clinicsProcessed: number;
  campaignBreakdown: Record<string, number>;
  errors: string[];
  skipped: {
    recentlyContacted: number;
    noContactInfo: number;
    belowThreshold: number;
    excludedTags: number;
  };
}

export async function queueOutreachMessages(
  criteria: OutreachCriteria = getDefaultCriteria()
): Promise<OutreachQueueResult> {
  try {
    console.log('🚀 Starting outreach message queue generation...');
    
    // Get outreach settings
    const settings = await getOutreachSettings();
    if (!settings.enabled) {
      console.log('❌ Outreach is disabled in settings');
      return createEmptyResult();
    }
    
    // Get target clinics
    const targetClinics = await getTargetClinics(criteria);
    console.log(`📋 Found ${targetClinics.length} potential target clinics`);
    
    let messagesQueued = 0;
    const campaignBreakdown: Record<string, number> = {};
    const errors: string[] = [];
    const skipped = {
      recentlyContacted: 0,
      noContactInfo: 0,
      belowThreshold: 0,
      excludedTags: 0
    };
    
    for (const clinic of targetClinics) {
      try {
        // Check if clinic should be skipped
        const skipReason = await shouldSkipClinic(clinic, criteria, settings);
        if (skipReason) {
          skipped[skipReason as keyof typeof skipped]++;
          continue;
        }
        
        // Determine campaign type for this clinic
        const campaignType = determineCampaignType(clinic);
        if (!criteria.campaignTypes.includes(campaignType)) {
          continue;
        }
        
        // Generate sales copy
        const salesCopyInput = buildSalesCopyInput(clinic, campaignType);
        const salesCopy = await generateSalesCopy(salesCopyInput);
        
        // Queue the message
        const queueSuccess = await queueMessage(clinic, salesCopy, campaignType, settings);
        
        if (queueSuccess) {
          messagesQueued++;
          campaignBreakdown[campaignType] = (campaignBreakdown[campaignType] || 0) + 1;
          
          // Respect daily limits
          if (messagesQueued >= criteria.maxMessagesPerDay) {
            console.log(`📊 Reached daily limit of ${criteria.maxMessagesPerDay} messages`);
            break;
          }
        }
        
      } catch (error) {
        const errorMsg = `Error processing clinic ${clinic.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    const result: OutreachQueueResult = {
      messagesQueued,
      clinicsProcessed: targetClinics.length,
      campaignBreakdown,
      errors,
      skipped
    };
    
    console.log(`✅ Outreach queue complete: ${messagesQueued} messages queued`);
    console.log('📊 Campaign breakdown:', campaignBreakdown);
    
    return result;
    
  } catch (error) {
    console.error('Error queueing outreach messages:', error);
    throw error;
  }
}

async function getTargetClinics(criteria: OutreachCriteria): Promise<any[]> {
  const clinicsRef = collection(db, 'clinics');
  
  // Base query for active clinics
  let clinicsQuery = query(
    clinicsRef,
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(clinicsQuery);
  const allClinics = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Filter clinics based on criteria
  return allClinics.filter(clinic => {
    // Check tier requirements
    if (!criteria.targetTiers.includes(clinic.package || 'free')) {
      return false;
    }
    
    // Check traffic threshold
    const clicks30d = clinic.traffic?.clicks30d || 0;
    if (clicks30d < criteria.highTrafficThreshold) {
      return false;
    }
    
    // Check engagement score
    const engagementScore = clinic.engagement?.score || 0;
    if (engagementScore < criteria.minEngagementScore) {
      return false;
    }
    
    // Check required tags
    if (criteria.requireTags && criteria.requireTags.length > 0) {
      const clinicTags = clinic.tags || [];
      if (!criteria.requireTags.some(tag => clinicTags.includes(tag))) {
        return false;
      }
    }
    
    // Check excluded tags
    if (criteria.excludeTags && criteria.excludeTags.length > 0) {
      const clinicTags = clinic.tags || [];
      if (criteria.excludeTags.some(tag => clinicTags.includes(tag))) {
        return false;
      }
    }
    
    return true;
  });
}

async function shouldSkipClinic(
  clinic: any,
  criteria: OutreachCriteria,
  settings: any
): Promise<string | null> {
  // Check if clinic has contact information
  if (!clinic.contactEmail && !clinic.email && !clinic.phone) {
    return 'noContactInfo';
  }
  
  // Check if recently contacted
  if (criteria.excludeRecentlyContacted) {
    const recentlyContacted = await wasRecentlyContacted(
      clinic.id,
      criteria.daysSinceLastContact
    );
    if (recentlyContacted) {
      return 'recentlyContacted';
    }
  }
  
  // Check sending hours
  const currentHour = new Date().getHours();
  if (currentHour < settings.sendingHours.start || currentHour > settings.sendingHours.end) {
    return 'outsideSendingHours';
  }
  
  return null;
}

async function wasRecentlyContacted(
  clinicSlug: string,
  daysSinceLastContact: number
): Promise<boolean> {
  try {
    const cutoffDate = new Date(Date.now() - (daysSinceLastContact * 24 * 60 * 60 * 1000));
    
    const outreachRef = collection(db, 'outreachQueue');
    const recentQuery = query(
      outreachRef,
      where('clinicSlug', '==', clinicSlug),
      where('sentAt', '>', cutoffDate)
    );
    
    const snapshot = await getDocs(recentQuery);
    return !snapshot.empty;
    
  } catch (error) {
    console.error('Error checking recent contact:', error);
    return false;
  }
}

function determineCampaignType(clinic: any): string {
  const tier = clinic.package || 'free';
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const engagementLevel = clinic.engagement?.level || 'none';
  const tags = clinic.tags || [];
  const lastActivity = clinic.lastActivity;
  
  // Ghost/inactive clinics
  if (tags.includes('ghost') || tags.includes('inactive')) {
    return 'reactivation';
  }
  
  // High engagement, low tier = upgrade opportunity
  if (engagementLevel === 'engaged' && ['free', 'basic'].includes(tier) && clicks30d >= 50) {
    return 'upgrade';
  }
  
  // Medium engagement, specific features missing
  if (engagementLevel !== 'none' && !clinic.callTracking?.enabled) {
    return 'feature_upsell';
  }
  
  // Recently active but showing decline
  if (clicks30d >= 20 && clicks30d < 50 && tier !== 'free') {
    return 'retention';
  }
  
  // New features available
  if (tier !== 'free' && !tags.includes('new_features_offered')) {
    return 'new_feature';
  }
  
  // Default to upgrade for qualifying clinics
  if (clicks30d >= 30 && tier === 'free') {
    return 'upgrade';
  }
  
  return 'general';
}

function buildSalesCopyInput(clinic: any, campaignType: string): SalesCopyInput {
  const metrics = {
    clicks30d: clinic.traffic?.clicks30d || 0,
    calls30d: clinic.traffic?.calls30d || 0,
    missedCalls: clinic.revenueLeaks?.find((leak: any) => leak.type === 'missed-call-leads')?.estimate || 0,
    missedClicks: 0,
    revenueOpportunity: clinic.revenue?.leakageAnalysis?.totalMonthlyLoss || 0,
    seoScore: clinic.seoMeta?.score || 0
  };
  
  const painPoints: string[] = [];
  
  // Identify pain points from clinic data
  if (!clinic.callTracking?.enabled) {
    painPoints.push('missing call tracking');
  }
  
  if (metrics.seoScore < 60) {
    painPoints.push('low SEO performance');
  }
  
  if (clinic.seoMeta?.indexed === false) {
    painPoints.push('not indexed by Google');
  }
  
  if (metrics.calls30d === 0 && metrics.clicks30d > 10) {
    painPoints.push('low call conversion rate');
  }
  
  return {
    clinicName: clinic.name || 'Your Clinic',
    city: clinic.city,
    state: clinic.state,
    services: clinic.services || [],
    engagementLevel: clinic.engagement?.level || 'none',
    currentTier: clinic.package || 'free',
    suggestedTier: getSuggestedTier(clinic),
    metrics,
    painPoints,
    campaignType: campaignType as any
  };
}

function getSuggestedTier(clinic: any): string {
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const currentTier = clinic.package || 'free';
  
  if (clicks30d >= 100 && currentTier !== 'enterprise') {
    return 'enterprise';
  } else if (clicks30d >= 50 && !['premium', 'enterprise'].includes(currentTier)) {
    return 'premium';
  } else if (clicks30d >= 20 && !['basic', 'premium', 'enterprise'].includes(currentTier)) {
    return 'basic';
  }
  
  return 'premium'; // Default suggestion
}

async function queueMessage(
  clinic: any,
  salesCopy: any,
  campaignType: string,
  settings: any
): Promise<boolean> {
  try {
    const recipientEmail = clinic.contactEmail || clinic.email;
    const recipientPhone = clinic.phone;
    
    // Determine message type based on settings and clinic preferences
    const messageType = determineMessageType(settings, clinic, recipientEmail, recipientPhone);
    
    if (!messageType) {
      return false;
    }
    
    // Calculate send time (immediate or scheduled)
    const scheduledFor = calculateScheduledTime(settings);
    
    // Create outreach queue entry
    const outreachData = {
      clinicSlug: clinic.id,
      clinicName: clinic.name,
      type: messageType,
      channel: messageType === 'email' ? 'email' : 'sms',
      recipient: messageType === 'email' ? recipientEmail : recipientPhone,
      subject: salesCopy.subject,
      body: salesCopy.body,
      cta: salesCopy.cta,
      campaignType,
      scheduledFor,
      status: 'pending',
      priority: salesCopy.urgency === 'high' ? 'high' : 'normal',
      createdAt: serverTimestamp(),
      opened: false,
      clicked: false,
      sentAt: null,
      respondedAt: null,
      metadata: {
        tone: salesCopy.tone,
        urgency: salesCopy.urgency,
        personalizations: salesCopy.personalizations
      }
    };
    
    const outreachRef = collection(db, 'outreachQueue');
    await addDoc(outreachRef, outreachData);
    
    console.log(`📤 Queued ${messageType} for ${clinic.name} (${campaignType})`);
    
    return true;
    
  } catch (error) {
    console.error('Error queueing message:', error);
    return false;
  }
}

function determineMessageType(
  settings: any,
  clinic: any,
  email?: string,
  phone?: string
): 'email' | 'sms' | null {
  // Check global settings
  if (!settings.emailEnabled && !settings.smsEnabled) {
    return null;
  }
  
  // Prefer email for outreach (better for detailed content)
  if (settings.emailEnabled && email) {
    return 'email';
  }
  
  // Fall back to SMS if enabled and available
  if (settings.smsEnabled && phone) {
    return 'sms';
  }
  
  return null;
}

function calculateScheduledTime(settings: any): Date {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If within sending hours, send immediately
  if (currentHour >= settings.sendingHours.start && currentHour <= settings.sendingHours.end) {
    return now;
  }
  
  // Otherwise, schedule for next business day at start time
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(settings.sendingHours.start, 0, 0, 0);
  
  return tomorrow;
}

async function getOutreachSettings(): Promise<any> {
  try {
    const settingsRef = doc(db, 'settings', 'outreachConfig');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }
    
    // Return default settings
    return {
      enabled: true,
      emailEnabled: true,
      smsEnabled: false,
      maxPerDay: 50,
      sendingHours: {
        start: 9,
        end: 17
      },
      excludeWeekends: true
    };
    
  } catch (error) {
    console.error('Error fetching outreach settings:', error);
    return { enabled: false };
  }
}

function getDefaultCriteria(): OutreachCriteria {
  return {
    highTrafficThreshold: 20,
    minEngagementScore: 0,
    maxMessagesPerDay: 50,
    excludeRecentlyContacted: true,
    daysSinceLastContact: 14,
    campaignTypes: ['upgrade', 'feature_upsell', 'retention', 'new_feature'],
    targetTiers: ['free', 'basic'],
    excludeTags: ['do_not_contact', 'churned']
  };
}

function createEmptyResult(): OutreachQueueResult {
  return {
    messagesQueued: 0,
    clinicsProcessed: 0,
    campaignBreakdown: {},
    errors: [],
    skipped: {
      recentlyContacted: 0,
      noContactInfo: 0,
      belowThreshold: 0,
      excludedTags: 0
    }
  };
}

// CLI interface
export async function runOutreachQueueWorker(options: Partial<OutreachCriteria> = {}): Promise<void> {
  const criteria = { ...getDefaultCriteria(), ...options };
  
  console.log('🎯 Outreach Queue Worker Starting...');
  console.log('Criteria:', criteria);
  
  const result = await queueOutreachMessages(criteria);
  
  console.log('\n📊 Results:');
  console.log(`Messages Queued: ${result.messagesQueued}`);
  console.log(`Clinics Processed: ${result.clinicsProcessed}`);
  console.log('Campaign Breakdown:', result.campaignBreakdown);
  console.log('Skipped:', result.skipped);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
}