import { TAG_RULES, TagRule, ClinicMetrics, calculateSeverityScore } from './tagRuleLibrary';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface ClinicSuggestion {
  id: string;
  type: 'warning' | 'tip' | 'critical';
  message: string;
  action: string;
  relatedField: string;
  createdAt: Date;
  tagId: string;
}

export interface ClinicAnalysisResult {
  tags: string[];
  suggestions: ClinicSuggestion[];
  seoScore: number;
  previousTags?: string[];
  newTags: string[];
  resolvedTags: string[];
}

/**
 * Main function to analyze a clinic and assign tags/suggestions
 */
export async function analyzeClinicTags(
  clinicId: string, 
  clinicData?: any
): Promise<ClinicAnalysisResult> {
  try {
    console.log(`🔍 Analyzing tags for clinic: ${clinicId}`);
    
    // Get clinic data if not provided
    let clinic = clinicData;
    if (!clinic) {
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);
      
      if (!clinicSnap.exists()) {
        throw new Error(`Clinic ${clinicId} not found`);
      }
      
      clinic = { id: clinicSnap.id, ...clinicSnap.data() };
    }
    
    // Get clinic metrics
    const metrics = await getClinicMetrics(clinicId, clinic);
    
    // Store previous tags for comparison
    const previousTags = clinic.tags || [];
    
    // Evaluate all rules
    const matchedTags: string[] = [];
    const suggestions: ClinicSuggestion[] = [];
    
    for (const rule of TAG_RULES) {
      try {
        const matches = rule.evaluator(clinic, metrics);
        
        if (matches) {
          matchedTags.push(rule.id);
          
          // Generate suggestion
          const suggestion: ClinicSuggestion = {
            id: `${rule.id}-${Date.now()}`,
            type: mapSeverityToType(rule.severity),
            message: rule.suggestion.message,
            action: rule.suggestion.action,
            relatedField: rule.suggestion.relatedField,
            createdAt: new Date(),
            tagId: rule.id
          };
          
          suggestions.push(suggestion);
        }
      } catch (ruleError) {
        console.warn(`⚠️ Rule ${rule.id} evaluation failed:`, ruleError);
      }
    }
    
    // Calculate differences
    const newTags = matchedTags.filter(tag => !previousTags.includes(tag));
    const resolvedTags = previousTags.filter(tag => !matchedTags.includes(tag));
    
    // Calculate SEO score
    const seoScore = calculateSeverityScore(matchedTags);
    
    console.log(`✅ Analysis complete for ${clinicId}: ${matchedTags.length} tags, score: ${seoScore}`);
    
    return {
      tags: matchedTags,
      suggestions,
      seoScore,
      previousTags,
      newTags,
      resolvedTags
    };
    
  } catch (error) {
    console.error(`❌ Failed to analyze clinic ${clinicId}:`, error);
    throw error;
  }
}

/**
 * Collect metrics for a clinic from various sources
 */
async function getClinicMetrics(clinicId: string, clinic: any): Promise<ClinicMetrics> {
  try {
    // Get traffic data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Mock data for now - in real implementation, query actual collections
    const mockMetrics: ClinicMetrics = {
      clicksLast30: Math.floor(Math.random() * 100),
      impressionsLast30: Math.floor(Math.random() * 1000),
      callsLast30: Math.floor(Math.random() * 20),
      trafficLast90: Math.floor(Math.random() * 500),
      engagementRate: Math.random() * 0.1,
      lastActivity: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    };
    
    // In a real implementation, you would query:
    // - traffic_logs collection for clicks/impressions
    // - call_logs collection for call data
    // - engagement metrics from analytics
    
    return mockMetrics;
    
  } catch (error) {
    console.error(`Failed to get metrics for ${clinicId}:`, error);
    
    // Return zero metrics on error
    return {
      clicksLast30: 0,
      impressionsLast30: 0,
      callsLast30: 0,
      trafficLast90: 0,
      engagementRate: 0,
      lastActivity: new Date(0)
    };
  }
}

/**
 * Map rule severity to suggestion type
 */
function mapSeverityToType(severity: TagRule['severity']): 'warning' | 'tip' | 'critical' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'critical';
    case 'medium':
      return 'warning';
    case 'low':
    default:
      return 'tip';
  }
}

/**
 * Get summary statistics for tag analysis
 */
export function getTagAnalysisSummary(results: ClinicAnalysisResult[]): {
  totalProcessed: number;
  newTags: number;
  resolvedTags: number;
  criticalIssues: number;
  averageScore: number;
  tagDistribution: Record<string, number>;
} {
  const summary = {
    totalProcessed: results.length,
    newTags: results.reduce((sum, r) => sum + r.newTags.length, 0),
    resolvedTags: results.reduce((sum, r) => sum + r.resolvedTags.length, 0),
    criticalIssues: results.reduce((sum, r) => 
      sum + r.suggestions.filter(s => s.type === 'critical').length, 0
    ),
    averageScore: results.reduce((sum, r) => sum + r.seoScore, 0) / results.length,
    tagDistribution: {} as Record<string, number>
  };
  
  // Count tag occurrences
  results.forEach(result => {
    result.tags.forEach(tag => {
      summary.tagDistribution[tag] = (summary.tagDistribution[tag] || 0) + 1;
    });
  });
  
  return summary;
}