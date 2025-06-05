import * as cheerio from 'cheerio';

/**
 * Advanced treatment extractor that identifies all medical treatments and procedures
 * mentioned on a website, including specific medications, peptides, and brand names
 */

// Comprehensive treatment patterns organized by category
const TREATMENT_PATTERNS = {
  // HORMONE OPTIMIZATION
  hormone_optimization: [
    // Testosterone therapies
    /\b(testosterone cypionate|test cyp|test-?c|cypionate|depo-?testosterone)\b/gi,
    /\b(testosterone enanthate|test e|test-?e|enanthate|delatestryl)\b/gi,
    /\b(testosterone propionate|test p|test-?p|propionate)\b/gi,
    /\b(testosterone undecanoate|jatenzo|aveed|nebido)\b/gi,
    /\b(androgel|testim|fortesta|axiron|natesto|vogelxo)\b/gi,
    // Thyroid optimization
    /\b(levothyroxine|synthroid|unithroid|levoxyl)\b/gi,
    /\b(liothyronine|cytomel|t3)\b/gi,
    /\b(armour thyroid|np thyroid|thyroid usp|desiccated thyroid)\b/gi,
    // DHEA and other hormones
    /\b(dhea|dehydroepiandrosterone|7-?keto dhea|micronized dhea)\b/gi,
    // Estrogen blockers and support
    /\b(anastrozole|arimidex|letrozole|femara|exemestane|aromasin)\b/gi,
    /\b(clomiphene|clomid|enclomiphene|nolvadex|tamoxifen)\b/gi,
    /\b(hcg|human chorionic gonadotropin|pregnyl|ovidrel)\b/gi
  ],

  // SEXUAL HEALTH
  sexual_health: [
    // ED medications
    /\b(sildenafil|viagra|generic viagra)\b/gi,
    /\b(tadalafil|cialis|generic cialis)\b/gi,
    /\b(vardenafil|levitra|staxyn)\b/gi,
    /\b(avanafil|stendra)\b/gi,
    // Injectable ED treatments
    /\b(trimix|tri-?mix|triple mix|bimix|bi-?mix|quadmix|quad-?mix)\b/gi,
    /\b(alprostadil|caverject|edex|muse)\b/gi,
    // Sexual enhancement
    /\b(pt-?141|bremelanotide|vyleesi)\b/gi,
    /\b(oxytocin|kisspeptin|melanotan)\b/gi,
    // Procedures
    /\b(p-?shot|priapus shot|prp penis|penile prp)\b/gi,
    /\b(gainswave|gains wave|shockwave therapy|acoustic wave|eswt)\b/gi,
    /\b(phoenix|pulse wave|radial wave)\b/gi
  ],

  // PEPTIDES & PERFORMANCE
  peptides_performance: [
    // Growth hormone secretagogues
    /\b(cjc-?1295|cjc 1295|mod grf)\b/gi,
    /\b(ipamorelin|ipa|ipam)\b/gi,
    /\b(sermorelin|serm|grf)\b/gi,
    /\b(tesamorelin|egrifta)\b/gi,
    /\b(mk-?677|mk 677|ibutamoren)\b/gi,
    /\b(ghrp-?[26]|ghrp [26]|hexarelin)\b/gi,
    /\b(gh frag 176-?191|hgh frag|fragment 176)\b/gi,
    /\b(igf-?1|igf1|lr3|des)\b/gi,
    // Recovery peptides
    /\b(bpc-?157|bpc 157|body protection compound)\b/gi,
    /\b(tb-?500|tb 500|thymosin beta)\b/gi,
    /\b(aod-?9604|aod 9604)\b/gi,
    /\b(ghk-?cu|copper peptide)\b/gi,
    // Other performance peptides
    /\b(mots-?c|mitochondrial peptide)\b/gi,
    /\b(5-?amino-?1mq|5amino1mq)\b/gi,
    /\b(ll-?37|thymosin alpha)\b/gi,
    /\b(epitalon|epithalon|semax|selank)\b/gi
  ],

  // HAIR LOSS & AESTHETICS
  hair_aesthetics: [
    // Hair medications
    /\b(finasteride|propecia|proscar)\b/gi,
    /\b(minoxidil|rogaine|foam|topical minoxidil|oral minoxidil)\b/gi,
    /\b(dutasteride|avodart)\b/gi,
    // Hair procedures
    /\b(prp scalp|prp hair|platelet rich plasma hair)\b/gi,
    /\b(hair transplant|fue|fut|follicular unit)\b/gi,
    /\b(lllt|low level laser|laser cap|laser helmet)\b/gi,
    /\b(microneedling|dermaroller|dermapen)\b/gi,
    /\b(exosome scalp|stem cell hair)\b/gi,
    // Aesthetics
    /\b(botox|botulinum|dysport|xeomin|jeuveau)\b/gi,
    /\b(dermal fillers?|juvederm|restylane|sculptra|radiesse)\b/gi,
    /\b(prp facial|vampire facial|platelet rich plasma face)\b/gi,
    /\b(chemical peel|glycolic|salicylic|tca peel)\b/gi
  ],

  // WEIGHT LOSS & METABOLIC
  weight_metabolic: [
    // GLP-1 medications
    /\b(semaglutide|ozempic|wegovy|rybelsus)\b/gi,
    /\b(tirzepatide|mounjaro|zepbound)\b/gi,
    /\b(liraglutide|saxenda|victoza)\b/gi,
    // Other weight loss meds
    /\b(phentermine|adipex|lomaira)\b/gi,
    /\b(topiramate|topamax|qsymia)\b/gi,
    /\b(contrave|naltrexone|bupropion)\b/gi,
    /\b(orlistat|xenical|alli)\b/gi,
    /\b(metformin|glucophage)\b/gi,
    // Injectable nutrients
    /\b(lipotropic|lipo-?c|mic|mic-?b12)\b/gi,
    /\b(b12 injection|methylcobalamin|cyanocobalamin)\b/gi,
    /\b(l-?carnitine|carnitine injection)\b/gi,
    /\b(glutathione|gsh|gluta)\b/gi
  ],

  // IV & INJECTION THERAPY
  iv_therapy: [
    // Popular IV cocktails
    /\b(myers cocktail|myer's cocktail|myers' cocktail)\b/gi,
    /\b(nad\+?|nad iv|nicotinamide adenine dinucleotide)\b/gi,
    /\b(glutathione iv|glutathione push|gluta drip)\b/gi,
    /\b(vitamin c iv|high dose c|ascorbic acid iv)\b/gi,
    // Hydration and recovery
    /\b(saline iv|lactated ringer|lr iv|hydration drip)\b/gi,
    /\b(b-?complex|b complex iv|b vitamin drip)\b/gi,
    /\b(magnesium iv|mag drip|magnesium push)\b/gi,
    // Performance IVs
    /\b(amino acid iv|amino blend|bcaa iv)\b/gi,
    /\b(coq10|coenzyme q10|ubiquinol)\b/gi,
    /\b(alpha lipoic acid|ala iv)\b/gi,
    /\b(tri-?amino|arginine|citrulline)\b/gi
  ],

  // REGENERATIVE MEDICINE  
  regenerative: [
    // PRP variations
    /\b(prp|platelet rich plasma|prp injection|prp therapy)\b/gi,
    /\b(prf|platelet rich fibrin|advanced prf)\b/gi,
    // Stem cell therapies
    /\b(stem cell|stem cells|umbilical stem|adipose stem)\b/gi,
    /\b(bmac|bone marrow aspirate)\b/gi,
    /\b(exosomes?|exosome therapy|cell free)\b/gi,
    /\b(amniotic|placental|wharton's jelly)\b/gi,
    // Wave therapies
    /\b(shockwave|shock wave|acoustic wave|eswt)\b/gi,
    /\b(gainswave|phoenix|pulse wave|radial wave)\b/gi,
    // Light and electromagnetic
    /\b(red light therapy|lllt|photobiomodulation|infrared)\b/gi,
    /\b(pemf|pulsed electromagnetic|magnetic therapy)\b/gi,
    /\b(cryotherapy|cryo|cold therapy|ice therapy)\b/gi
  ],

  // DIAGNOSTICS & PANELS
  diagnostics: [
    // Hormone testing
    /\b(total testosterone|free testosterone|bioavailable testosterone)\b/gi,
    /\b(estradiol|e2|sensitive estradiol)\b/gi,
    /\b(shbg|sex hormone binding globulin)\b/gi,
    /\b(lh|luteinizing hormone|fsh|follicle stimulating)\b/gi,
    /\b(dhea-?s|dhea sulfate|igf-?1|growth factor)\b/gi,
    // Metabolic panels
    /\b(cbc|complete blood count|cmp|comprehensive metabolic)\b/gi,
    /\b(lipid panel|cholesterol panel|nmr lipoprofile)\b/gi,
    /\b(a1c|hemoglobin a1c|glucose|insulin)\b/gi,
    /\b(hs-?crp|c-?reactive protein|homocysteine)\b/gi,
    // Thyroid testing
    /\b(tsh|thyroid stimulating|free t3|free t4|reverse t3)\b/gi,
    /\b(tpo antibodies|thyroglobulin|anti-?thyroid)\b/gi,
    // Specialized testing
    /\b(mthfr|methylation|apoe|genetic testing)\b/gi,
    /\b(micronutrient|spectracell|nutreval)\b/gi,
    /\b(gi-?map|gut testing|food sensitivity|igg)\b/gi
  ]
};

// Flatten all patterns for backward compatibility
const TREATMENT_PATTERNS_FLAT = Object.values(TREATMENT_PATTERNS).flat();

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
    
    // Extract treatments using categorized patterns
    for (const [categoryKey, patterns] of Object.entries(TREATMENT_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = textContent.match(pattern) || [];
        for (const match of matches) {
          const normalized = this.normalizeTreatment(match);
          if (normalized && this.isValidTreatment(normalized, lowerContent)) {
            const existing = treatments.get(normalized.toLowerCase());
            if (existing) {
              existing.frequency++;
              // Update category if this match has higher confidence
              if (!existing.category && categoryKey) {
                existing.category = this.mapCategoryKeyToName(categoryKey);
              }
            } else {
              treatments.set(normalized.toLowerCase(), {
                term: normalized,
                category: this.mapCategoryKeyToName(categoryKey),
                type: this.classifyTreatment(normalized),
                confidence: this.calculateConfidence(normalized, lowerContent),
                context: this.extractContext(normalized, textContent),
                frequency: 1
              });
            }
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
    
    // Peptides - check first as they're very specific
    if (/bpc.?157|tb.?500|cjc.?1295|ipamorelin|sermorelin|ghrp|ghk.?cu|mots.?c|aod.?9604/i.test(lower)) return 'peptide';
    
    // Procedures - specific medical procedures
    if (/transplant|prp|platelet.?rich|stem.?cell|exosome|shockwave|acoustic.?wave|gainswave|p.?shot|priapus/i.test(lower)) return 'procedure';
    
    // Medications - pharmaceutical drugs
    if (/testosterone|estradiol|sildenafil|tadalafil|semaglutide|tirzepatide|phentermine|finasteride|minoxidil/i.test(lower)) return 'medication';
    if (/cypionate|enanthate|propionate|undecanoate/i.test(lower)) return 'medication';
    if (/androgel|testim|ozempic|wegovy|cialis|viagra/i.test(lower)) return 'medication';
    
    // Supplements - vitamins and nutrients
    if (/vitamin|b12|b.?complex|glutathione|nad\+?|coq10|dhea|mineral|amino.?acid/i.test(lower)) return 'supplement';
    
    // Therapy - treatment modalities
    if (/therapy|treatment|injection|infusion|iv.?drip|hydration/i.test(lower)) return 'therapy';
    
    // Fallback pattern for medications (chemical naming patterns)
    if (/[a-z]+(ide|one|in|ol|ate|ine|rone|lide|tide)$/i.test(lower)) return 'medication';
    
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
    return Object.values(TREATMENT_PATTERNS).flat().some(pattern => pattern.test(text));
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
    
    // Add categories from found treatments
    treatments.forEach(treatment => {
      if (treatment.category) {
        categories.add(treatment.category);
      }
    });
    
    // Also check content for category indicators
    const categoryIndicators = {
      'hormone-optimization': /hormone.{0,20}(therapy|treatment|optimization)|hrt|trt|testosterone.{0,20}(therapy|replacement)/i,
      'sexual-health': /sexual.{0,20}(health|wellness|performance)|erectile.{0,20}dysfunction|ed.{0,20}treatment/i,
      'peptides-performance': /peptide.{0,20}(therapy|treatment)|performance.{0,20}enhancement/i,
      'hair-loss-aesthetics': /hair.{0,20}(loss|restoration|transplant)|aesthetic.{0,20}(treatment|service)/i,
      'weight-loss-metabolic': /weight.{0,20}(loss|management)|metabolic.{0,20}(health|optimization)/i,
      'iv-injection-therapy': /iv.{0,20}(therapy|treatment|drip)|injection.{0,20}therapy|infusion/i,
      'regenerative-medicine': /regenerative.{0,20}medicine|stem.{0,20}cell|prp.{0,20}therapy/i,
      'diagnostics-panels': /diagnostic.{0,20}(test|panel)|lab.{0,20}(test|work)|blood.{0,20}(test|panel)/i
    };
    
    for (const [category, pattern] of Object.entries(categoryIndicators)) {
      if (pattern.test(content)) {
        categories.add(category);
      }
    }
    
    return Array.from(categories);
  }
  
  /**
   * Map category keys to standardized names
   */
  private mapCategoryKeyToName(key: string): string {
    const mapping: Record<string, string> = {
      'hormone_optimization': 'hormone-optimization',
      'sexual_health': 'sexual-health',
      'peptides_performance': 'peptides-performance',
      'hair_aesthetics': 'hair-loss-aesthetics',
      'weight_metabolic': 'weight-loss-metabolic',
      'iv_therapy': 'iv-injection-therapy',
      'regenerative': 'regenerative-medicine',
      'diagnostics': 'diagnostics-panels'
    };
    
    return mapping[key] || key;
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