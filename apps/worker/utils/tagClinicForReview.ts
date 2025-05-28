import { ClinicInput } from '../types/clinic';
import { validateWebsiteIsReachable } from './validateWebsite';

export async function tagClinicForReview(clinic: ClinicInput): Promise<string[]> {
  const tags = [...clinic.tags]; // Start with existing tags
  
  // Check for missing website
  if (!clinic.website || clinic.website.trim() === '') {
    addTag(tags, 'missing-website');
  }
  
  // Check for invalid phone
  if (!clinic.phone || clinic.phone === 'invalid' || clinic.phone.trim() === '') {
    addTag(tags, 'invalid-phone');
  }
  
  // Check for incomplete address
  if (!clinic.address || !clinic.city || !clinic.state) {
    addTag(tags, 'incomplete-address');
  }
  
  // Check for missing name
  if (!clinic.name || clinic.name.trim() === '') {
    addTag(tags, 'missing-name');
  }
  
  // Check for missing services
  if (!clinic.services || clinic.services.length === 0) {
    addTag(tags, 'missing-services');
  }
  
  // Check website reachability (if website exists)
  if (clinic.website && clinic.website !== '') {
    try {
      const isReachable = await validateWebsiteIsReachable(clinic.website);
      if (!isReachable) {
        addTag(tags, 'website-down');
      }
    } catch (error) {
      console.warn(`Failed to check website reachability for ${clinic.name}:`, error);
      addTag(tags, 'website-check-failed');
    }
  }
  
  // Check for geocoding issues
  if (!clinic.lat || !clinic.lng || clinic.lat === 0 || clinic.lng === 0) {
    addTag(tags, 'geo-mismatch');
  }
  
  // Check for potential duplicates based on name similarity
  if (await isPotentialDuplicate(clinic)) {
    addTag(tags, 'potential-duplicate');
  }
  
  // Add quality score tags
  const qualityScore = calculateQualityScore(clinic);
  if (qualityScore < 60) {
    addTag(tags, 'low-quality');
  } else if (qualityScore > 90) {
    addTag(tags, 'high-quality');
  }
  
  return tags;
}

function addTag(tags: string[], tag: string): void {
  if (!tags.includes(tag)) {
    tags.push(tag);
  }
}

function calculateQualityScore(clinic: ClinicInput): number {
  let score = 0;
  
  // Name quality (20 points)
  if (clinic.name && clinic.name.length > 5) score += 20;
  else if (clinic.name) score += 10;
  
  // Address completeness (20 points)
  if (clinic.address && clinic.city && clinic.state && clinic.zip) score += 20;
  else if (clinic.address && clinic.city && clinic.state) score += 15;
  else if (clinic.city && clinic.state) score += 10;
  
  // Contact info (20 points)
  if (clinic.phone && clinic.phone !== 'invalid') score += 10;
  if (clinic.website && clinic.website !== '') score += 10;
  
  // Services (20 points)
  if (clinic.services && clinic.services.length >= 3) score += 20;
  else if (clinic.services && clinic.services.length >= 1) score += 10;
  
  // Geocoding (20 points)
  if (clinic.lat && clinic.lng && clinic.lat !== 0 && clinic.lng !== 0) score += 20;
  
  return score;
}

async function isPotentialDuplicate(clinic: ClinicInput): Promise<boolean> {
  // This is a simplified duplicate check
  // In a real implementation, you might want to check against existing clinics in Firestore
  
  // Check for obvious duplicate patterns
  const suspiciousPatterns = [
    /test\s*clinic/i,
    /sample\s*clinic/i,
    /demo\s*clinic/i,
    /example/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(clinic.name));
}