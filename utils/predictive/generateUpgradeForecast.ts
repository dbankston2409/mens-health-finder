import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { UpgradeForecast, ForecastLog } from '../analytics/conversionModels';

export interface ForecastFactors {
  trafficTrend: number; // -1 to 1 (declining to growing)
  engagementScore: number; // 0-100
  revenueGrowth: number; // percentage change
  competitorActivity: number; // 0-100 (low to high activity)
  seasonality: number; // -1 to 1 (seasonal impact)
  contactFrequency: number; // days since last contact
  conversionTrend: number; // -1 to 1
  contentQuality: number; // 0-100
  tierPosition: number; // 0-100 (current tier relative to max)
}

export interface UpgradePrediction {
  clinicSlug: string;
  upgradeMode: 'tier' | 'package' | 'feature';
  currentTier: string;
  targetTier: string;
  predictionScore: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  factors: ForecastFactors;
  predictedRevenue: number;
  timeframe: number; // days
  recommendedActions: string[];
}

export async function generateUpgradeForecast(clinicSlug: string): Promise<UpgradeForecast> {
  try {
    // Get clinic data
    const clinicDoc = await getDoc(doc(db, 'clinics', clinicSlug));
    if (!clinicDoc.exists()) {
      throw new Error('Clinic not found');
    }
    
    const clinic = { id: clinicDoc.id, ...clinicDoc.data() };
    
    // Calculate factors
    const factors = await calculateForecastFactors(clinicSlug, clinic);
    
    // Generate prediction
    const prediction = calculateUpgradePrediction(clinic, factors);
    
    // Create forecast object
    const forecast: UpgradeForecast = {
      id: `forecast_${clinicSlug}_${Date.now()}`,
      clinicSlug,
      forecastDate: Timestamp.now(),
      upgradeMode: prediction.upgradeMode,
      currentTier: prediction.currentTier,
      targetTier: prediction.targetTier,
      predictionScore: prediction.predictionScore,
      confidence: prediction.confidence,
      factors: prediction.factors,
      predictedRevenue: prediction.predictedRevenue,
      timeframe: prediction.timeframe,
      recommendedActions: prediction.recommendedActions,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
    };
    
    // Log the forecast
    await logForecast(clinicSlug, 'upgrade', prediction);
    
    return forecast;
  } catch (error) {
    console.error('Error generating upgrade forecast:', error);
    throw new Error('Failed to generate upgrade forecast');
  }
}

async function calculateForecastFactors(clinicSlug: string, clinic: any): Promise<ForecastFactors> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Traffic trend (compare last 30 days to previous 30 days)
  const recentTraffic = await getTrafficMetrics(clinicSlug, thirtyDaysAgo, now);
  const previousTraffic = await getTrafficMetrics(clinicSlug, sixtyDaysAgo, thirtyDaysAgo);
  const trafficTrend = calculateTrend(recentTraffic.views, previousTraffic.views);

  // Engagement score (based on time on page, bounce rate, etc.)
  const engagementScore = await calculateEngagementScore(clinicSlug, thirtyDaysAgo, now);

  // Revenue growth
  const recentRevenue = recentTraffic.estimatedRevenue || 0;
  const previousRevenue = previousTraffic.estimatedRevenue || 0;
  const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Competitor activity (placeholder - would analyze competitor data)
  const competitorActivity = 50; // Medium activity baseline

  // Seasonality (based on historical patterns)
  const seasonality = calculateSeasonality(now.getMonth());

  // Contact frequency
  const contactFrequency = await getDaysSinceLastContact(clinicSlug);

  // Conversion trend
  const recentConversions = await getConversionMetrics(clinicSlug, thirtyDaysAgo, now);
  const previousConversions = await getConversionMetrics(clinicSlug, sixtyDaysAgo, thirtyDaysAgo);
  const conversionTrend = calculateTrend(recentConversions.rate, previousConversions.rate);

  // Content quality (based on SEO score, completeness, etc.)
  const contentQuality = calculateContentQuality(clinic);

  // Tier position
  const tierPosition = calculateTierPosition(clinic.tier || 'free');

  return {
    trafficTrend,
    engagementScore,
    revenueGrowth,
    competitorActivity,
    seasonality,
    contactFrequency,
    conversionTrend,
    contentQuality,
    tierPosition
  };
}

function calculateUpgradePrediction(clinic: any, factors: ForecastFactors): UpgradePrediction {
  const currentTier = clinic.tier || 'free';
  const tierHierarchy = ['free', 'basic', 'premium', 'enterprise'];
  const currentIndex = tierHierarchy.indexOf(currentTier);
  const targetTier = currentIndex < tierHierarchy.length - 1 ? tierHierarchy[currentIndex + 1] : currentTier;

  // Calculate prediction score using weighted factors
  const weights = {
    trafficTrend: 0.15,
    engagementScore: 0.12,
    revenueGrowth: 0.18,
    competitorActivity: 0.08,
    seasonality: 0.05,
    contactFrequency: 0.10,
    conversionTrend: 0.15,
    contentQuality: 0.10,
    tierPosition: 0.07
  };

  let predictionScore = 0;
  predictionScore += normalizeScore(factors.trafficTrend, -1, 1) * weights.trafficTrend;
  predictionScore += (factors.engagementScore / 100) * weights.engagementScore;
  predictionScore += Math.min(factors.revenueGrowth / 100, 1) * weights.revenueGrowth;
  predictionScore += (factors.competitorActivity / 100) * weights.competitorActivity;
  predictionScore += normalizeScore(factors.seasonality, -1, 1) * weights.seasonality;
  predictionScore += Math.max(0, 1 - factors.contactFrequency / 30) * weights.contactFrequency;
  predictionScore += normalizeScore(factors.conversionTrend, -1, 1) * weights.conversionTrend;
  predictionScore += (factors.contentQuality / 100) * weights.contentQuality;
  predictionScore += (factors.tierPosition / 100) * weights.tierPosition;

  predictionScore = Math.round(predictionScore * 100);

  // Determine confidence level
  const confidence = predictionScore >= 80 ? 'high' :
                    predictionScore >= 60 ? 'medium' : 'low';

  // Calculate predicted revenue
  const tierPricing = {
    basic: 299,
    premium: 599,
    enterprise: 1299
  };
  const predictedRevenue = tierPricing[targetTier as keyof typeof tierPricing] || 0;

  // Calculate timeframe (days until predicted conversion)
  const baseTimeframe = 30;
  const urgencyFactor = Math.max(0.5, 1 - (predictionScore / 100));
  const timeframe = Math.round(baseTimeframe * urgencyFactor);

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(factors, predictionScore, currentTier);

  return {
    clinicSlug: clinic.id,
    upgradeMode: 'tier',
    currentTier,
    targetTier,
    predictionScore,
    confidence,
    factors,
    predictedRevenue,
    timeframe,
    recommendedActions
  };
}

function generateRecommendedActions(factors: ForecastFactors, score: number, currentTier: string): string[] {
  const actions: string[] = [];

  if (factors.trafficTrend < 0) {
    actions.push('Improve SEO and content marketing to boost traffic');
  }

  if (factors.engagementScore < 60) {
    actions.push('Optimize page content and user experience');
  }

  if (factors.contactFrequency > 14) {
    actions.push('Schedule immediate follow-up call or email');
  }

  if (factors.conversionTrend < 0) {
    actions.push('Review and optimize conversion funnel');
  }

  if (factors.contentQuality < 70) {
    actions.push('Update clinic profile and add more content');
  }

  if (score >= 70) {
    actions.push(`Present ${currentTier === 'free' ? 'premium' : 'enterprise'} package benefits`);
    actions.push('Offer limited-time upgrade incentive');
  }

  if (score >= 60 && score < 70) {
    actions.push('Share case studies and success stories');
    actions.push('Provide free consultation or audit');
  }

  if (score < 60) {
    actions.push('Focus on relationship building and value demonstration');
    actions.push('Provide educational content and resources');
  }

  return actions.slice(0, 4); // Limit to top 4 actions
}

// Helper functions
function normalizeScore(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  const change = (current - previous) / previous;
  return Math.max(-1, Math.min(1, change));
}

function calculateSeasonality(month: number): number {
  // Healthcare tends to be higher in Q1 and Q4
  const seasonalMultipliers = {
    0: 0.8,  // January
    1: 0.9,  // February
    2: 0.7,  // March
    3: 0.6,  // April
    4: 0.5,  // May
    5: 0.4,  // June
    6: 0.3,  // July
    7: 0.4,  // August
    8: 0.6,  // September
    9: 0.8,  // October
    10: 0.9, // November
    11: 1.0  // December
  };
  
  return (seasonalMultipliers[month as keyof typeof seasonalMultipliers] - 0.5) * 2;
}

function calculateContentQuality(clinic: any): number {
  let score = 0;
  let maxScore = 0;

  // Check various content completeness factors
  if (clinic.description) { score += 20; }
  maxScore += 20;

  if (clinic.services && clinic.services.length > 0) { score += 15; }
  maxScore += 15;

  if (clinic.photos && clinic.photos.length > 0) { score += 15; }
  maxScore += 15;

  if (clinic.reviews && clinic.reviews.length > 0) { score += 10; }
  maxScore += 10;

  if (clinic.hours) { score += 10; }
  maxScore += 10;

  if (clinic.phone) { score += 10; }
  maxScore += 10;

  if (clinic.website) { score += 10; }
  maxScore += 10;

  if (clinic.seoScore && clinic.seoScore > 70) { score += 10; }
  maxScore += 10;

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

function calculateTierPosition(tier: string): number {
  const tierValues = {
    free: 25,
    basic: 50,
    premium: 75,
    enterprise: 100
  };
  
  return tierValues[tier as keyof typeof tierValues] || 0;
}

// Placeholder functions that would integrate with actual data
async function getTrafficMetrics(clinicSlug: string, startDate: Date, endDate: Date) {
  // In real implementation, query analytics data
  return {
    views: Math.floor(Math.random() * 1000) + 500,
    estimatedRevenue: Math.floor(Math.random() * 5000) + 1000
  };
}

async function calculateEngagementScore(clinicSlug: string, startDate: Date, endDate: Date): Promise<number> {
  // In real implementation, calculate from session data
  return Math.floor(Math.random() * 40) + 60; // 60-100 range
}

async function getDaysSinceLastContact(clinicSlug: string): Promise<number> {
  // In real implementation, query CRM contact data
  return Math.floor(Math.random() * 30); // 0-30 days
}

async function getConversionMetrics(clinicSlug: string, startDate: Date, endDate: Date) {
  // In real implementation, query conversion events
  return {
    rate: Math.random() * 10 + 2 // 2-12% conversion rate
  };
}

async function logForecast(clinicSlug: string, type: string, prediction: any): Promise<void> {
  try {
    const forecastLog: Omit<ForecastLog, 'id'> = {
      clinicSlug,
      date: new Date().toISOString().split('T')[0],
      forecastType: type as any,
      prediction,
      modelVersion: 'v1.0',
      createdAt: Timestamp.now()
    };
    
    await addDoc(collection(db, 'forecastLogs'), forecastLog);
  } catch (error) {
    console.error('Error logging forecast:', error);
  }
}

export { calculateForecastFactors, generateRecommendedActions };