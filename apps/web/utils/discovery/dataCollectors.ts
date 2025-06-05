import { Clinic, DiscoveryGrid, SearchNiche } from '../../types';

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export class EnhancedDataCollector {
  private googleApiKey: string;

  constructor(googleApiKey: string) {
    this.googleApiKey = googleApiKey;
  }

  /**
   * Search for businesses using Google Places Nearby Search
   */
  async searchGooglePlaces(config: {
    lat: number;
    lng: number;
    radius: number;
    keyword?: string;
    type?: string;
  }): Promise<GooglePlaceDetails[]> {
    try {
      const { lat, lng, radius, keyword, type } = config;
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: radius.toString(),
        key: this.googleApiKey
      });

      if (keyword) params.append('keyword', keyword);
      if (type) params.append('type', type);

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      // Get details for each place
      const detailedPlaces = [];
      for (const place of data.results || []) {
        try {
          const details = await this.getGooglePlaceDetails(place.place_id);
          if (details) {
            detailedPlaces.push(details);
          }
        } catch (error) {
          console.warn(`Failed to get details for ${place.name}:`, error);
        }
      }

      return detailedPlaces;
    } catch (error) {
      console.error('Google Places search failed:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a Google Place
   */
  async getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,address_components',
        key: this.googleApiKey
      });

      const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Place Details API error: ${data.status}`);
      }

      return data.result;
    } catch (error) {
      console.error(`Failed to get Google place details for ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Convert place data to clinic format
   */
  convertToClinic(googleData: GooglePlaceDetails | null): Partial<Clinic> {
    if (!googleData) {
      throw new Error('No data to convert');
    }

    const clinic: Partial<Clinic> = {
      name: googleData.name,
      address: this.extractStreetAddress(googleData.address_components),
      city: this.extractAddressComponent(googleData.address_components, 'locality'),
      state: this.extractAddressComponent(googleData.address_components, 'administrative_area_level_1'),
      phone: googleData.formatted_phone_number || '',
      website: googleData.website || '',
      lat: googleData.geometry.location.lat,
      lng: googleData.geometry.location.lng,
      rating: googleData.rating,
      googlePlacesId: googleData.place_id,
      tier: 'free',
      status: 'active'
    };

    return clinic;
  }

  /**
   * Extract street address from Google address components
   */
  private extractStreetAddress(components: GooglePlaceDetails['address_components']): string {
    const streetNumber = this.extractAddressComponent(components, 'street_number');
    const streetName = this.extractAddressComponent(components, 'route');
    return `${streetNumber} ${streetName}`.trim();
  }

  /**
   * Extract specific component from Google address components
   */
  private extractAddressComponent(
    components: GooglePlaceDetails['address_components'],
    type: string
  ): string {
    const component = components.find(c => c.types.includes(type));
    return component ? component.short_name : '';
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search a geographic grid for clinics
   */
  async searchGrid(
    grid: DiscoveryGrid,
    searchNiche: SearchNiche,
    maxConcurrentSearches: number
  ): Promise<Clinic[]> {
    const allClinics: Clinic[] = [];
    const processedPlaceIds = new Set<string>();
    
    // Get center of grid for search
    const centerLat = (grid.bounds.north + grid.bounds.south) / 2;
    const centerLng = (grid.bounds.east + grid.bounds.west) / 2;
    
    // Calculate radius to cover the grid (in meters)
    const latDistance = Math.abs(grid.bounds.north - grid.bounds.south) * 111000; // degrees to meters
    const lngDistance = Math.abs(grid.bounds.east - grid.bounds.west) * 111000 * Math.cos(centerLat * Math.PI / 180);
    const radius = Math.max(latDistance, lngDistance) / 2;
    
    // Search with each query term
    const searchPromises = grid.searchQueries.slice(0, maxConcurrentSearches).map(async (query) => {
      try {
        const places = await this.searchGooglePlaces({
          lat: centerLat,
          lng: centerLng,
          radius: Math.min(radius, 50000), // Google Places max radius is 50km
          keyword: query
        });
        
        return places;
      } catch (error) {
        console.error(`Search failed for query "${query}" in grid ${grid.id}:`, error);
        return [];
      }
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    // Process and deduplicate results
    for (const places of searchResults) {
      for (const place of places) {
        if (!processedPlaceIds.has(place.place_id)) {
          processedPlaceIds.add(place.place_id);
          
          // Check if place is within grid bounds
          if (place.geometry.location.lat >= grid.bounds.south &&
              place.geometry.location.lat <= grid.bounds.north &&
              place.geometry.location.lng >= grid.bounds.west &&
              place.geometry.location.lng <= grid.bounds.east) {
            
            // Convert to clinic format
            try {
              const clinicData = this.convertToClinic(place);
              
              // Filter based on search niche
              if (this.isRelevantToNiche(place.name, searchNiche)) {
                allClinics.push(clinicData as Clinic);
              }
            } catch (error) {
              console.warn(`Failed to convert place to clinic: ${place.name}`, error);
            }
          }
        }
      }
    }
    
    return allClinics;
  }

  /**
   * Check if a business name is relevant to the search niche
   */
  private isRelevantToNiche(name: string, niche: SearchNiche): boolean {
    const lowerName = name.toLowerCase();
    
    switch (niche) {
      case 'mensHealth':
        return (
          lowerName.includes('men') ||
          lowerName.includes('male') ||
          lowerName.includes('testosterone') ||
          lowerName.includes('trt') ||
          lowerName.includes('hormone') ||
          lowerName.includes('wellness') && !lowerName.includes('women')
        );
      case 'urgentCare':
        return (
          lowerName.includes('urgent') ||
          lowerName.includes('immediate') ||
          lowerName.includes('walk-in') ||
          lowerName.includes('express care')
        );
      case 'wellness':
        return (
          lowerName.includes('wellness') ||
          lowerName.includes('health center') ||
          lowerName.includes('medical center') ||
          lowerName.includes('clinic')
        );
      default:
        return true;
    }
  }

  /**
   * Extract social media links from a website
   */
  async extractSocialMediaLinks(websiteUrl: string): Promise<{
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    youtubeUrl?: string;
  }> {
    try {
      // Note: In a real implementation, you'd need to handle CORS by using a proxy or server-side fetching
      const response = await fetch(websiteUrl);
      const html = await response.text();
      
      const socialLinks: any = {};
      
      // Simple regex patterns for social media URLs
      const patterns = {
        facebookUrl: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w\-\.]+/gi,
        instagramUrl: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[\w\-\.]+/gi,
        twitterUrl: /(?:https?:\/\/)?(?:www\.)?twitter\.com\/[\w\-\.]+/gi,
        linkedinUrl: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[\w\-\.]+/gi,
        youtubeUrl: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|user|c)\/[\w\-\.]+/gi
      };
      
      for (const [key, pattern] of Object.entries(patterns)) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          // Take the first match and ensure it has https://
          socialLinks[key] = matches[0].startsWith('http') ? matches[0] : `https://${matches[0]}`;
        }
      }
      
      return socialLinks;
    } catch (error) {
      console.error(`Failed to extract social media links from ${websiteUrl}:`, error);
      return {};
    }
  }

  /**
   * Get Google reviews for a place
   */
  async getGoogleReviews(placeId: string): Promise<any[]> {
    // Note: Google Places API doesn't directly provide review details in the basic API
    // You would need to use the Google My Business API or scrape reviews
    // For now, returning empty array as reviews are handled separately
    return [];
  }
}