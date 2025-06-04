import * as cheerio from 'cheerio';

/**
 * Advanced treatment extractor that identifies all medical treatments and procedures
 * mentioned on a website, including specific medications, peptides, and brand names
 */

// Common treatment patterns to identify
const TREATMENT_PATTERNS = [
  // Specific medications and compounds
  /\b(bpc-?157|tb-?500|cjc-?1295|ipamorelin|sermorelin|mk-?677|ghrp-?[26])\b/gi,
  /\b(semaglutide|ozempic|wegovy|tirzepatide|mounjaro|rybelsus|saxenda)\b/gi,
  /\b(testosterone|cypionate|enanthate|propionate|sustanon|androgel)\b/gi,
  /\b(hcg|human chorionic gonadotropin|pregnyl|ovidrel)\b/gi,
  /\b(cialis|viagra|sildenafil|tadalafil|levitra|vardenafil)\b/gi,
  /\b(finasteride|propecia|dutasteride|avodart|minoxidil|rogaine)\b/gi,
  /\b(anastrozole|arimidex|letrozole|femara|exemestane|aromasin)\b/gi,
  /\b(clomid|clomiphene|nolvadex|tamoxifen|enclomiphene)\b/gi,
  /\b(metformin|glucophage|jardiance|invokana|farxiga)\b/gi,
  /\b(nad\+?|nicotinamide adenine dinucleotide|nmn|nr)\b/gi,
  /\b(glutathione|gsh|liposomal glutathione)\b/gi,
  
  // Treatment types
  /\b(injection|infusion|therapy|treatment|procedure|protocol)\b/gi,
  /\b(hormone|peptide|vitamin|nutrient|supplement)\s+(therapy|treatment|injection|infusion)/gi,
  /\b(iv|intravenous|intramuscular|subcutaneous|sublingual)\s+\w+/gi,
  
  // Specific therapies
  /\b(prp|platelet.?rich.?plasma|stem.?cell|exosome)\b/gi,
  /\b(shockwave|acoustic.?wave|gainswave|eswt)\b/gi,
  /\b(cryo|cold.?therapy|red.?light|infrared|pemf)\b/gi,
  /\b(hyperbaric|hbot|oxygen.?therapy|ozone)\b/gi,
  /\b(ketamine|tms|transcranial|psychedelic)\b/gi,
  
  // Brand names and devices
  /\b(phoenix|vitality|renew|restore|optimize|enhance)\s+\w+/gi,
  /\b(bioidentical|compound|custom|personalized)\s+\w+/gi
];

// Medical terminology indicators
const MEDICAL_INDICATORS = [
  'mg', 'mcg', 'iu', 'ml', 'cc', 'units',
  'daily', 'weekly', 'monthly', 'injection', 'infusion',
  'protocol', 'regimen', 'cycle', 'dose', 'dosage',
  'prescription', 'medication', 'compound', 'pharmaceutical'
];

// Context words that indicate treatment descriptions
const TREATMENT_CONTEXT = [
  'treat', 'therapy', 'improve', 'enhance', 'optimize', 'restore',
  'boost', 'increase', 'decrease', 'manage', 'address', 'target',
  'prescribe', 'administer', 'inject', 'infuse', 'supplement'
];

export interface ExtractedTreatment {
  term: string;           // The actual treatment term found
  category?: string;      // Category if matched to predefined
  type: 'medication' | 'peptide' | 'therapy' | 'procedure' | 'supplement' | 'unknown';
  confidence: number;     // 0-1 confidence score
  context?: string;       // Surrounding text for context
  frequency: number;      // How many times it appears
}

export interface TreatmentExtractionResult {
  treatments: ExtractedTreatment[];
  searchableTerms: string[];  // Optimized array for Firestore indexing
  categories: string[];       // High-level categories found
  specialties: string[];      // Medical specialties detected
}

export class TreatmentExtractor {
  
  /**
   * Extract all treatments from HTML content
   */
  extractTreatments(html: string): TreatmentExtractionResult {
    const $ = cheerio.load(html);
    const treatments = new Map<string, ExtractedTreatment>();
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Get all text content
    const textContent = $('body').text();
    const lowerContent = textContent.toLowerCase();
    
    // Extract treatments using patterns
    for (const pattern of TREATMENT_PATTERNS) {
      const matches = textContent.match(pattern) || [];
      for (const match of matches) {
        const normalized = this.normalizeTreatment(match);
        if (normalized && this.isValidTreatment(normalized, lowerContent)) {
          const existing = treatments.get(normalized.toLowerCase());
          if (existing) {
            existing.frequency++;
          } else {
            treatments.set(normalized.toLowerCase(), {
              term: normalized,
              type: this.classifyTreatment(normalized),
              confidence: this.calculateConfidence(normalized, lowerContent),
              context: this.extractContext(normalized, textContent),
              frequency: 1
            });
          }
        }
      }
    }
    
    // Extract from specific HTML elements
    this.extractFromElements($ as any, treatments);
    
    // Convert to array and sort by confidence/frequency
    const treatmentArray = Array.from(treatments.values())
      .sort((a, b) => (b.confidence * b.frequency) - (a.confidence * a.frequency));
    
    // Generate searchable terms (for Firestore indexing)
    const searchableTerms = this.generateSearchableTerms(treatmentArray);
    
    // Detect categories and specialties
    const categories = this.detectCategories(treatmentArray, textContent);
    const specialties = this.detectSpecialties(textContent);
    
    return {
      treatments: treatmentArray,
      searchableTerms,
      categories,
      specialties
    };
  }
  
  /**
   * Extract treatments from specific HTML elements like lists, tables, etc.
   */
  private extractFromElements($: cheerio.CheerioAPI, treatments: Map<string, ExtractedTreatment>): void {
    // Look for treatment lists
    $('ul li, ol li').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text.length < 100 && this.looksLikeTreatment(text)) {
        const normalized = this.normalizeTreatment(text);
        if (normalized && !treatments.has(normalized.toLowerCase())) {
          treatments.set(normalized.toLowerCase(), {
            term: normalized,
            type: this.classifyTreatment(normalized),
            confidence: 0.8,
            frequency: 1
          });
        }
      }
    });
    
    // Look in service sections
    $('[class*="service"], [id*="service"], [class*="treatment"], [id*="treatment"]').each((_, elem) => {
      const heading = $(elem).find('h1, h2, h3, h4, h5, h6').first().text().trim();
      if (heading && this.looksLikeTreatment(heading)) {
        const normalized = this.normalizeTreatment(heading);
        if (normalized && !treatments.has(normalized.toLowerCase())) {
          treatments.set(normalized.toLowerCase(), {
            term: normalized,
            type: this.classifyTreatment(normalized),
            confidence: 0.9,
            frequency: 1
          });
        }
      }
    });
  }
  
  /**
   * Normalize treatment names for consistency
   */
  private normalizeTreatment(term: string): string {
    return term
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[®™©]/g, '')
      .replace(/\b(therapy|treatment|protocol|regimen)\b/gi, '')
      .trim()
      .split(' ')
      .map((word, index) => {
        // Keep acronyms and numbers as-is
        if (/^[A-Z0-9-]+$/.test(word)) return word;
        // Capitalize first letter of regular words
        return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase();
      })
      .join(' ');
  }
  
  /**
   * Classify the type of treatment
   */
  private classifyTreatment(term: string): ExtractedTreatment['type'] {
    const lower = term.toLowerCase();
    
    if (/peptide|bpc|tb-|cjc|ipamorelin|ghrp/i.test(lower)) return 'peptide';
    if (/injection|infusion|iv|therapy/i.test(lower)) return 'therapy';
    if (/procedure|surgery|implant/i.test(lower)) return 'procedure';
    if (/vitamin|supplement|nutrient|mineral/i.test(lower)) return 'supplement';
    if (/[a-z]+ide|[a-z]+one|[a-z]+in|[a-z]+ol/i.test(lower)) return 'medication';
    
    return 'unknown';
  }
  
  /**
   * Calculate confidence score based on context
   */
  private calculateConfidence(term: string, content: string): number {
    let confidence = 0.5;
    const lower = term.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    // Check for medical indicators nearby
    for (const indicator of MEDICAL_INDICATORS) {
      if (lowerContent.includes(lower + ' ' + indicator) || 
          lowerContent.includes(indicator + ' ' + lower)) {
        confidence += 0.1;
      }
    }
    
    // Check for treatment context
    for (const context of TREATMENT_CONTEXT) {
      const regex = new RegExp(`${context}[^.]{0,50}${lower}|${lower}[^.]{0,50}${context}`, 'i');
      if (regex.test(content)) {
        confidence += 0.1;
      }
    }
    
    return Math.min(confidence, 1);
  }
  
  /**
   * Check if something looks like a treatment
   */
  private looksLikeTreatment(text: string): boolean {
    // Too short or too long
    if (text.length < 3 || text.length > 100) return false;
    
    // Contains medical indicators
    for (const indicator of MEDICAL_INDICATORS) {
      if (text.toLowerCase().includes(indicator)) return true;
    }
    
    // Contains treatment patterns
    return TREATMENT_PATTERNS.some(pattern => pattern.test(text));
  }
  
  /**
   * Validate if this is actually a treatment
   */
  private isValidTreatment(term: string, content: string): boolean {
    // Filter out common false positives
    const falsePositives = [
      'contact', 'about', 'home', 'blog', 'news', 'faq',
      'privacy', 'terms', 'policy', 'location', 'hours'
    ];
    
    return !falsePositives.includes(term.toLowerCase()) && term.length > 2;
  }
  
  /**
   * Extract surrounding context
   */
  private extractContext(term: string, content: string): string {
    const index = content.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + term.length + 100);
    
    return content.substring(start, end).replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Generate searchable terms for Firestore indexing
   */
  private generateSearchableTerms(treatments: ExtractedTreatment[]): string[] {
    const terms = new Set<string>();
    
    for (const treatment of treatments) {
      // Add the full term
      terms.add(treatment.term.toLowerCase());
      
      // Add individual words for partial matching
      const words = treatment.term.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
      
      // Add common variations
      const normalized = treatment.term.toLowerCase().replace(/[-\s]/g, '');
      if (normalized !== treatment.term.toLowerCase()) {
        terms.add(normalized);
      }
      
      // Add without numbers (e.g., "bpc157" from "bpc-157")
      const withoutDash = treatment.term.toLowerCase().replace(/-/g, '');
      if (withoutDash !== treatment.term.toLowerCase()) {
        terms.add(withoutDash);
      }
    }
    
    return Array.from(terms);
  }
  
  /**
   * Detect high-level categories from treatments
   */
  private detectCategories(treatments: ExtractedTreatment[], content: string): string[] {
    const categories = new Set<string>();
    
    const categoryMap = {
      'hormone': /hormone|testosterone|hrt|trt|estrogen|thyroid/i,
      'weight-loss': /weight|semaglutide|ozempic|wegovy|tirzepatide|mounjaro/i,
      'sexual-health': /erectile|ed |cialis|viagra|sexual|libido/i,
      'peptides': /peptide|bpc|tb-500|cjc|ipamorelin/i,
      'anti-aging': /anti-?aging|longevity|nad|regenerative/i,
      'aesthetics': /botox|filler|prp|hair|aesthetic/i,
      'wellness': /vitamin|nutrient|iv|infusion|wellness/i
    };
    
    for (const [category, pattern] of Object.entries(categoryMap)) {
      if (treatments.some(t => pattern.test(t.term)) || pattern.test(content)) {
        categories.add(category);
      }
    }
    
    return Array.from(categories);
  }
  
  /**
   * Detect medical specialties
   */
  private detectSpecialties(content: string): string[] {
    const specialties = new Set<string>();
    
    const specialtyPatterns = {
      'mens-health': /men's health|mens health|andrology/i,
      'hormone-specialist': /hormone specialist|endocrinologist/i,
      'anti-aging': /anti-?aging|age management|longevity/i,
      'regenerative': /regenerative|stem cell|prp/i,
      'integrative': /integrative|functional medicine|holistic/i
    };
    
    for (const [specialty, pattern] of Object.entries(specialtyPatterns)) {
      if (pattern.test(content)) {
        specialties.add(specialty);
      }
    }
    
    return Array.from(specialties);
  }
}

// Export singleton instance
export const treatmentExtractor = new TreatmentExtractor();