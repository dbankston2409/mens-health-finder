import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { URL } from 'url';

/**
 * Advanced website scraper for extracting men's health clinic services
 * Uses multiple strategies to find and normalize service offerings
 */

// Comprehensive list of services we're looking for
const TARGET_SERVICES = {
  // Hormone Therapy
  'TRT': ['testosterone replacement therapy', 'trt', 'low t treatment', 'testosterone therapy', 'androgen therapy', 'hormone replacement', 'hrt for men'],
  'HGH': ['human growth hormone', 'hgh therapy', 'growth hormone', 'somatropin', 'sermorelin'],
  'Peptide Therapy': ['peptide therapy', 'peptides', 'bpc-157', 'tb-500', 'ipamorelin', 'cjc-1295', 'mk-677'],
  
  // Sexual Health
  'ED Treatment': ['erectile dysfunction', 'ed treatment', 'impotence', 'sexual dysfunction', 'viagra', 'cialis', 'trimix', 'p-shot', 'priapus shot', 'gainswave', 'shockwave therapy'],
  'Premature Ejaculation': ['premature ejaculation', 'pe treatment', 'sexual performance'],
  'Peyronie\'s Disease': ['peyronies disease', 'penile curvature', 'xiaflex'],
  
  // Weight & Metabolic
  'Weight Loss': ['weight loss', 'medical weight loss', 'semaglutide', 'ozempic', 'wegovy', 'tirzepatide', 'mounjaro', 'phentermine', 'fat loss', 'body composition'],
  'B12 Injections': ['b12 shots', 'b12 injections', 'vitamin b12', 'methylcobalamin'],
  'Lipotropic Injections': ['lipotropic', 'mic injections', 'fat burning injections', 'lipo shots'],
  
  // Hair & Aesthetics
  'Hair Restoration': ['hair restoration', 'hair loss', 'finasteride', 'propecia', 'minoxidil', 'rogaine', 'prp hair', 'hair transplant', 'fue', 'fut'],
  'PRP Therapy': ['prp', 'platelet rich plasma', 'prp therapy', 'prp injections'],
  'Aesthetics': ['botox', 'dermal fillers', 'juvederm', 'restylane', 'sculptra', 'kybella'],
  
  // Wellness & Prevention
  'IV Therapy': ['iv therapy', 'iv drip', 'iv hydration', 'myers cocktail', 'nad+', 'glutathione'],
  'Cryotherapy': ['cryotherapy', 'cold therapy', 'cryo', 'whole body cryotherapy'],
  'Red Light Therapy': ['red light therapy', 'photobiomodulation', 'infrared therapy', 'lllt'],
  
  // Specialized Treatments
  'Acoustic Wave': ['acoustic wave', 'gainswave', 'shockwave therapy', 'eswt'],
  'Ozone Therapy': ['ozone therapy', 'ozone treatment', 'o3 therapy'],
  'Stem Cell Therapy': ['stem cell', 'regenerative medicine', 'exosomes', 'umbilical cord'],
  
  // Diagnostics & Testing
  'Hormone Testing': ['hormone testing', 'blood work', 'lab testing', 'comprehensive panel', 'dutch test'],
  'Genetic Testing': ['genetic testing', 'dna testing', 'pharmacogenomics'],
  'Food Sensitivity': ['food sensitivity', 'food allergy testing', 'elimination diet'],
  
  // Mental Health & Cognitive
  'TMS Therapy': ['tms', 'transcranial magnetic stimulation', 'depression treatment'],
  'Ketamine Therapy': ['ketamine', 'ketamine infusion', 'spravato'],
  'NAD+ Therapy': ['nad+', 'nad therapy', 'nicotinamide adenine dinucleotide'],
  
  // Pain Management
  'Joint Injections': ['joint injections', 'cortisone', 'hyaluronic acid', 'viscosupplementation'],
  'Trigger Point': ['trigger point', 'dry needling', 'myofascial release']
};

// Keywords that indicate service pages
const SERVICE_PAGE_INDICATORS = [
  'services', 'treatments', 'what we do', 'what we offer', 'our services',
  'medical services', 'treatment options', 'therapies', 'procedures',
  'mens health services', 'clinic services', 'offerings'
];

// Pricing indicators (helps identify service mentions)
const PRICING_INDICATORS = [
  'starting at', 'per session', 'per treatment', 'pricing', 'cost',
  'investment', 'package', 'membership', 'consultation fee'
];

export interface ScrapedService {
  category: string;
  service: string;
  confidence: number; // 0-1 score
  context?: string; // Surrounding text for context
  price?: string; // If pricing found
  details?: string[]; // Bullet points or details found
}

export interface WebsiteScrapingResult {
  url: string;
  success: boolean;
  services: ScrapedService[];
  totalServicesFound: number;
  scrapedPages: string[];
  clinicDescription?: string;
  additionalInfo?: {
    acceptsInsurance?: boolean;
    hasFinancing?: boolean;
    offersConsultation?: boolean;
    specializations?: string[];
  };
  error?: string;
}

export class ClinicWebsiteScraper {
  private headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; MensHealthFinder/1.0; +https://menshealthfinder.com/bot)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  async scrapeWebsite(websiteUrl: string): Promise<WebsiteScrapingResult> {
    try {
      const url = new URL(websiteUrl);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      // Start with homepage
      const homepageServices = await this.scrapePage(websiteUrl);
      
      // Find service-related pages
      const servicePages = await this.findServicePages(websiteUrl);
      
      // Scrape each service page
      const allServices: ScrapedService[] = [...homepageServices];
      const scrapedPages = [websiteUrl];
      
      for (const pageUrl of servicePages) {
        if (!scrapedPages.includes(pageUrl)) {
          const pageServices = await this.scrapePage(pageUrl);
          allServices.push(...pageServices);
          scrapedPages.push(pageUrl);
        }
      }
      
      // Deduplicate and boost confidence for repeated mentions
      const consolidatedServices = this.consolidateServices(allServices);
      
      // Extract additional clinic info
      const additionalInfo = await this.extractAdditionalInfo(websiteUrl);
      
      return {
        url: websiteUrl,
        success: true,
        services: consolidatedServices,
        totalServicesFound: consolidatedServices.length,
        scrapedPages,
        additionalInfo,
      };
      
    } catch (error) {
      console.error('Website scraping error:', error);
      return {
        url: websiteUrl,
        success: false,
        services: [],
        totalServicesFound: 0,
        scrapedPages: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async scrapePage(pageUrl: string): Promise<ScrapedService[]> {
    try {
      const response = await fetch(pageUrl, { 
        headers: this.headers,
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const services: ScrapedService[] = [];
      
      // Remove script and style content
      $('script, style, noscript').remove();
      
      // Strategy 1: Look for service lists
      const serviceSelectors = [
        'ul li', 'ol li', // List items
        '.service-item', '.treatment-item', // Common class names
        '[class*="service"]', '[class*="treatment"]', // Partial matches
        'h3', 'h4', 'h5', // Service headings
        '.card-title', '.box-title', // Card-based layouts
      ];
      
      serviceSelectors.forEach(selector => {
        $(selector).each((_, element) => {
          const text = $(element).text().trim();
          const foundServices = this.extractServicesFromText(text, $(element).html() || '');
          services.push(...foundServices);
        });
      });
      
      // Strategy 2: Look for service mentions in paragraphs
      $('p, div').each((_, element) => {
        const text = $(element).text().trim();
        if (text.length > 20 && text.length < 500) {
          const foundServices = this.extractServicesFromText(text);
          services.push(...foundServices);
        }
      });
      
      // Strategy 3: Check tables for services
      $('table tr').each((_, row) => {
        const text = $(row).text().trim();
        const foundServices = this.extractServicesFromText(text);
        services.push(...foundServices);
      });
      
      // Strategy 4: Look for pricing sections (often list services)
      $('[class*="pricing"], [class*="price"], [id*="pricing"]').each((_, element) => {
        const text = $(element).text().trim();
        const foundServices = this.extractServicesFromText(text);
        foundServices.forEach(service => {
          service.confidence *= 1.2; // Boost confidence for pricing sections
        });
        services.push(...foundServices);
      });
      
      return services;
      
    } catch (error) {
      console.error(`Error scraping page ${pageUrl}:`, error);
      return [];
    }
  }

  private extractServicesFromText(text: string, html?: string): ScrapedService[] {
    const services: ScrapedService[] = [];
    const lowerText = text.toLowerCase();
    
    // Check each service category
    for (const [category, keywords] of Object.entries(TARGET_SERVICES)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          // Calculate confidence based on context
          let confidence = 0.5; // Base confidence
          
          // Boost confidence for exact matches
          if (lowerText.includes(keyword + ' treatment') || 
              lowerText.includes(keyword + ' therapy') ||
              lowerText.includes(keyword + ' program')) {
            confidence += 0.2;
          }
          
          // Boost for pricing mentions
          if (PRICING_INDICATORS.some(indicator => lowerText.includes(indicator))) {
            confidence += 0.15;
          }
          
          // Boost for bullet points or list items
          if (html && (html.includes('<li>') || html.includes('•') || html.includes('✓'))) {
            confidence += 0.1;
          }
          
          // Extract pricing if present
          const priceMatch = text.match(/\$[\d,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*\w+)?/);
          
          // Extract surrounding context
          const keywordIndex = lowerText.indexOf(keyword);
          const contextStart = Math.max(0, keywordIndex - 50);
          const contextEnd = Math.min(text.length, keywordIndex + keyword.length + 50);
          const context = text.substring(contextStart, contextEnd).trim();
          
          services.push({
            category,
            service: category, // Use normalized category name
            confidence: Math.min(confidence, 1),
            context,
            price: priceMatch ? priceMatch[0] : undefined,
          });
          
          break; // Only match once per category per text block
        }
      }
    }
    
    return services;
  }

  private async findServicePages(websiteUrl: string): Promise<string[]> {
    try {
      const response = await fetch(websiteUrl, { headers: this.headers });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const servicePages: Set<string> = new Set();
      const url = new URL(websiteUrl);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      // Find all links
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().toLowerCase();
        
        if (href) {
          // Check if link text indicates services
          const isServiceLink = SERVICE_PAGE_INDICATORS.some(indicator => 
            linkText.includes(indicator) || href.toLowerCase().includes(indicator)
          );
          
          // Also check for specific service mentions
          const hasServiceKeyword = Object.values(TARGET_SERVICES).flat().some(keyword =>
            linkText.includes(keyword) || href.toLowerCase().includes(keyword)
          );
          
          if (isServiceLink || hasServiceKeyword) {
            // Convert to absolute URL
            const absoluteUrl = href.startsWith('http') ? href : 
              href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
            
            // Only include same-domain URLs
            try {
              const linkUrl = new URL(absoluteUrl);
              if (linkUrl.hostname === url.hostname) {
                servicePages.add(absoluteUrl);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        }
      });
      
      // Limit to top 10 most relevant pages
      return Array.from(servicePages).slice(0, 10);
      
    } catch (error) {
      console.error('Error finding service pages:', error);
      return [];
    }
  }

  private consolidateServices(services: ScrapedService[]): ScrapedService[] {
    const serviceMap = new Map<string, ScrapedService>();
    
    services.forEach(service => {
      const existing = serviceMap.get(service.service);
      if (existing) {
        // Increase confidence for repeated mentions
        existing.confidence = Math.min(existing.confidence * 1.1, 1);
        
        // Merge details
        if (service.price && !existing.price) {
          existing.price = service.price;
        }
        if (service.details) {
          existing.details = [...(existing.details || []), ...service.details];
        }
      } else {
        serviceMap.set(service.service, service);
      }
    });
    
    // Sort by confidence
    return Array.from(serviceMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  private async extractAdditionalInfo(websiteUrl: string): Promise<any> {
    try {
      const response = await fetch(websiteUrl, { headers: this.headers });
      const html = await response.text();
      const $ = cheerio.load(html);
      const text = $('body').text().toLowerCase();
      
      return {
        acceptsInsurance: text.includes('insurance') && 
          (text.includes('accept') || text.includes('work with') || text.includes('coverage')),
        hasFinancing: text.includes('financing') || text.includes('payment plan') || 
          text.includes('carecredit') || text.includes('cherry'),
        offersConsultation: text.includes('free consultation') || 
          text.includes('complimentary consultation') || text.includes('book consultation'),
        specializations: this.extractSpecializations(text),
      };
    } catch (error) {
      return {};
    }
  }

  private extractSpecializations(text: string): string[] {
    const specializations: string[] = [];
    
    const specialtyIndicators = {
      'Anti-Aging': ['anti-aging', 'age management', 'longevity'],
      'Sports Medicine': ['sports medicine', 'athletic performance', 'sports performance'],
      'Executive Health': ['executive health', 'executive wellness', 'vip health'],
      'Functional Medicine': ['functional medicine', 'integrative medicine', 'holistic'],
      'Regenerative Medicine': ['regenerative medicine', 'stem cell', 'prp'],
      'Sexual Health': ['sexual health', 'mens sexual health', 'sexual wellness'],
      'Metabolic Health': ['metabolic health', 'metabolic optimization', 'metabolism'],
    };
    
    for (const [specialty, indicators] of Object.entries(specialtyIndicators)) {
      if (indicators.some(indicator => text.includes(indicator))) {
        specializations.push(specialty);
      }
    }
    
    return specializations;
  }
}