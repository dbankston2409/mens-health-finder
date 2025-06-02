import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from '../lib/firebase-compat';
import { defineRevenueLeakage } from '../utils/defineRevenueLeakage';
import { alertEngine } from '../utils/alertEngine';
import { calculateSeoScore } from '../utils/calculateSeoScore';

export interface MissedOpportunity {
  clinicSlug: string;
  clinicName: string;
  opportunityType: 'seo' | 'upgrade' | 'engagement' | 'traffic' | 'indexing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue: number;
  description: string;
  actionItems: string[];
  detectedAt: Date;
}

export interface MissedOpportunityResult {
  opportunitiesFound: number;
  alertsCreated: number;
  tagsAdded: number;
  suggestionsGenerated: number;
  totalValue: number;
  clinicsProcessed: number;
  errors: string[];
  summary: {
    seoOpportunities: number;
    upgradeOpportunities: number;
    engagementOpportunities: number;
    trafficOpportunities: number;
  };
}

export interface ScannerOptions {
  dryRun?: boolean;
  maxClinics?: number;
  minThreshold?: number; // Minimum value to consider as opportunity
  focusAreas?: ('seo' | 'upgrade' | 'engagement' | 'traffic')[];
  states?: string[];
}

export async function missedOpportunityScanner(
  options: ScannerOptions = {}
): Promise<MissedOpportunityResult> {
  try {
    const {
      dryRun = false,
      maxClinics = 500,
      minThreshold = 100,
      focusAreas = ['seo', 'upgrade', 'engagement', 'traffic'],
      states = []
    } = options;
    
    console.log(`🔍 Starting missed opportunity scan (${dryRun ? 'DRY RUN' : 'LIVE'})`);
    
    // Get all active clinics
    const clinics = await getTargetClinics(states, maxClinics);
    console.log(`Processing ${clinics.length} clinics`);
    
    let opportunitiesFound = 0;
    let alertsCreated = 0;
    let tagsAdded = 0;
    let suggestionsGenerated = 0;
    let totalValue = 0;
    const errors: string[] = [];
    
    const summary = {
      seoOpportunities: 0,
      upgradeOpportunities: 0,
      engagementOpportunities: 0,
      trafficOpportunities: 0
    };
    
    for (const clinic of clinics) {
      try {
        const opportunities = await scanClinicOpportunities(clinic, focusAreas, minThreshold);
        
        if (opportunities.length > 0) {
          opportunitiesFound += opportunities.length;
          totalValue += opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0);
          
          // Count by type
          opportunities.forEach(opp => {
            if (opp.opportunityType === 'seo') summary.seoOpportunities++;
            else if (opp.opportunityType === 'upgrade') summary.upgradeOpportunities++;
            else if (opp.opportunityType === 'engagement') summary.engagementOpportunities++;
            else if (opp.opportunityType === 'traffic') summary.trafficOpportunities++;
          });
          
          if (!dryRun) {
            // Add tags and suggestions
            const newTags = await addOpportunityTags(clinic.id, opportunities);
            const newSuggestions = await addOpportunitySuggestions(clinic.id, opportunities);
            
            tagsAdded += newTags;
            suggestionsGenerated += newSuggestions;
            
            console.log(`✅ Processed ${clinic.name}: ${opportunities.length} opportunities worth $${opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0)}`);
          } else {
            console.log(`[DRY RUN] ${clinic.name}: ${opportunities.length} opportunities worth $${opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0)}`);
          }
        }
        
      } catch (error) {
        const errorMsg = `Error processing clinic ${clinic.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Run alert engine to catch any systematic issues
    if (!dryRun) {
      try {
        const alertResult = await alertEngine({ maxAlerts: 20 });
        alertsCreated = alertResult.alertsCreated;
      } catch (error) {
        console.error('Error running alert engine:', error);
      }
    }
    
    const result: MissedOpportunityResult = {
      opportunitiesFound,
      alertsCreated,
      tagsAdded,
      suggestionsGenerated,
      totalValue,
      clinicsProcessed: clinics.length,
      errors,
      summary
    };
    
    console.log(`🎯 Scan complete: ${opportunitiesFound} opportunities worth $${totalValue} found across ${clinics.length} clinics`);
    
    return result;
    
  } catch (error) {
    console.error('Missed opportunity scanner error:', error);
    throw error;
  }
}

async function getTargetClinics(states: string[], maxClinics: number) {
  const clinicsRef = collection(db, 'clinics');
  
  // Build query constraints
  const constraints: any[] = [where('status', '==', 'active')];
  if (states.length > 0) {
    constraints.push(where('state', 'in', states));
  }
  
  const clinicsQuery = query(clinicsRef, ...constraints);
  const snapshot = await getDocs(clinicsQuery);
  const clinics = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .slice(0, maxClinics);
    
  return clinics;
}

async function scanClinicOpportunities(
  clinic: any,
  focusAreas: string[],
  minThreshold: number
): Promise<MissedOpportunity[]> {
  const opportunities: MissedOpportunity[] = [];
  
  // 1. SEO Opportunities
  if (focusAreas.includes('seo')) {
    const seoOpps = await detectSeoOpportunities(clinic, minThreshold);
    opportunities.push(...seoOpps);
  }
  
  // 2. Upgrade Opportunities
  if (focusAreas.includes('upgrade')) {
    const upgradeOpps = await detectUpgradeOpportunities(clinic, minThreshold);
    opportunities.push(...upgradeOpps);
  }
  
  // 3. Engagement Opportunities
  if (focusAreas.includes('engagement')) {
    const engagementOpps = await detectEngagementOpportunities(clinic, minThreshold);
    opportunities.push(...engagementOpps);
  }
  
  // 4. Traffic Opportunities
  if (focusAreas.includes('traffic')) {
    const trafficOpps = await detectTrafficOpportunities(clinic, minThreshold);
    opportunities.push(...trafficOpps);
  }
  
  return opportunities;
}

async function detectSeoOpportunities(clinic: any, minThreshold: number): Promise<MissedOpportunity[]> {
  const opportunities: MissedOpportunity[] = [];
  
  try {
    // Calculate or get SEO score
    let seoScore = clinic.seoMeta?.score;
    if (!seoScore) {
      const scoreResult = await calculateSeoScore(clinic.id);
      seoScore = scoreResult.score;
    }
    
    if (seoScore < 70) {
      const potentialValue = Math.floor((70 - seoScore) * 10); // Rough estimate
      
      if (potentialValue >= minThreshold) {
        opportunities.push({
          clinicSlug: clinic.id,
          clinicName: clinic.name,
          opportunityType: 'seo',
          severity: seoScore < 40 ? 'critical' : seoScore < 60 ? 'high' : 'medium',
          estimatedValue: potentialValue,
          description: `Low SEO score (${seoScore}/100) limiting organic visibility`,
          actionItems: [
            'Optimize meta titles and descriptions',
            'Add comprehensive content',
            'Improve keyword targeting',
            'Fix technical SEO issues'
          ],
          detectedAt: new Date()
        });
      }
    }
    
    // Check indexing status for premium clients
    if (['premium', 'enterprise'].includes(clinic.package) && clinic.seoMeta?.indexed === false) {
      opportunities.push({
        clinicSlug: clinic.id,
        clinicName: clinic.name,
        opportunityType: 'indexing',
        severity: 'critical',
        estimatedValue: 800, // Premium client not indexed is high value
        description: 'Premium listing not indexed by Google',
        actionItems: [
          'Submit to Google Search Console',
          'Fix indexing blockers',
          'Improve page speed',
          'Check robots.txt'
        ],
        detectedAt: new Date()
      });
    }
    
  } catch (error) {
    console.error(`Error detecting SEO opportunities for ${clinic.id}:`, error);
  }
  
  return opportunities;
}

async function detectUpgradeOpportunities(clinic: any, minThreshold: number): Promise<MissedOpportunity[]> {
  const opportunities: MissedOpportunity[] = [];
  
  const tier = clinic.package || 'free';
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const calls30d = clinic.traffic?.calls30d || 0;
  const engagement = clinic.engagement?.level;
  
  // High-traffic free/basic clinics
  if (['free', 'basic'].includes(tier) && clicks30d >= 30 && engagement === 'engaged') {
    const avgPatientValue = 200;
    const conversionRate = 0.03;
    const monthlyValue = (clicks30d + calls30d) * conversionRate * avgPatientValue;
    
    let suggestedPrice = 0;
    if (monthlyValue >= 5000) suggestedPrice = 599;
    else if (monthlyValue >= 2000) suggestedPrice = 299;
    else if (monthlyValue >= 500) suggestedPrice = 99;
    
    const currentPrice = tier === 'basic' ? 99 : 0;
    const upgradeValue = suggestedPrice - currentPrice;
    
    if (upgradeValue >= minThreshold) {
      opportunities.push({
        clinicSlug: clinic.id,
        clinicName: clinic.name,
        opportunityType: 'upgrade',
        severity: upgradeValue >= 300 ? 'high' : 'medium',
        estimatedValue: upgradeValue,
        description: `High-traffic ${tier} clinic ready for upgrade (${clicks30d} clicks, ${calls30d} calls)`,
        actionItems: [
          'Contact for upgrade consultation',
          'Demonstrate ROI with traffic data',
          'Offer trial period',
          'Highlight premium features'
        ],
        detectedAt: new Date()
      });
    }
  }
  
  return opportunities;
}

async function detectEngagementOpportunities(clinic: any, minThreshold: number): Promise<MissedOpportunity[]> {
  const opportunities: MissedOpportunity[] = [];
  
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const calls30d = clinic.traffic?.calls30d || 0;
  const hasCallTracking = clinic.callTracking?.enabled;
  
  // Missing call tracking for engaged clinics
  if (!hasCallTracking && clicks30d >= 20) {
    const expectedCalls = Math.floor(clicks30d * 0.05);
    const missedCalls = Math.max(0, expectedCalls - calls30d);
    const avgPatientValue = 200;
    const conversionRate = 0.15;
    const monthlyLoss = missedCalls * conversionRate * avgPatientValue;
    
    if (monthlyLoss >= minThreshold) {
      opportunities.push({
        clinicSlug: clinic.id,
        clinicName: clinic.name,
        opportunityType: 'engagement',
        severity: monthlyLoss >= 500 ? 'high' : 'medium',
        estimatedValue: monthlyLoss,
        description: `Missing call tracking - potentially losing ${missedCalls} calls/month`,
        actionItems: [
          'Enable call tracking system',
          'Add click-to-call buttons',
          'Optimize phone number placement',
          'Set up call analytics'
        ],
        detectedAt: new Date()
      });
    }
  }
  
  return opportunities;
}

async function detectTrafficOpportunities(clinic: any, minThreshold: number): Promise<MissedOpportunity[]> {
  const opportunities: MissedOpportunity[] = [];
  
  const clicks30d = clinic.traffic?.clicks30d || 0;
  const impressions30d = clinic.traffic?.impressions30d || 0;
  
  // Low CTR opportunities
  if (impressions30d > 100) {
    const ctr = (clicks30d / impressions30d) * 100;
    if (ctr < 2) { // Below 2% CTR
      const potentialClicks = Math.floor(impressions30d * 0.03) - clicks30d; // Target 3% CTR
      const avgPatientValue = 200;
      const conversionRate = 0.02;
      const monthlyValue = potentialClicks * conversionRate * avgPatientValue;
      
      if (monthlyValue >= minThreshold) {
        opportunities.push({
          clinicSlug: clinic.id,
          clinicName: clinic.name,
          opportunityType: 'traffic',
          severity: 'medium',
          estimatedValue: monthlyValue,
          description: `Low CTR (${ctr.toFixed(1)}%) - missing ${potentialClicks} potential clicks/month`,
          actionItems: [
            'Optimize meta titles for clicks',
            'Improve meta descriptions',
            'Add compelling calls-to-action',
            'Test different title variations'
          ],
          detectedAt: new Date()
        });
      }
    }
  }
  
  return opportunities;
}

async function addOpportunityTags(clinicSlug: string, opportunities: MissedOpportunity[]): Promise<number> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const tags = opportunities.map(opp => `opportunity-${opp.opportunityType}`);
    const uniqueTags = [...new Set(tags)];
    
    await updateDoc(clinicRef, {
      tags: arrayUnion(...uniqueTags)
    });
    
    return uniqueTags.length;
  } catch (error) {
    console.error(`Error adding tags for ${clinicSlug}:`, error);
    return 0;
  }
}

async function addOpportunitySuggestions(clinicSlug: string, opportunities: MissedOpportunity[]): Promise<number> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const suggestions = opportunities.flatMap(opp => 
      opp.actionItems.map(action => ({
        type: opp.opportunityType,
        action,
        value: opp.estimatedValue,
        priority: opp.severity,
        createdAt: new Date()
      }))
    );
    
    await updateDoc(clinicRef, {
      'opportunities.suggestions': arrayUnion(...suggestions),
      'opportunities.lastAnalyzed': new Date(),
      'opportunities.totalValue': opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0)
    });
    
    return suggestions.length;
  } catch (error) {
    console.error(`Error adding suggestions for ${clinicSlug}:`, error);
    return 0;
  }
}