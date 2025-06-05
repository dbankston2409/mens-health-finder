import { Clinic, DiscoveryGrid, SearchNiche } from '../../types';
import { EnhancedDataCollector, GooglePlaceDetails } from './dataCollectors';

interface SearchResult extends Partial<Clinic> {
  googlePlacesId?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  time: Date;
  profilePhoto?: string;
}

// Extend the EnhancedDataCollector class with missing methods
export class ExtendedDataCollector extends EnhancedDataCollector {
  constructor(googleApiKey: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '') {
    super(googleApiKey);
  }

  /**
   * Search a grid area for clinics based on search niche
   * This method performs multiple searches within a grid area using the niche's search terms
   */
  async searchGrid(
    grid: DiscoveryGrid,
    searchNiche: SearchNiche | string,
    maxConcurrentSearches: number = 3
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const processedPlaceIds = new Set<string>();

    // Get search terms based on niche
    const searchTerms = this.getSearchTermsForNiche(searchNiche);
    
    // Batch process search terms with concurrency control
    const batches = this.createBatches(searchTerms, maxConcurrentSearches);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (searchTerm) => {
        try {
          const places = await this.searchGooglePlaces({
            lat: grid.lat,
            lng: grid.lng,
            radius: grid.radius,
            keyword: searchTerm,
            type: 'health' // Focus on health-related businesses
          });

          const results: SearchResult[] = [];
          for (const place of places) {
            // Skip if we've already processed this place
            if (processedPlaceIds.has(place.place_id)) {
              continue;
            }
            processedPlaceIds.add(place.place_id);

            // Convert to clinic format and check if it matches our criteria
            const clinic = this.convertToClinic(place) as SearchResult;
            
            // Filter based on niche criteria
            if (this.isRelevantToNiche(clinic, searchNiche)) {
              clinic.googlePlacesId = place.place_id;
              results.push(clinic);
            }
          }
          
          return results;
        } catch (error) {
          console.error(`Error searching with term "${searchTerm}":`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults.flat());
      
      // Add delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(1000);
      }
    }

    // Remove duplicates based on address
    const uniqueResults = this.removeDuplicates(allResults);
    
    return uniqueResults;
  }

  /**
   * Extract social media links from a website
   * Fetches the website and searches for social media profile links
   */
  async extractSocialMediaLinks(websiteUrl: string): Promise<{
    socialMedia?: SearchResult['socialMedia'];
  }> {
    try {
      // Normalize URL
      const url = this.normalizeUrl(websiteUrl);
      if (!url) {
        return {};
      }

      // Fetch website content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MensHealthFinder/1.0)'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Extract social media links using regex patterns
      const socialMedia: SearchResult['socialMedia'] = {};
      
      // Facebook
      const facebookMatch = html.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9\.]+/i);
      if (facebookMatch) {
        socialMedia.facebook = this.cleanSocialUrl(facebookMatch[0]);
      }

      // Instagram
      const instagramMatch = html.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/i);
      if (instagramMatch) {
        socialMedia.instagram = this.cleanSocialUrl(instagramMatch[0]);
      }

      // Twitter/X
      const twitterMatch = html.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/i);
      if (twitterMatch) {
        socialMedia.twitter = this.cleanSocialUrl(twitterMatch[0]);
      }

      // LinkedIn
      const linkedinMatch = html.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9-]+/i);
      if (linkedinMatch) {
        socialMedia.linkedin = this.cleanSocialUrl(linkedinMatch[0]);
      }

      // YouTube
      const youtubeMatch = html.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/)?[a-zA-Z0-9_-]+/i);
      if (youtubeMatch) {
        socialMedia.youtube = this.cleanSocialUrl(youtubeMatch[0]);
      }

      return { socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined };
    } catch (error) {
      console.error(`Failed to extract social media from ${websiteUrl}:`, error);
      return {};
    }
  }

  /**
   * Get Google reviews for a place
   * Fetches reviews from Google Places API
   */
  async getGoogleReviews(placeId: string): Promise<Review[]> {
    try {
      // Note: Google Places API doesn't return reviews in the basic tier
      // This would require the Places Details API with reviews field
      // For now, we'll return the structure that would be populated
      
      // In a real implementation, you would:
      // 1. Use Google Places Details API with reviews field
      // 2. Parse and format the reviews
      // 3. Handle pagination if needed
      
      console.warn('Google Reviews API requires additional setup and billing');
      return [];
      
      // Example of what the implementation would look like:
      /*
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'reviews',
        key: this.googleApiKey
      });

      const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.result?.reviews) {
        return [];
      }

      return data.result.reviews.map((review: any) => ({
        id: `${placeId}_${review.time}`,
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: new Date(review.time * 1000),
        profilePhoto: review.profile_photo_url
      }));
      */
    } catch (error) {
      console.error(`Failed to get reviews for place ${placeId}:`, error);
      return [];
    }
  }

  // Helper methods

  private getSearchTermsForNiche(searchNiche: SearchNiche | string): string[] {
    // Default search terms for men's health
    const defaultTerms = [
      'testosterone',
      'erectile dysfunction',
      'peptide therapy',
      'hair transplant for men',
      'men\'s medical weight loss',
      'vitamin IV drip',
      'IV hydration therapy',
      'stem cell therapy',
      'cryotherapy',
      'compression therapy'
    ];

    if (typeof searchNiche === 'string') {
      // Map string values to search terms
      const nicheTerms: Record<string, string[]> = {
        mensHealth: defaultTerms,
        urgentCare: [
          'urgent care',
          'walk in clinic',
          'immediate care',
          'express care',
          'minute clinic'
        ],
        wellness: [
          'wellness center',
          'health and wellness',
          'integrative health',
          'holistic health center',
          'preventive health clinic'
        ]
      };
      
      return nicheTerms[searchNiche] || defaultTerms;
    }

    // If it's a SearchNiche object, use its searchTerms
    return searchNiche.searchTerms || defaultTerms;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private isRelevantToNiche(clinic: SearchResult, searchNiche: SearchNiche | string): boolean {
    if (!clinic.name) return false;

    const name = clinic.name.toLowerCase();
    const website = clinic.website?.toLowerCase() || '';

    // Keywords to look for in men's health clinics
    const relevantKeywords = [
      'mens', 'men\'s', 'male', 'testosterone', 'trt', 'hormone',
      'vitality', 'wellness', 'health', 'clinic', 'center',
      'erectile', 'ed clinic', 'low t'
    ];

    // Keywords to exclude (not men's health specific)
    const excludeKeywords = [
      'women', 'women\'s', 'pediatric', 'dental', 'veterinary',
      'eye', 'vision', 'optical', 'pharmacy', 'physical therapy'
    ];

    // Check for exclusions first
    for (const keyword of excludeKeywords) {
      if (name.includes(keyword) || website.includes(keyword)) {
        return false;
      }
    }

    // Check for relevant keywords
    for (const keyword of relevantKeywords) {
      if (name.includes(keyword) || website.includes(keyword)) {
        return true;
      }
    }

    // If no specific keywords found, include if it's a general health clinic
    return name.includes('clinic') || name.includes('health');
  }

  private removeDuplicates(clinics: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>();
    
    for (const clinic of clinics) {
      const key = `${clinic.address}_${clinic.city}_${clinic.state}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.set(key, clinic);
      } else {
        // If duplicate, keep the one with more information
        const existing = seen.get(key)!;
        if (this.hasMoreInfo(clinic, existing)) {
          seen.set(key, clinic);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  private hasMoreInfo(a: SearchResult, b: SearchResult): boolean {
    let scoreA = 0;
    let scoreB = 0;
    
    if (a.website) scoreA++;
    if (b.website) scoreB++;
    if (a.phone) scoreA++;
    if (b.phone) scoreB++;
    if (a.rating) scoreA++;
    if (b.rating) scoreB++;
    if (a.socialMedia) scoreA++;
    if (b.socialMedia) scoreB++;
    
    return scoreA > scoreB;
  }

  private normalizeUrl(url: string): string | null {
    if (!url) return null;
    
    try {
      // Add protocol if missing
      if (!url.match(/^https?:\/\//)) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return null;
    }
  }

  private cleanSocialUrl(url: string): string {
    // Ensure URL has protocol
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    // Remove trailing slashes
    return url.replace(/\/+$/, '');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const dataCollector = new ExtendedDataCollector();