interface ClinicData {
  slug: string;
  name: string;
  indexed: boolean;
  tier?: string;
  city: string;
  state: string;
  indexingMetrics?: {
    clicks: number;
    ctr: number;
    queries: string[];
  };
}

interface LostRevenueData {
  totalLostRevenue: number;
  breakdown: {
    notIndexed: number;
    noCallTracking: number;
    basicTier: number;
    missingContent: number;
  };
  topOpportunities: {
    clinicId: string;
    clinicName: string;
    estimatedLoss: number;
    issue: string;
    recommendation: string;
  }[];
}

// Industry benchmarks for revenue calculation
const REVENUE_CONSTANTS = {
  // Average monthly revenue per patient
  REVENUE_PER_PATIENT: 300,
  
  // Conversion rates
  CLICK_TO_LEAD_RATE: 0.05, // 5% of clicks become leads
  LEAD_TO_PATIENT_RATE: 0.20, // 20% of leads become patients
  
  // Multipliers for different issues
  NOT_INDEXED_IMPACT: 0.8, // 80% of potential traffic lost
  BASIC_TIER_IMPACT: 0.4, // 40% of potential revenue lost
  MISSING_CONTENT_IMPACT: 0.3, // 30% conversion penalty
  NO_CALL_TRACKING_IMPACT: 0.25, // 25% of calls not optimized
  
  // Market factors
  MARKET_PENETRATION: {
    'CA': 1.5, // High competition markets
    'TX': 1.3,
    'FL': 1.2,
    'NY': 1.4,
    'default': 1.0
  }
};

export function calculateLostRevenue(clinics: ClinicData[]): LostRevenueData {
  let totalLostRevenue = 0;
  const breakdown = {
    notIndexed: 0,
    noCallTracking: 0,
    basicTier: 0,
    missingContent: 0
  };
  const opportunities: any[] = [];

  clinics.forEach(clinic => {
    const marketMultiplier = REVENUE_CONSTANTS.MARKET_PENETRATION[clinic.state as keyof typeof REVENUE_CONSTANTS.MARKET_PENETRATION] 
      || REVENUE_CONSTANTS.MARKET_PENETRATION.default;
    
    // Base potential monthly revenue (what they could be making)
    const baseMonthlyClicks = clinic.indexingMetrics?.clicks || estimateBaseClicks(clinic);
    const potentialLeads = baseMonthlyClicks * REVENUE_CONSTANTS.CLICK_TO_LEAD_RATE;
    const potentialPatients = potentialLeads * REVENUE_CONSTANTS.LEAD_TO_PATIENT_RATE;
    const potentialRevenue = potentialPatients * REVENUE_CONSTANTS.REVENUE_PER_PATIENT * marketMultiplier;

    let clinicLostRevenue = 0;
    let primaryIssue = '';
    let recommendation = '';

    // Calculate losses for different issues
    if (!clinic.indexed) {
      const notIndexedLoss = potentialRevenue * REVENUE_CONSTANTS.NOT_INDEXED_IMPACT;
      breakdown.notIndexed += notIndexedLoss;
      clinicLostRevenue += notIndexedLoss;
      primaryIssue = 'Not Indexed';
      recommendation = 'Trigger SEO regeneration and submit to Google Search Console';
    } else {
      // For indexed clinics, check other issues
      
      if (clinic.tier === 'basic' || !clinic.tier) {
        const basicTierLoss = potentialRevenue * REVENUE_CONSTANTS.BASIC_TIER_IMPACT;
        breakdown.basicTier += basicTierLoss;
        clinicLostRevenue += basicTierLoss;
        
        if (!primaryIssue) {
          primaryIssue = 'Basic Tier';
          recommendation = 'Upgrade to premium tier to unlock call tracking and enhanced features';
        }
      }
      
      // Check for missing content (low clicks relative to potential)
      const actualClicks = clinic.indexingMetrics?.clicks || 0;
      if (actualClicks < baseMonthlyClicks * 0.3) { // Less than 30% of potential
        const missingContentLoss = potentialRevenue * REVENUE_CONSTANTS.MISSING_CONTENT_IMPACT;
        breakdown.missingContent += missingContentLoss;
        clinicLostRevenue += missingContentLoss;
        
        if (!primaryIssue) {
          primaryIssue = 'Missing Content';
          recommendation = 'Add photos, update description, and optimize SEO content';
        }
      }
      
      // Check for call tracking (assume basic tier doesn't have it)
      if (clinic.tier === 'basic' || !clinic.tier) {
        const noCallTrackingLoss = potentialRevenue * REVENUE_CONSTANTS.NO_CALL_TRACKING_IMPACT;
        breakdown.noCallTracking += noCallTrackingLoss;
        
        if (!primaryIssue) {
          primaryIssue = 'No Call Tracking';
          recommendation = 'Enable call tracking to optimize phone conversions';
        }
      }
    }

    if (clinicLostRevenue > 0) {
      opportunities.push({
        clinicId: clinic.slug,
        clinicName: clinic.name,
        estimatedLoss: clinicLostRevenue,
        issue: primaryIssue,
        recommendation
      });
    }

    totalLostRevenue += clinicLostRevenue;
  });

  // Sort opportunities by potential loss (highest first)
  opportunities.sort((a, b) => b.estimatedLoss - a.estimatedLoss);

  return {
    totalLostRevenue,
    breakdown,
    topOpportunities: opportunities.slice(0, 10) // Top 10 opportunities
  };
}

function estimateBaseClicks(clinic: ClinicData): number {
  // Estimate potential monthly clicks based on location and market size
  const stateMultipliers: { [key: string]: number } = {
    'CA': 150, // High population, high competition
    'TX': 120,
    'FL': 110,
    'NY': 140,
    'IL': 100,
    'PA': 90,
    'OH': 80,
    'default': 70
  };
  
  const baseClicks = stateMultipliers[clinic.state] || stateMultipliers.default;
  
  // Add some randomness to make it more realistic
  return Math.floor(baseClicks * (0.8 + Math.random() * 0.4)); // ±20% variance
}

export function getRevenueImprovementSuggestions(clinic: ClinicData): string[] {
  const suggestions: string[] = [];
  
  if (!clinic.indexed) {
    suggestions.push('Submit sitemap to Google Search Console');
    suggestions.push('Generate fresh SEO content');
    suggestions.push('Check for technical SEO issues');
  }
  
  if (clinic.tier === 'basic' || !clinic.tier) {
    suggestions.push('Upgrade to premium tier for enhanced features');
    suggestions.push('Enable call tracking and analytics');
    suggestions.push('Add premium listing badges');
  }
  
  const actualClicks = clinic.indexingMetrics?.clicks || 0;
  if (actualClicks < 30) {
    suggestions.push('Add high-quality photos to listing');
    suggestions.push('Update clinic description with key services');
    suggestions.push('Encourage patient reviews');
    suggestions.push('Optimize for local search terms');
  }
  
  return suggestions;
}

export function calculateROI(investmentCost: number, monthlyRevenueIncrease: number): {
  monthsToBreakeven: number;
  yearlyROI: number;
  netBenefit: number;
} {
  const yearlyIncrease = monthlyRevenueIncrease * 12;
  const monthsToBreakeven = investmentCost / monthlyRevenueIncrease;
  const yearlyROI = ((yearlyIncrease - investmentCost) / investmentCost) * 100;
  const netBenefit = yearlyIncrease - investmentCost;
  
  return {
    monthsToBreakeven: Math.round(monthsToBreakeven * 10) / 10,
    yearlyROI: Math.round(yearlyROI * 10) / 10,
    netBenefit: Math.round(netBenefit)
  };
}