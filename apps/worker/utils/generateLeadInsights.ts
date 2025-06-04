import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from '../lib/firebase-compat';

export interface LeadInsights {
  totalLeads: number;
  responseRate: number;
  reviews: number;
  avgReviewScore: number;
  lastLeadAt?: Date;
  leadsBySource: Record<string, number>;
  conversionFunnel: {
    leads: number;
    reviewInvitesSent: number;
    reviewsCompleted: number;
    contactsCreated: number;
  };
  timeToResponse: {
    average: number; // in hours
    median: number;
    fastest: number;
    slowest: number;
  };
  qualityMetrics: {
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    engagementScore: number; // 0-100
  };
}

export interface InsightGenerationResult {
  clinicSlug: string;
  insights: LeadInsights;
  previousPeriod?: LeadInsights;
  trends: {
    leadsChange: number;
    responseRateChange: number;
    reviewsChange: number;
    avgScoreChange: number;
  };
  recommendations: string[];
  updatedAt: Date;
}

export async function generateLeadInsights(
  clinicSlug: string,
  periodDays: number = 30
): Promise<InsightGenerationResult> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    // Generate current period insights
    const currentInsights = await calculateInsightsForPeriod(clinicSlug, startDate, endDate);
    
    // Generate previous period insights for comparison
    const prevStartDate = new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const prevEndDate = startDate;
    const previousInsights = await calculateInsightsForPeriod(clinicSlug, prevStartDate, prevEndDate);
    
    // Calculate trends
    const trends = calculateTrends(currentInsights, previousInsights);
    
    // Generate recommendations
    const recommendations = generateRecommendations(currentInsights, trends);
    
    // Update clinic document with insights
    await updateClinicLeadStats(clinicSlug, currentInsights);
    
    const result: InsightGenerationResult = {
      clinicSlug,
      insights: currentInsights,
      previousPeriod: previousInsights,
      trends,
      recommendations,
      updatedAt: new Date()
    };
    
    console.log(`📊 Lead insights generated for ${clinicSlug}: ${currentInsights.totalLeads} leads, ${currentInsights.responseRate.toFixed(1)}% response rate`);
    
    return result;
    
  } catch (error) {
    console.error(`Error generating lead insights for ${clinicSlug}:`, error);
    throw error;
  }
}

async function calculateInsightsForPeriod(
  clinicSlug: string,
  startDate: Date,
  endDate: Date
): Promise<LeadInsights> {
  // Get leads data
  const leadsData = await getLeadsData(clinicSlug, startDate, endDate);
  
  // Get reviews data
  const reviewsData = await getReviewsData(clinicSlug, startDate, endDate);
  
  // Get review invites data
  const reviewInvitesData = await getReviewInvitesData(clinicSlug, startDate, endDate);
  
  // Get contacts data
  const contactsData = await getContactsData(clinicSlug, startDate, endDate);
  
  // Calculate metrics
  const totalLeads = leadsData.length;
  const reviews = reviewsData.length;
  const avgReviewScore = reviews > 0 
    ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviews 
    : 0;
    
  const lastLeadAt = leadsData.length > 0 
    ? new Date(Math.max(...leadsData.map(lead => lead.createdAt.getTime())))
    : undefined;
    
  // Calculate response rate (leads that got responses)
  const responseRate = calculateResponseRate(leadsData, reviewInvitesData);
  
  // Group leads by source
  const leadsBySource = groupLeadsBySource(leadsData);
  
  // Calculate conversion funnel
  const conversionFunnel = {
    leads: totalLeads,
    reviewInvitesSent: reviewInvitesData.length,
    reviewsCompleted: reviews,
    contactsCreated: contactsData.length
  };
  
  // Calculate time to response metrics
  const timeToResponse = calculateTimeToResponse(leadsData, reviewInvitesData);
  
  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(contactsData, leadsData);
  
  return {
    totalLeads,
    responseRate,
    reviews,
    avgReviewScore,
    lastLeadAt,
    leadsBySource,
    conversionFunnel,
    timeToResponse,
    qualityMetrics
  };
}

async function getLeadsData(clinicSlug: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const leadsRef = collection(db, 'leads');
    const leadsQuery = query(
      leadsRef,
      where('clinicSlug', '==', clinicSlug),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    
    const snapshot = await getDocs(leadsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error fetching leads data:', error);
    return [];
  }
}

async function getReviewsData(clinicSlug: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(
      reviewsRef,
      where('clinicSlug', '==', clinicSlug),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    
    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error fetching reviews data:', error);
    return [];
  }
}

async function getReviewInvitesData(clinicSlug: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const invitesRef = collection(db, 'reviewInvites');
    const invitesQuery = query(
      invitesRef,
      where('clinicSlug', '==', clinicSlug),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    
    const snapshot = await getDocs(invitesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error fetching review invites data:', error);
    return [];
  }
}

async function getContactsData(clinicSlug: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const contactsRef = collection(db, 'contacts');
    const contactsQuery = query(
      contactsRef,
      where('clinicSlug', '==', clinicSlug),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    
    const snapshot = await getDocs(contactsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error fetching contacts data:', error);
    return [];
  }
}

function calculateResponseRate(leadsData: any[], reviewInvitesData: any[]): number {
  if (leadsData.length === 0) return 0;
  
  // Count leads that have associated review invites or responses
  const respondedLeads = leadsData.filter(lead => 
    reviewInvitesData.some(invite => 
      invite.email === lead.email || invite.phone === lead.phone
    )
  );
  
  return (respondedLeads.length / leadsData.length) * 100;
}

function groupLeadsBySource(leadsData: any[]): Record<string, number> {
  const sources: Record<string, number> = {};
  
  for (const lead of leadsData) {
    const source = lead.source || 'unknown';
    sources[source] = (sources[source] || 0) + 1;
  }
  
  return sources;
}

function calculateTimeToResponse(leadsData: any[], reviewInvitesData: any[]): {
  average: number;
  median: number;
  fastest: number;
  slowest: number;
} {
  const responseTimes: number[] = [];
  
  for (const lead of leadsData) {
    const matchingInvite = reviewInvitesData.find(invite => 
      invite.email === lead.email || invite.phone === lead.phone
    );
    
    if (matchingInvite) {
      const leadTime = lead.createdAt.getTime();
      const inviteTime = matchingInvite.createdAt.getTime();
      const diffHours = (inviteTime - leadTime) / (1000 * 60 * 60);
      
      if (diffHours >= 0) {
        responseTimes.push(diffHours);
      }
    }
  }
  
  if (responseTimes.length === 0) {
    return { average: 0, median: 0, fastest: 0, slowest: 0 };
  }
  
  responseTimes.sort((a, b) => a - b);
  
  const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const median = responseTimes[Math.floor(responseTimes.length / 2)];
  const fastest = responseTimes[0];
  const slowest = responseTimes[responseTimes.length - 1];
  
  return { average, median, fastest, slowest };
}

function calculateQualityMetrics(contactsData: any[], leadsData: any[]): {
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  engagementScore: number;
} {
  const qualityCounts = contactsData.reduce((counts, contact) => {
    switch (contact.leadQuality) {
      case 'hot':
        counts.hotLeads++;
        break;
      case 'warm':
        counts.warmLeads++;
        break;
      case 'cold':
        counts.coldLeads++;
        break;
    }
    return counts;
  }, { hotLeads: 0, warmLeads: 0, coldLeads: 0 });
  
  // Calculate engagement score based on various factors
  let engagementScore = 0;
  
  if (leadsData.length > 0) {
    // Base score from lead volume
    engagementScore += Math.min(leadsData.length * 2, 30);
    
    // Bonus for high-quality leads
    engagementScore += qualityCounts.hotLeads * 15;
    engagementScore += qualityCounts.warmLeads * 10;
    engagementScore += qualityCounts.coldLeads * 5;
    
    // Bonus for conversion rate
    const conversionRate = contactsData.length / leadsData.length;
    engagementScore += conversionRate * 25;
    
    // Cap at 100
    engagementScore = Math.min(engagementScore, 100);
  }
  
  return {
    ...qualityCounts,
    engagementScore: Math.round(engagementScore)
  };
}

function calculateTrends(current: LeadInsights, previous: LeadInsights) {
  const leadsChange = previous.totalLeads > 0 
    ? ((current.totalLeads - previous.totalLeads) / previous.totalLeads) * 100 
    : 0;
    
  const responseRateChange = previous.responseRate > 0 
    ? current.responseRate - previous.responseRate 
    : 0;
    
  const reviewsChange = previous.reviews > 0 
    ? ((current.reviews - previous.reviews) / previous.reviews) * 100 
    : 0;
    
  const avgScoreChange = previous.avgReviewScore > 0 
    ? current.avgReviewScore - previous.avgReviewScore 
    : 0;
  
  return {
    leadsChange: Math.round(leadsChange * 10) / 10,
    responseRateChange: Math.round(responseRateChange * 10) / 10,
    reviewsChange: Math.round(reviewsChange * 10) / 10,
    avgScoreChange: Math.round(avgScoreChange * 10) / 10
  };
}

function generateRecommendations(insights: LeadInsights, trends: any): string[] {
  const recommendations: string[] = [];
  
  // Lead volume recommendations
  if (insights.totalLeads < 5) {
    recommendations.push('Increase lead generation efforts - consider more prominent contact forms');
  } else if (trends.leadsChange < -20) {
    recommendations.push('Lead volume is declining - review marketing strategies');
  }
  
  // Response rate recommendations
  if (insights.responseRate < 50) {
    recommendations.push('Improve response rate - set up automated follow-up sequences');
  }
  
  if (insights.timeToResponse.average > 24) {
    recommendations.push('Reduce response time - aim to follow up within 24 hours');
  }
  
  // Review recommendations
  if (insights.conversionFunnel.reviewsCompleted / insights.conversionFunnel.reviewInvitesSent < 0.3) {
    recommendations.push('Improve review invitation messaging to increase completion rates');
  }
  
  if (insights.avgReviewScore < 4.0 && insights.reviews >= 3) {
    recommendations.push('Address service quality issues - review feedback indicates room for improvement');
  }
  
  // Quality recommendations
  if (insights.qualityMetrics.hotLeads / insights.totalLeads < 0.2) {
    recommendations.push('Focus on lead quality - target more engaged prospects');
  }
  
  if (insights.qualityMetrics.engagementScore < 60) {
    recommendations.push('Increase engagement strategies - add more touchpoints in customer journey');
  }
  
  // Source recommendations
  const topSource = Object.entries(insights.leadsBySource)
    .sort(([a], [b]) => b - a)[0];
  
  if (topSource && topSource[1] > insights.totalLeads * 0.6) {
    recommendations.push(`Diversify lead sources - currently too dependent on ${topSource[0]}`);
  }
  
  return recommendations;
}

async function updateClinicLeadStats(clinicSlug: string, insights: LeadInsights): Promise<void> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    await updateDoc(clinicRef, {
      'leadStats.totalLeads': insights.totalLeads,
      'leadStats.responseRate': insights.responseRate,
      'leadStats.reviews': insights.reviews,
      'leadStats.avgReviewScore': insights.avgReviewScore,
      'leadStats.lastLeadAt': insights.lastLeadAt,
      'leadStats.engagementScore': insights.qualityMetrics.engagementScore,
      'leadStats.lastUpdated': serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating clinic lead stats:', error);
  }
}

export async function generateBulkLeadInsights(
  clinicSlugs?: string[],
  periodDays: number = 30
): Promise<InsightGenerationResult[]> {
  try {
    // If no specific clinics provided, get all active clinics
    if (!clinicSlugs) {
      const clinicsRef = collection(db, 'clinics');
      const clinicsQuery = query(clinicsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(clinicsQuery);
      clinicSlugs = snapshot.docs.map(doc => doc.id);
    }
    
    const results: InsightGenerationResult[] = [];
    
    for (const clinicSlug of clinicSlugs) {
      try {
        const result = await generateLeadInsights(clinicSlug, periodDays);
        results.push(result);
      } catch (error) {
        console.error(`Error generating insights for ${clinicSlug}:`, error);
      }
    }
    
    console.log(`📊 Generated lead insights for ${results.length} clinics`);
    
    return results;
    
  } catch (error) {
    console.error('Error generating bulk lead insights:', error);
    throw error;
  }
}