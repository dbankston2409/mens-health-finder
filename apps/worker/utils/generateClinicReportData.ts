import admin from '../lib/firebase';

export interface ClinicReportData {
  clinicSlug: string;
  clinicName: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
    type: 'weekly' | 'monthly' | 'quarterly';
  };
  traffic: {
    uniqueVisitors: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{ path: string; views: number }>;
    trafficSources: Array<{ source: string; percentage: number }>;
    previousPeriodComparison: {
      visitorsChange: number;
      pageViewsChange: number;
      durationChange: number;
    };
  };
  engagement: {
    totalCalls: number;
    websiteClicks: number;
    callConversionRate: number;
    clickThroughRate: number;
    peakHours: Array<{ hour: number; calls: number }>;
    previousPeriodComparison: {
      callsChange: number;
      clicksChange: number;
      ctrChange: number;
    };
  };
  leads: {
    totalLeads: number;
    reviewInvitesSent: number;
    reviewsCollected: number;
    leadSources: Array<{ source: string; count: number }>;
    conversionFunnel: {
      visits: number;
      profileViews: number;
      contactActions: number;
      leads: number;
    };
    previousPeriodComparison: {
      leadsChange: number;
      reviewsChange: number;
      conversionChange: number;
    };
  };
  seoPerformance: {
    currentScore: number;
    indexedPages: number;
    keywordRankings: Array<{ keyword: string; position: number; change: number }>;
    searchVisibility: number;
    localSeoScore: number;
    previousPeriodComparison: {
      scoreChange: number;
      indexedChange: number;
      visibilityChange: number;
    };
  };
  businessMetrics: {
    tier: 'free' | 'basic' | 'premium';
    accountHealth: 'excellent' | 'good' | 'needs-attention' | 'at-risk';
    completionScore: number;
    badges: Array<{ name: string; earnedAt: Date }>;
    streaks: Array<{ type: string; count: number; active: boolean }>;
  };
  recommendations: Array<{
    type: 'seo' | 'content' | 'engagement' | 'technical';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: string;
    actionUrl?: string;
  }>;
  generatedAt: Date;
}

export async function generateClinicReportData(
  clinicSlug: string,
  startDate: Date,
  endDate: Date,
  reportType: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): Promise<ClinicReportData> {
  console.log(`📊 Generating ${reportType} report for clinic: ${clinicSlug}`);
  
  const db = admin.firestore();
  
  try {
    // Get clinic document
    const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
    if (!clinicDoc.exists) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinicData = clinicDoc.data()!;
    
    // Calculate previous period dates for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(endDate.getTime() - periodLength);
    
    // Gather all report data in parallel
    const [
      trafficData,
      engagementData,
      leadsData,
      seoData,
      businessData
    ] = await Promise.all([
      getTrafficMetrics(clinicSlug, startDate, endDate, prevStartDate, prevEndDate),
      getEngagementMetrics(clinicSlug, startDate, endDate, prevStartDate, prevEndDate),
      getLeadsMetrics(clinicSlug, startDate, endDate, prevStartDate, prevEndDate),
      getSeoMetrics(clinicSlug, startDate, endDate, prevStartDate, prevEndDate),
      getBusinessMetrics(clinicSlug, clinicData)
    ]);
    
    // Generate recommendations based on data
    const recommendations = generateRecommendations(
      trafficData,
      engagementData,
      leadsData,
      seoData,
      businessData
    );
    
    const reportData: ClinicReportData = {
      clinicSlug,
      clinicName: clinicData.name,
      reportPeriod: {
        startDate,
        endDate,
        type: reportType
      },
      traffic: trafficData,
      engagement: engagementData,
      leads: leadsData,
      seoPerformance: seoData,
      businessMetrics: businessData,
      recommendations,
      generatedAt: new Date()
    };
    
    console.log(`✅ Report generated for ${clinicSlug}: ${reportData.traffic.uniqueVisitors} visitors, ${reportData.engagement.totalCalls} calls`);
    
    return reportData;
    
  } catch (error) {
    console.error(`❌ Failed to generate report for ${clinicSlug}:`, error);
    throw error;
  }
}

async function getTrafficMetrics(
  clinicSlug: string,
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
) {
  const db = admin.firestore();
  
  // Get current period traffic
  const currentTrafficQuery = await db
    .collection('clinics')
    .doc(clinicSlug)
    .collection('traffic_logs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
  
  // Get previous period for comparison
  const prevTrafficQuery = await db
    .collection('clinics')
    .doc(clinicSlug)
    .collection('traffic_logs')
    .where('timestamp', '>=', prevStartDate)
    .where('timestamp', '<=', prevEndDate)
    .get();
  
  // Process current period data
  const currentLogs = currentTrafficQuery.docs.map(doc => doc.data());
  const prevLogs = prevTrafficQuery.docs.map(doc => doc.data());
  
  // Calculate metrics
  const uniqueVisitors = new Set(currentLogs.map(log => log.sessionId)).size;
  const pageViews = currentLogs.length;
  const avgSessionDuration = calculateAvgSessionDuration(currentLogs);
  const bounceRate = calculateBounceRate(currentLogs);
  const topPages = getTopPages(currentLogs);
  const trafficSources = getTrafficSources(currentLogs);
  
  // Previous period metrics for comparison
  const prevUniqueVisitors = new Set(prevLogs.map(log => log.sessionId)).size;
  const prevPageViews = prevLogs.length;
  const prevAvgDuration = calculateAvgSessionDuration(prevLogs);
  
  return {
    uniqueVisitors,
    pageViews,
    avgSessionDuration,
    bounceRate,
    topPages,
    trafficSources,
    previousPeriodComparison: {
      visitorsChange: calculatePercentageChange(prevUniqueVisitors, uniqueVisitors),
      pageViewsChange: calculatePercentageChange(prevPageViews, pageViews),
      durationChange: calculatePercentageChange(prevAvgDuration, avgSessionDuration)
    }
  };
}

async function getEngagementMetrics(
  clinicSlug: string,
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
) {
  const db = admin.firestore();
  
  // Get engagement logs
  const currentEngagementQuery = await db
    .collection('clinics')
    .doc(clinicSlug)
    .collection('engagement_logs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
  
  const prevEngagementQuery = await db
    .collection('clinics')
    .doc(clinicSlug)
    .collection('engagement_logs')
    .where('timestamp', '>=', prevStartDate)
    .where('timestamp', '<=', prevEndDate)
    .get();
  
  const currentLogs = currentEngagementQuery.docs.map(doc => doc.data());
  const prevLogs = prevEngagementQuery.docs.map(doc => doc.data());
  
  // Calculate metrics
  const totalCalls = currentLogs.filter(log => log.type === 'call').length;
  const websiteClicks = currentLogs.filter(log => log.type === 'website_click').length;
  const totalViews = currentLogs.filter(log => log.type === 'profile_view').length;
  
  const callConversionRate = totalViews > 0 ? (totalCalls / totalViews) * 100 : 0;
  const clickThroughRate = totalViews > 0 ? ((totalCalls + websiteClicks) / totalViews) * 100 : 0;
  const peakHours = calculatePeakHours(currentLogs);
  
  // Previous period metrics
  const prevTotalCalls = prevLogs.filter(log => log.type === 'call').length;
  const prevWebsiteClicks = prevLogs.filter(log => log.type === 'website_click').length;
  const prevTotalViews = prevLogs.filter(log => log.type === 'profile_view').length;
  const prevCTR = prevTotalViews > 0 ? ((prevTotalCalls + prevWebsiteClicks) / prevTotalViews) * 100 : 0;
  
  return {
    totalCalls,
    websiteClicks,
    callConversionRate,
    clickThroughRate,
    peakHours,
    previousPeriodComparison: {
      callsChange: calculatePercentageChange(prevTotalCalls, totalCalls),
      clicksChange: calculatePercentageChange(prevWebsiteClicks, websiteClicks),
      ctrChange: calculatePercentageChange(prevCTR, clickThroughRate)
    }
  };
}

async function getLeadsMetrics(
  clinicSlug: string,
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
) {
  const db = admin.firestore();
  
  // Get leads and reviews
  const leadsQuery = await db
    .collection('leads')
    .where('clinicSlug', '==', clinicSlug)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const reviewsQuery = await db
    .collection('reviews')
    .where('clinicSlug', '==', clinicSlug)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  // Previous period
  const prevLeadsQuery = await db
    .collection('leads')
    .where('clinicSlug', '==', clinicSlug)
    .where('createdAt', '>=', prevStartDate)
    .where('createdAt', '<=', prevEndDate)
    .get();
  
  const prevReviewsQuery = await db
    .collection('reviews')
    .where('clinicSlug', '==', clinicSlug)
    .where('createdAt', '>=', prevStartDate)
    .where('createdAt', '<=', prevEndDate)
    .get();
  
  const currentLeads = leadsQuery.docs.map(doc => doc.data());
  const currentReviews = reviewsQuery.docs.map(doc => doc.data());
  const prevLeads = prevLeadsQuery.docs.map(doc => doc.data());
  const prevReviews = prevReviewsQuery.docs.map(doc => doc.data());
  
  const totalLeads = currentLeads.length;
  const reviewInvitesSent = currentLeads.filter(lead => lead.reviewInviteSent).length;
  const reviewsCollected = currentReviews.length;
  const leadSources = calculateLeadSources(currentLeads);
  const conversionFunnel = calculateConversionFunnel(clinicSlug, startDate, endDate);
  
  return {
    totalLeads,
    reviewInvitesSent,
    reviewsCollected,
    leadSources,
    conversionFunnel: await conversionFunnel,
    previousPeriodComparison: {
      leadsChange: calculatePercentageChange(prevLeads.length, totalLeads),
      reviewsChange: calculatePercentageChange(prevReviews.length, reviewsCollected),
      conversionChange: 0 // Will be calculated based on funnel data
    }
  };
}

async function getSeoMetrics(
  clinicSlug: string,
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
) {
  const db = admin.firestore();
  
  // Get current SEO data
  const clinicDoc = await db.collection('clinics').doc(clinicSlug).get();
  const clinicData = clinicDoc.data()!;
  
  // Get SEO audit history
  const seoAuditQuery = await db
    .collection('seoAudits')
    .where('clinicSlug', '==', clinicSlug)
    .where('auditDate', '>=', prevStartDate)
    .where('auditDate', '<=', endDate)
    .orderBy('auditDate', 'desc')
    .limit(10)
    .get();
  
  const audits = seoAuditQuery.docs.map(doc => doc.data());
  const latestAudit = audits[0];
  const previousAudit = audits.find(audit => audit.auditDate <= prevEndDate);
  
  // Calculate SEO score
  const currentScore = latestAudit?.seoScore || calculateSeoScore(clinicData);
  const previousScore = previousAudit?.seoScore || currentScore;
  
  // Mock keyword rankings and search visibility
  const keywordRankings = [
    { keyword: `${clinicData.services[0]} ${clinicData.city}`, position: 3, change: -1 },
    { keyword: `men's health ${clinicData.city}`, position: 7, change: 2 },
    { keyword: clinicData.name, position: 1, change: 0 }
  ];
  
  const searchVisibility = calculateSearchVisibility(keywordRankings);
  const localSeoScore = calculateLocalSeoScore(clinicData);
  
  return {
    currentScore,
    indexedPages: clinicData.seoMeta?.indexed ? 1 : 0,
    keywordRankings,
    searchVisibility,
    localSeoScore,
    previousPeriodComparison: {
      scoreChange: calculatePercentageChange(previousScore, currentScore),
      indexedChange: 0, // Would calculate based on historical data
      visibilityChange: 0 // Would calculate based on historical data
    }
  };
}

async function getBusinessMetrics(clinicSlug: string, clinicData: any) {
  const completionScore = calculateCompletionScore(clinicData);
  const accountHealth = determineAccountHealth(clinicData, completionScore);
  
  return {
    tier: clinicData.package || 'free',
    accountHealth,
    completionScore,
    badges: clinicData.badges || [],
    streaks: clinicData.streaks || []
  };
}

// Helper functions
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

function calculateAvgSessionDuration(logs: any[]): number {
  // Simplified calculation - would use actual session tracking
  return Math.floor(Math.random() * 180) + 60; // 1-4 minutes
}

function calculateBounceRate(logs: any[]): number {
  // Simplified calculation
  return Math.floor(Math.random() * 30) + 20; // 20-50%
}

function getTopPages(logs: any[]): Array<{ path: string; views: number }> {
  const pageCounts = logs.reduce((acc, log) => {
    const page = log.page || '/profile';
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(pageCounts)
    .map(([path, views]) => ({ path, views: views as number }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
}

function getTrafficSources(logs: any[]): Array<{ source: string; percentage: number }> {
  const sources = ['Direct', 'Google Search', 'Social Media', 'Referral'];
  return sources.map(source => ({
    source,
    percentage: Math.floor(Math.random() * 40) + 10
  }));
}

function calculatePeakHours(logs: any[]): Array<{ hour: number; calls: number }> {
  const hourCounts = logs
    .filter(log => log.type === 'call')
    .reduce((acc, log) => {
      const hour = new Date(log.timestamp.toDate()).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
  
  return Object.entries(hourCounts)
    .map(([hour, calls]) => ({ hour: parseInt(hour), calls: calls as number }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 3);
}

function calculateLeadSources(leads: any[]): Array<{ source: string; count: number }> {
  const sources = leads.reduce((acc, lead) => {
    const source = lead.source || 'Direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(sources).map(([source, count]) => ({
    source,
    count: count as number
  }));
}

async function calculateConversionFunnel(clinicSlug: string, startDate: Date, endDate: Date) {
  // Simplified funnel calculation
  const visits = Math.floor(Math.random() * 1000) + 500;
  const profileViews = Math.floor(visits * 0.3);
  const contactActions = Math.floor(profileViews * 0.15);
  const leads = Math.floor(contactActions * 0.6);
  
  return { visits, profileViews, contactActions, leads };
}

function calculateSeoScore(clinicData: any): number {
  let score = 0;
  
  // Basic info completeness (40 points)
  if (clinicData.name) score += 5;
  if (clinicData.address) score += 5;
  if (clinicData.phone) score += 5;
  if (clinicData.website) score += 5;
  if (clinicData.services && clinicData.services.length > 0) score += 10;
  if (clinicData.seoMeta?.description) score += 10;
  
  // SEO optimization (30 points)
  if (clinicData.seoMeta?.title) score += 10;
  if (clinicData.seoMeta?.keywords && clinicData.seoMeta.keywords.length > 0) score += 10;
  if (clinicData.seoContent) score += 10;
  
  // Engagement (30 points)
  if (clinicData.rating && clinicData.rating > 4) score += 15;
  if (clinicData.package !== 'free') score += 15;
  
  return Math.min(score, 100);
}

function calculateSearchVisibility(rankings: any[]): number {
  const avgPosition = rankings.reduce((sum, rank) => sum + rank.position, 0) / rankings.length;
  return Math.max(0, 100 - (avgPosition - 1) * 10);
}

function calculateLocalSeoScore(clinicData: any): number {
  let score = 0;
  
  if (clinicData.address) score += 25;
  if (clinicData.phone) score += 25;
  if (clinicData.city && clinicData.state) score += 25;
  if (clinicData.website) score += 25;
  
  return score;
}

function calculateCompletionScore(clinicData: any): number {
  let score = 0;
  const fields = ['name', 'address', 'phone', 'website', 'services', 'seoMeta', 'seoContent'];
  
  fields.forEach(field => {
    if (clinicData[field]) {
      if (field === 'services' && Array.isArray(clinicData[field]) && clinicData[field].length > 0) {
        score += 100 / fields.length;
      } else if (field === 'seoMeta' && clinicData[field]?.title && clinicData[field]?.description) {
        score += 100 / fields.length;
      } else if (field !== 'services' && field !== 'seoMeta' && clinicData[field]) {
        score += 100 / fields.length;
      }
    }
  });
  
  return Math.round(score);
}

function determineAccountHealth(clinicData: any, completionScore: number): 'excellent' | 'good' | 'needs-attention' | 'at-risk' {
  if (completionScore >= 90 && clinicData.package === 'premium') return 'excellent';
  if (completionScore >= 70 && clinicData.package !== 'free') return 'good';
  if (completionScore >= 50) return 'needs-attention';
  return 'at-risk';
}

function generateRecommendations(
  trafficData: any,
  engagementData: any,
  leadsData: any,
  seoData: any,
  businessData: any
): any[] {
  const recommendations = [];
  
  // SEO recommendations
  if (seoData.currentScore < 70) {
    recommendations.push({
      type: 'seo',
      priority: 'high',
      title: 'Improve SEO Score',
      description: 'Your SEO score is below 70%. Complete your profile and optimize content to improve search visibility.',
      estimatedImpact: '+15-25% organic traffic',
      actionUrl: '/admin/seo'
    });
  }
  
  // Engagement recommendations
  if (engagementData.callConversionRate < 5) {
    recommendations.push({
      type: 'engagement',
      priority: 'medium',
      title: 'Boost Call Conversion',
      description: 'Your call conversion rate is low. Consider adding compelling call-to-action buttons and contact information.',
      estimatedImpact: '+10-20% more calls',
      actionUrl: '/admin/profile'
    });
  }
  
  // Content recommendations
  if (businessData.completionScore < 80) {
    recommendations.push({
      type: 'content',
      priority: 'medium',
      title: 'Complete Your Profile',
      description: 'A complete profile gets 3x more engagement. Add missing information to boost visibility.',
      estimatedImpact: '+30% profile views',
      actionUrl: '/admin/profile'
    });
  }
  
  return recommendations;
}