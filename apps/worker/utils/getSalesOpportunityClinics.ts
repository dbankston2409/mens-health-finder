import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from '../lib/firebase-compat';

export interface SalesOpportunityClinic {
  slug: string;
  name: string;
  city: string;
  state: string;
  clicks: number;
  calls: number;
  package: string;
  engagement: string;
  hasCallTracking: boolean;
  revenueOpportunity: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SalesOpportunityFilters {
  minClicks?: number;
  maxResults?: number;
  includeBasic?: boolean;
  requireNoCallTracking?: boolean;
}

export async function getSalesOpportunityClinics(
  filters: SalesOpportunityFilters = {}
): Promise<SalesOpportunityClinic[]> {
  try {
    const {
      minClicks = 20,
      maxResults = 50,
      includeBasic = true,
      requireNoCallTracking = true
    } = filters;
    
    // Query clinics with potential
    const clinicsRef = collection(db, 'clinics');
    const clinicsQuery = query(
      clinicsRef,
      where('status', '==', 'active'),
      orderBy('traffic.clicks30d', 'desc'),
      limit(maxResults * 2) // Get more to filter
    );
    
    const snapshot = await getDocs(clinicsQuery);
    const opportunities: SalesOpportunityClinic[] = [];
    
    for (const doc of snapshot.docs) {
      const clinic = doc.data();
      const clinicSlug = doc.id;
      
      // Apply filters
      const tier = clinic.package || 'free';
      const clicks30d = clinic.traffic?.clicks30d || 0;
      const calls30d = clinic.traffic?.calls30d || 0;
      const engagement = clinic.engagement?.level || 'none';
      const hasCallTracking = clinic.callTracking?.enabled === true;
      
      // Filter criteria
      if (!['free', 'basic'].includes(tier) && !includeBasic) continue;
      if (clicks30d < minClicks) continue;
      if (engagement !== 'engaged') continue;
      if (requireNoCallTracking && hasCallTracking) continue;
      
      // Calculate revenue opportunity
      const revenueOpportunity = calculateRevenueOpportunity(clicks30d, calls30d, tier);
      
      // Determine priority
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (clicks30d >= 100 && tier === 'free') {
        priority = 'high';
      } else if (clicks30d >= 50 || tier === 'basic') {
        priority = 'medium';
      }
      
      opportunities.push({
        slug: clinicSlug,
        name: clinic.name || 'Unknown Clinic',
        city: clinic.city || 'Unknown',
        state: clinic.state || 'Unknown',
        clicks: clicks30d,
        calls: calls30d,
        package: tier,
        engagement,
        hasCallTracking,
        revenueOpportunity,
        priority
      });
    }
    
    // Sort by priority and revenue opportunity
    opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.revenueOpportunity - a.revenueOpportunity;
    });
    
    console.log(`Found ${opportunities.length} sales opportunities`);
    
    return opportunities.slice(0, maxResults);
    
  } catch (error) {
    console.error('Error getting sales opportunity clinics:', error);
    throw error;
  }
}

function calculateRevenueOpportunity(clicks: number, calls: number, currentTier: string): number {
  // Revenue potential from upgrading
  const tierPricing = {
    free: 0,
    basic: 99,
    premium: 299,
    enterprise: 599
  };
  
  // Estimate conversion value
  const avgPatientValue = 200;
  const clickConversionRate = 0.02;
  const callConversionRate = 0.20;
  
  const monthlyPatients = (clicks * clickConversionRate) + (calls * callConversionRate);
  const monthlyPatientValue = monthlyPatients * avgPatientValue;
  
  // Calculate what they could pay for upgrades
  let suggestedTier = 'basic';
  if (monthlyPatientValue >= 5000) {
    suggestedTier = 'enterprise';
  } else if (monthlyPatientValue >= 2000) {
    suggestedTier = 'premium';
  }
  
  const currentPrice = tierPricing[currentTier as keyof typeof tierPricing] || 0;
  const suggestedPrice = tierPricing[suggestedTier as keyof typeof tierPricing] || 0;
  
  return Math.max(0, suggestedPrice - currentPrice);
}

export async function getTopSalesProspects(count: number = 10): Promise<SalesOpportunityClinic[]> {
  return getSalesOpportunityClinics({
    minClicks: 30,
    maxResults: count,
    requireNoCallTracking: true
  });
}

export function formatOpportunityValue(opportunity: SalesOpportunityClinic): string {
  if (opportunity.revenueOpportunity >= 500) {
    return `$${opportunity.revenueOpportunity}/mo upgrade opportunity`;
  }
  return `${opportunity.clicks} clicks, ${opportunity.calls} calls`;
}