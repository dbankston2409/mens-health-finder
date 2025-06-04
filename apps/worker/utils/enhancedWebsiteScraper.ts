import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { URL } from 'url';
import { treatmentExtractor, TreatmentExtractionResult } from './treatmentExtractor';

/**
 * Enhanced website scraper focused on extracting valuable business information
 * for SEO content generation - excludes pricing and insurance details
 */

// Comprehensive list of 25+ service categories we're looking for
export const TARGET_SERVICE_CATEGORIES = {
  // Hormone Optimization (5 categories)
  'TRT': ['testosterone replacement therapy', 'trt', 'low t treatment', 'testosterone therapy', 'androgen therapy', 'hormone replacement', 'hrt for men', 'testosterone optimization'],
  'HGH Therapy': ['human growth hormone', 'hgh therapy', 'growth hormone', 'somatropin', 'sermorelin', 'ibutamoren'],
  'Peptide Therapy': ['peptide therapy', 'peptides', 'bpc-157', 'tb-500', 'ipamorelin', 'cjc-1295', 'mk-677', 'ghrp', 'healing peptides'],
  'Thyroid Treatment': ['thyroid optimization', 'hypothyroid', 'thyroid hormone', 't3', 't4', 'armour thyroid'],
  'DHEA Therapy': ['dhea', 'adrenal support', 'pregnenolone', 'cortisol management'],
  
  // Sexual Health & Performance (6 categories)
  'ED Treatment': ['erectile dysfunction', 'ed treatment', 'impotence', 'trimix', 'p-shot', 'priapus shot', 'gainswave', 'shockwave therapy', 'phoenix', 'pulse wave'],
  'Premature Ejaculation': ['premature ejaculation', 'pe treatment', 'sexual performance', 'delay spray'],
  'Peyronie\'s Disease': ['peyronies disease', 'penile curvature', 'xiaflex', 'penile straightening'],
  'Sexual Health': ['sexual wellness', 'libido', 'sexual vitality', 'performance anxiety'],
  'Acoustic Wave Therapy': ['acoustic wave', 'gainswave', 'shockwave therapy', 'eswt', 'low-intensity shockwave'],
  'P-Shot': ['p-shot', 'priapus shot', 'prp shot', 'penile prp'],
  
  // Weight Management & Metabolic (5 categories)
  'Medical Weight Loss': ['medical weight loss', 'semaglutide', 'ozempic', 'wegovy', 'tirzepatide', 'mounjaro', 'glp-1', 'weight management'],
  'B12 Injections': ['b12 shots', 'b12 injections', 'vitamin b12', 'methylcobalamin', 'energy boost'],
  'Lipotropic Injections': ['lipotropic', 'mic injections', 'fat burning injections', 'lipo shots', 'skinny shot'],
  'Body Composition': ['body composition', 'dexa scan', 'inbody', 'body fat analysis', 'muscle mass'],
  'Metabolic Testing': ['metabolic testing', 'rmr test', 'vo2 max', 'metabolic rate'],
  
  // Hair & Aesthetics (4 categories)
  'Hair Restoration': ['hair restoration', 'hair loss', 'finasteride', 'propecia', 'minoxidil', 'prp hair', 'hair transplant', 'fue', 'fut', 'scalp treatment'],
  'PRP Therapy': ['prp', 'platelet rich plasma', 'prp therapy', 'prp injections', 'regenerative therapy'],
  'Aesthetics': ['botox', 'dermal fillers', 'juvederm', 'restylane', 'sculptra', 'kybella', 'facial rejuvenation'],
  'Skin Health': ['skin health', 'acne treatment', 'rosacea', 'skin rejuvenation', 'chemical peel'],
  
  // IV & Injection Therapies (5 categories)
  'IV Therapy': ['iv therapy', 'iv drip', 'iv hydration', 'myers cocktail', 'iv nutrition', 'vitamin infusion'],
  'NAD+ Therapy': ['nad+', 'nad therapy', 'nicotinamide adenine dinucleotide', 'nad iv', 'cellular health'],
  'Glutathione': ['glutathione', 'glutathione push', 'master antioxidant', 'detox iv'],
  'Vitamin Injections': ['vitamin injections', 'vitamin shots', 'b complex', 'vitamin d injection', 'nutrient therapy'],
  'Ozone Therapy': ['ozone therapy', 'ozone treatment', 'o3 therapy', 'oxidative therapy'],
  
  // Advanced Therapies (6 categories)
  'Stem Cell Therapy': ['stem cell', 'regenerative medicine', 'exosomes', 'umbilical cord', 'mesenchymal'],
  'Cryotherapy': ['cryotherapy', 'cold therapy', 'cryo', 'whole body cryotherapy', 'localized cryo'],
  'Red Light Therapy': ['red light therapy', 'photobiomodulation', 'infrared therapy', 'lllt', 'led therapy'],
  'PEMF Therapy': ['pemf', 'pulsed electromagnetic', 'magnetic therapy', 'cellular regeneration'],
  'Hyperbaric Oxygen': ['hyperbaric', 'hbot', 'oxygen therapy', 'hyperbaric chamber'],
  'Infrared Sauna': ['infrared sauna', 'heat therapy', 'detox sauna', 'chromotherapy'],
  
  // Diagnostics & Testing (4 categories)
  'Comprehensive Testing': ['comprehensive panel', 'full blood work', 'executive physical', 'wellness panel'],
  'Hormone Testing': ['hormone testing', 'hormone panel', 'dutch test', 'saliva testing', 'testosterone test'],
  'Genetic Testing': ['genetic testing', 'dna testing', 'pharmacogenomics', 'methylation', 'nutrigenomics'],
  'Food Sensitivity': ['food sensitivity', 'food allergy testing', 'igg testing', 'elimination diet'],
  
  // Mental & Cognitive (3 categories)
  'TMS Therapy': ['tms', 'transcranial magnetic stimulation', 'depression treatment', 'brainsway'],
  'Ketamine Therapy': ['ketamine', 'ketamine infusion', 'spravato', 'psychedelic therapy'],
  'Brain Health': ['brain health', 'cognitive enhancement', 'nootropics', 'brain fog treatment'],
  
  // Pain & Recovery (3 categories)
  'Joint Injections': ['joint injections', 'cortisone', 'hyaluronic acid', 'viscosupplementation', 'prp joints'],
  'Trigger Point': ['trigger point', 'dry needling', 'myofascial release', 'muscle therapy'],
  'Pain Management': ['pain management', 'chronic pain', 'neuropathy', 'pain relief']
};

// Valuable business information to extract
const BUSINESS_VALUE_INDICATORS = {
  credentials: ['board certified', 'fellowship trained', 'years experience', 'medical director', 'specialized training'],
  technology: ['state of the art', 'latest technology', 'advanced equipment', 'cutting edge', 'fda approved'],
  approach: ['personalized', 'customized', 'individualized', 'comprehensive', 'holistic', 'integrative'],
  convenience: ['same day', 'walk in', 'evening hours', 'weekend hours', 'telemedicine', 'virtual visits'],
  specialization: ['specialize', 'expert', 'focus', 'dedicated', 'exclusive'],
  results: ['proven results', 'success rate', 'patient outcomes', 'testimonials', 'before after'],
  certifications: ['certified', 'accredited', 'licensed', 'registered', 'member of']
};

export interface ScrapedService {
  category: string;
  service: string;
  confidence: number;
  context?: string;
  details?: string[];
}

export interface BusinessInformation {
  credentials?: string[];
  technology?: string[];
  approach?: string[];
  convenience?: string[];
  specializations?: string[];
  certifications?: string[];
  uniqueValue?: string[];
}

export interface WebsiteScrapingResult {
  url: string;
  success: boolean;
  services: ScrapedService[];
  businessInfo: BusinessInformation;
  clinicPhilosophy?: string;
  providerInfo?: string[];
  testimonialThemes?: string[];
  scrapedPages: string[];
  treatments?: TreatmentExtractionResult;  // Add treatment extraction results
  searchableTerms?: string[];  // Pre-processed terms for Firestore indexing
  error?: string;
}

export class EnhancedClinicWebsiteScraper {
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
  };

  async scrapeWebsite(websiteUrl: string): Promise<WebsiteScrapingResult> {
    try {
      const url = new URL(websiteUrl);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      // Start with homepage
      const homepageData = await this.scrapePage(websiteUrl);
      
      // Find relevant pages
      const relevantPages = await this.findRelevantPages(websiteUrl);
      
      // Scrape each page
      const allServices: ScrapedService[] = [...homepageData.services];
      const businessInfo: BusinessInformation = this.mergeBusinessInfo(homepageData.businessInfo);
      const scrapedPages = [websiteUrl];
      let allHtmlContent = homepageData.html || '';
      
      // Limit to 5 additional pages to be respectful
      for (const pageUrl of relevantPages.slice(0, 5)) {
        if (!scrapedPages.includes(pageUrl)) {
          const pageData = await this.scrapePage(pageUrl);
          allServices.push(...pageData.services);
          this.mergeBusinessInfo(businessInfo, pageData.businessInfo);
          scrapedPages.push(pageUrl);
          allHtmlContent += '\n' + (pageData.html || '');
          
          // Respectful delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Consolidate and deduplicate
      const consolidatedServices = this.consolidateServices(allServices);
      
      // Extract treatments from all collected HTML
      const treatments = treatmentExtractor.extractTreatments(allHtmlContent);
      
      // Extract additional valuable information
      const testimonialThemes = await this.extractTestimonialThemes(websiteUrl);
      const providerInfo = await this.extractProviderInfo(websiteUrl);
      
      return {
        url: websiteUrl,
        success: true,
        services: consolidatedServices,
        businessInfo,
        providerInfo,
        testimonialThemes,
        scrapedPages,
        treatments,
        searchableTerms: treatments.searchableTerms,
      };
      
    } catch (error) {
      console.error('Website scraping error:', error);
      return {
        url: websiteUrl,
        success: false,
        services: [],
        businessInfo: {},
        scrapedPages: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async scrapePage(pageUrl: string): Promise<{ services: ScrapedService[], businessInfo: BusinessInformation, html?: string }> {
    try {
      const response = await fetch(pageUrl, { 
        headers: this.headers,
        timeout: 10000 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, noscript, iframe').remove();
      
      const services: ScrapedService[] = [];
      const businessInfo: BusinessInformation = {};
      
      // Extract services
      const pageText = $('body').text();
      const extractedServices = this.extractServicesFromPage($, pageText);
      services.push(...extractedServices);
      
      // Extract business value information
      const extractedBusinessInfo = this.extractBusinessInfo($, pageText);
      Object.assign(businessInfo, extractedBusinessInfo);
      
      return { services, businessInfo, html };
      
    } catch (error) {
      console.error(`Error scraping page ${pageUrl}:`, error);
      return { services: [], businessInfo: {} };
    }
  }

  private extractServicesFromPage($: cheerio.CheerioAPI, pageText: string): ScrapedService[] {
    const services: ScrapedService[] = [];
    const lowerText = pageText.toLowerCase();
    const foundCategories = new Set<string>();
    
    // Look for services in various page elements
    const serviceElements = [
      'h1, h2, h3, h4', // Headings often contain service names
      'li', // Service lists
      '.service, .treatment', // Common class names
      '[class*="service"], [class*="treatment"]',
      'p', // Paragraphs mentioning services
    ];
    
    serviceElements.forEach(selector => {
      $(selector).each((_, element) => {
        const elementText = $(element).text().trim();
        const elementLower = elementText.toLowerCase();
        
        // Check each service category
        for (const [category, keywords] of Object.entries(TARGET_SERVICE_CATEGORIES)) {
          if (foundCategories.has(category)) continue; // Only one per category
          
          for (const keyword of keywords) {
            if (elementLower.includes(keyword)) {
              let confidence = 0.6; // Base confidence
              
              // Boost confidence based on context
              if ($(element).is('h1, h2, h3, h4')) confidence += 0.2;
              if ($(element).is('li')) confidence += 0.15;
              if ($(element).parent().is('[class*="service"]')) confidence += 0.15;
              
              // Extract context (surrounding text)
              const context = this.extractContext(elementText, keyword);
              
              services.push({
                category,
                service: category,
                confidence: Math.min(confidence, 1),
                context,
              });
              
              foundCategories.add(category);
              break;
            }
          }
        }
      });
    });
    
    return services;
  }

  private extractBusinessInfo($: cheerio.CheerioAPI, pageText: string): BusinessInformation {
    const businessInfo: BusinessInformation = {
      credentials: [],
      technology: [],
      approach: [],
      convenience: [],
      specializations: [],
      certifications: [],
      uniqueValue: [],
    };
    
    const lowerText = pageText.toLowerCase();
    
    // Extract valuable business information
    for (const [category, indicators] of Object.entries(BUSINESS_VALUE_INDICATORS)) {
      indicators.forEach(indicator => {
        if (lowerText.includes(indicator)) {
          // Extract the sentence containing this indicator
          const sentences = pageText.split(/[.!?]+/);
          const relevantSentences = sentences.filter(s => 
            s.toLowerCase().includes(indicator)
          );
          
          relevantSentences.forEach(sentence => {
            const cleaned = sentence.trim();
            if (cleaned.length > 20 && cleaned.length < 200) {
              businessInfo[category as keyof BusinessInformation]?.push(cleaned);
            }
          });
        }
      });
    }
    
    // Look for unique value propositions
    const uniqueValueSelectors = [
      '.why-choose-us',
      '.benefits',
      '.advantages',
      '[class*="why-us"]',
      '[class*="difference"]'
    ];
    
    uniqueValueSelectors.forEach(selector => {
      $(selector).find('li, p').each((_, element) => {
        const text = $(element).text().trim();
        if (text.length > 20 && text.length < 150) {
          businessInfo.uniqueValue?.push(text);
        }
      });
    });
    
    return businessInfo;
  }

  private async findRelevantPages(websiteUrl: string): Promise<string[]> {
    try {
      const response = await fetch(websiteUrl, { headers: this.headers });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const relevantPages: Set<string> = new Set();
      const url = new URL(websiteUrl);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      // Keywords that indicate relevant pages
      const relevantKeywords = [
        'services', 'treatments', 'about', 'our-team', 'providers',
        'testosterone', 'trt', 'hormone', 'weight-loss', 'ed-treatment',
        'peptide', 'therapy', 'wellness', 'mens-health'
      ];
      
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().toLowerCase();
        
        if (href && !href.includes('#') && !href.includes('javascript:')) {
          const isRelevant = relevantKeywords.some(keyword => 
            linkText.includes(keyword) || href.toLowerCase().includes(keyword)
          );
          
          if (isRelevant) {
            const absoluteUrl = href.startsWith('http') ? href : 
              href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
            
            try {
              const linkUrl = new URL(absoluteUrl);
              if (linkUrl.hostname === url.hostname) {
                relevantPages.add(absoluteUrl);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        }
      });
      
      return Array.from(relevantPages);
    } catch (error) {
      return [];
    }
  }

  private async extractTestimonialThemes(websiteUrl: string): Promise<string[]> {
    // Extract common themes from testimonials without including personal details
    const themes: string[] = [];
    const commonThemes = [
      'increased energy',
      'better sleep',
      'improved mood',
      'weight loss success',
      'muscle gain',
      'improved libido',
      'professional staff',
      'life changing',
      'highly recommend',
      'excellent care'
    ];
    
    // This would analyze testimonial sections and extract themes
    // For now, returning empty array to avoid privacy concerns
    return themes;
  }

  private async extractProviderInfo(websiteUrl: string): Promise<string[]> {
    // Extract provider credentials and specializations
    const providerInfo: string[] = [];
    
    // This would look for provider sections and extract:
    // - Board certifications
    // - Years of experience
    // - Special training
    // - Areas of expertise
    
    return providerInfo;
  }

  private extractContext(text: string, keyword: string): string {
    const lowerText = text.toLowerCase();
    const keywordIndex = lowerText.indexOf(keyword);
    
    if (keywordIndex === -1) return text.trim();
    
    // Extract surrounding context
    const start = Math.max(0, keywordIndex - 50);
    const end = Math.min(text.length, keywordIndex + keyword.length + 50);
    
    let context = text.substring(start, end).trim();
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  private consolidateServices(services: ScrapedService[]): ScrapedService[] {
    const serviceMap = new Map<string, ScrapedService>();
    
    services.forEach(service => {
      const existing = serviceMap.get(service.service);
      if (existing) {
        // Keep the one with higher confidence
        if (service.confidence > existing.confidence) {
          serviceMap.set(service.service, service);
        }
      } else {
        serviceMap.set(service.service, service);
      }
    });
    
    return Array.from(serviceMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  private mergeBusinessInfo(base: BusinessInformation, additional?: BusinessInformation): BusinessInformation {
    if (!additional) return base;
    
    const merged = { ...base };
    
    Object.keys(additional).forEach(key => {
      const k = key as keyof BusinessInformation;
      if (additional[k] && Array.isArray(additional[k])) {
        merged[k] = [...new Set([...(merged[k] || []), ...(additional[k] || [])])];
      }
    });
    
    return merged;
  }
}