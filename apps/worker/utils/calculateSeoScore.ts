import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from '../lib/firebase-compat';

export interface SeoScoreComponents {
  metaCompleteness: number; // 0-30 points
  indexingStatus: number;   // 0-25 points
  keywordDiversity: number; // 0-25 points
  ctr: number;             // 0-20 points
}

export interface SeoScoreResult {
  clinic: string;
  score: number;
  components: SeoScoreComponents;
  recommendations: string[];
  updatedAt: Date;
}

export async function calculateSeoScore(clinicSlug: string): Promise<SeoScoreResult> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinic = clinicDoc.data();
    const components: SeoScoreComponents = {
      metaCompleteness: 0,
      indexingStatus: 0,
      keywordDiversity: 0,
      ctr: 0
    };
    
    const recommendations: string[] = [];
    
    // 1. Meta Completeness (0-30 points)
    let metaScore = 0;
    if (clinic.metaTitle && clinic.metaTitle.length >= 30) {
      metaScore += 10;
    } else {
      recommendations.push('Add comprehensive meta title (30+ characters)');
    }
    
    if (clinic.metaDescription && clinic.metaDescription.length >= 120) {
      metaScore += 10;
    } else {
      recommendations.push('Add detailed meta description (120+ characters)');
    }
    
    if (clinic.content && clinic.content.length >= 500) {
      metaScore += 10;
    } else {
      recommendations.push('Expand content to 500+ words for better SEO');
    }
    
    components.metaCompleteness = metaScore;
    
    // 2. Indexing Status (0-25 points)
    let indexingScore = 0;
    if (clinic.seoMeta?.indexed === true) {
      indexingScore = 25;
    } else if (clinic.seoMeta?.indexed === false) {
      indexingScore = 0;
      recommendations.push('Submit clinic page to Google for indexing');
    } else {
      indexingScore = 10; // Unknown status
      recommendations.push('Check Google indexing status');
    }
    
    components.indexingStatus = indexingScore;
    
    // 3. Keyword Diversity (0-25 points)
    let keywordScore = 0;
    const keywords = clinic.keywords || [];
    if (keywords.length >= 10) {
      keywordScore = 25;
    } else if (keywords.length >= 5) {
      keywordScore = 15;
    } else if (keywords.length >= 2) {
      keywordScore = 8;
    } else {
      recommendations.push('Add more relevant keywords for better search visibility');
    }
    
    components.keywordDiversity = keywordScore;
    
    // 4. CTR Performance (0-20 points)
    let ctrScore = 0;
    const traffic = clinic.traffic || {};
    const impressions = traffic.impressions30d || 0;
    const clicks = traffic.clicks30d || 0;
    
    if (impressions > 0) {
      const ctr = (clicks / impressions) * 100;
      if (ctr >= 5) {
        ctrScore = 20;
      } else if (ctr >= 3) {
        ctrScore = 15;
      } else if (ctr >= 1) {
        ctrScore = 10;
      } else {
        ctrScore = 5;
        recommendations.push('Optimize meta titles/descriptions to improve click-through rate');
      }
    } else {
      recommendations.push('Increase search visibility to generate impressions');
    }
    
    components.ctr = ctrScore;
    
    // Calculate total score
    const totalScore = Math.round(
      components.metaCompleteness + 
      components.indexingStatus + 
      components.keywordDiversity + 
      components.ctr
    );
    
    const result: SeoScoreResult = {
      clinic: clinicSlug,
      score: totalScore,
      components,
      recommendations,
      updatedAt: new Date()
    };
    
    // Update clinic document with SEO score
    await updateDoc(clinicRef, {
      'seoMeta.score': totalScore,
      'seoMeta.lastScored': new Date(),
      'seoMeta.components': components,
      'seoMeta.recommendations': recommendations
    });
    
    console.log(`SEO score calculated for ${clinicSlug}: ${totalScore}/100`);
    
    return result;
    
  } catch (error) {
    console.error(`Error calculating SEO score for ${clinicSlug}:`, error);
    throw error;
  }
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}