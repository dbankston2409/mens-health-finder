import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface RevenueLeakage {
  type: 'missed-call-leads' | 'unindexed-premium' | 'traffic-loss' | 'upgrade-missed' | 'seo-gaps';
  estimate: number;
  description: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  monthlyImpact: number;
}

export interface RevenueLeakageResult {
  clinic: string;
  totalMonthlyLoss: number;
  leakages: RevenueLeakage[];
  recommendations: string[];
  updatedAt: Date;
}

export async function defineRevenueLeakage(clinicSlug: string): Promise<RevenueLeakageResult> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinic = clinicDoc.data();
    const leakages: RevenueLeakage[] = [];
    const recommendations: string[] = [];
    
    // 1. Missed Call Leads
    const callLeakage = calculateCallLeads(clinic);
    if (callLeakage) {
      leakages.push(callLeakage);
      recommendations.push('Enable call tracking to capture missed leads');
    }
    
    // 2. Unindexed Premium Listings
    const indexingLeakage = calculateIndexingLoss(clinic);
    if (indexingLeakage) {
      leakages.push(indexingLeakage);
      recommendations.push('Submit sitemap and improve SEO for Google indexing');
    }
    
    // 3. Traffic Loss from SEO Issues
    const seoLeakage = calculateSEOLoss(clinic);
    if (seoLeakage) {
      leakages.push(seoLeakage);
      recommendations.push('Optimize meta tags, content, and keywords');
    }
    
    // 4. Missed Upgrade Opportunities
    const upgradeLeakage = calculateUpgradeMissed(clinic);
    if (upgradeLeakage) {
      leakages.push(upgradeLeakage);
      recommendations.push('Contact high-traffic free/basic clinics for upgrades');
    }
    
    // 5. Geographic/Competition Gaps
    const competitionLeakage = calculateCompetitionLoss(clinic);
    if (competitionLeakage) {
      leakages.push(competitionLeakage);
      recommendations.push('Expand service areas and competitive positioning');
    }
    
    const totalMonthlyLoss = leakages.reduce((sum, leak) => sum + leak.monthlyImpact, 0);
    
    const result: RevenueLeakageResult = {
      clinic: clinicSlug,
      totalMonthlyLoss,
      leakages,
      recommendations,
      updatedAt: new Date()
    };
    
    // Log significant leakages (>$1,000/month)
    if (totalMonthlyLoss >= 1000) {
      console.log(`💰 Revenue leakage detected for ${clinic.name}: $${totalMonthlyLoss}/month`);
      
      // Update clinic document with leakage data
      await updateDoc(clinicRef, {
        'revenueLeaks': leakages.map(leak => ({
          type: leak.type,
          estimate: leak.estimate,
          detectedAt: leak.detectedAt,
          monthlyImpact: leak.monthlyImpact,
          severity: leak.severity
        })),
        'revenue.leakageAnalysis': {
          totalMonthlyLoss,
          lastAnalyzed: new Date(),
          recommendations
        }
      });
    }
    
    return result;
    
  } catch (error) {
    console.error(`Error analyzing revenue leakage for ${clinicSlug}:`, error);
    throw error;
  }
}

function calculateCallLeads(clinic: any): RevenueLeakage | null {
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const calls30d = clinic.traffic?.calls30d || 0;
  const hasCallTracking = clinic.callTracking?.enabled === true;
  
  if (hasCallTracking || clicks30d < 10) return null;
  
  // Estimate missed calls based on industry averages
  const expectedCallRate = 0.05; // 5% of clicks should convert to calls
  const expectedCalls = Math.floor(clicks30d * expectedCallRate);
  const missedCalls = Math.max(0, expectedCalls - calls30d);
  
  if (missedCalls === 0) return null;
  
  const avgPatientValue = 200;
  const callConversionRate = 0.15; // 15% of calls convert to patients
  const monthlyLoss = missedCalls * callConversionRate * avgPatientValue;
  
  if (monthlyLoss < 100) return null;
  
  return {
    type: 'missed-call-leads',
    estimate: monthlyLoss,
    description: `Missing ${missedCalls} potential calls/month without call tracking`,
    detectedAt: new Date(),
    severity: monthlyLoss >= 1000 ? 'critical' : monthlyLoss >= 500 ? 'high' : 'medium',
    actionItems: [
      'Enable call tracking system',
      'Add click-to-call buttons',
      'Optimize phone number placement'
    ],
    monthlyImpact: monthlyLoss
  };
}

function calculateIndexingLoss(clinic: any): RevenueLeakage | null {
  const isPremium = ['premium', 'enterprise'].includes(clinic.package);
  const isIndexed = clinic.seoMeta?.indexed === true;
  
  if (!isPremium || isIndexed) return null;
  
  // Premium clients not indexed lose significant visibility
  const potentialClicks = 200; // Estimated monthly organic clicks if indexed
  const avgPatientValue = 200;
  const clickConversionRate = 0.02;
  const monthlyLoss = potentialClicks * clickConversionRate * avgPatientValue;
  
  return {
    type: 'unindexed-premium',
    estimate: monthlyLoss,
    description: 'Premium listing not indexed by Google, losing organic visibility',
    detectedAt: new Date(),
    severity: 'critical',
    actionItems: [
      'Submit clinic page to Google Search Console',
      'Fix indexing blockers (robots.txt, meta tags)',
      'Improve page load speed and mobile optimization'
    ],
    monthlyImpact: monthlyLoss
  };
}

function calculateSEOLoss(clinic: any): RevenueLeakage | null {
  const seoScore = clinic.seoMeta?.score || 0;
  const currentClicks = clinic.traffic?.clicks30d || 0;
  
  if (seoScore >= 70 || currentClicks === 0) return null;
  
  // Estimate traffic loss from poor SEO
  const potentialMultiplier = Math.max(1.5, (100 - seoScore) / 30);
  const potentialClicks = Math.floor(currentClicks * potentialMultiplier);
  const missedClicks = potentialClicks - currentClicks;
  
  if (missedClicks < 20) return null;
  
  const avgPatientValue = 200;
  const clickConversionRate = 0.02;
  const monthlyLoss = missedClicks * clickConversionRate * avgPatientValue;
  
  return {
    type: 'seo-gaps',
    estimate: monthlyLoss,
    description: `Poor SEO score (${seoScore}/100) limiting organic traffic potential`,
    detectedAt: new Date(),
    severity: monthlyLoss >= 800 ? 'high' : 'medium',
    actionItems: [
      'Optimize meta titles and descriptions',
      'Add comprehensive content (500+ words)',
      'Improve keyword targeting',
      'Fix technical SEO issues'
    ],
    monthlyImpact: monthlyLoss
  };
}

function calculateUpgradeMissed(clinic: any): RevenueLeakage | null {
  const tier = clinic.package || 'free';
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const engagement = clinic.engagement?.level;
  
  // Only analyze free/basic clinics with high engagement
  if (!['free', 'basic'].includes(tier) || engagement !== 'engaged' || clicks30d < 30) {
    return null;
  }
  
  // Calculate what they could pay for upgrades
  const avgPatientValue = 200;
  const clickConversionRate = 0.02;
  const monthlyPatients = clicks30d * clickConversionRate;
  const monthlyRevenue = monthlyPatients * avgPatientValue;
  
  // Suggest upgrade pricing based on value generated
  let suggestedPrice = 0;
  if (monthlyRevenue >= 5000) suggestedPrice = 599; // Enterprise
  else if (monthlyRevenue >= 2000) suggestedPrice = 299; // Premium
  else if (monthlyRevenue >= 500) suggestedPrice = 99; // Basic
  
  const currentPrice = tier === 'basic' ? 99 : 0;
  const upgradeValue = suggestedPrice - currentPrice;
  
  if (upgradeValue <= 0) return null;
  
  return {
    type: 'upgrade-missed',
    estimate: upgradeValue,
    description: `High-traffic ${tier} clinic ready for ${upgradeValue > 200 ? 'premium' : 'basic'} upgrade`,
    detectedAt: new Date(),
    severity: upgradeValue >= 300 ? 'high' : 'medium',
    actionItems: [
      'Contact clinic for upgrade consultation',
      'Demonstrate ROI with current traffic data',
      'Offer trial period for premium features'
    ],
    monthlyImpact: upgradeValue
  };
}

function calculateCompetitionLoss(clinic: any): RevenueLeakage | null {
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const calls30d = clinic.traffic?.calls30d || 0;
  
  // Only analyze if clinic has some activity
  if (clicks30d + calls30d < 10) return null;
  
  // Estimate competition impact (simplified)
  const competitionFactor = 0.3; // Assume losing 30% to competitors
  const missedOpportunity = (clicks30d + calls30d) * competitionFactor;
  
  if (missedOpportunity < 5) return null;
  
  const avgPatientValue = 200;
  const conversionRate = 0.08; // Average of clicks and calls
  const monthlyLoss = missedOpportunity * conversionRate * avgPatientValue;
  
  if (monthlyLoss < 200) return null;
  
  return {
    type: 'traffic-loss',
    estimate: monthlyLoss,
    description: 'Potential traffic loss to competitors in service area',
    detectedAt: new Date(),
    severity: 'low',
    actionItems: [
      'Analyze competitor listings and pricing',
      'Improve competitive positioning',
      'Expand service area coverage',
      'Enhance unique value propositions'
    ],
    monthlyImpact: monthlyLoss
  };
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-blue-600';
    default: return 'text-gray-600';
  }
}