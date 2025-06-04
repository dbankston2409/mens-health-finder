import { Clinic, GooglePhoto, YelpPhoto } from '../../types';

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  business_status?: string;
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
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  photos?: GooglePhoto[];
  reviews?: Array<{
    author_name: string;
    author_url: string;
    rating: number;
    text: string;
    time: number;
  }>;
  types: string[];
  plus_code?: {
    global_code: string;
    compound_code: string;
  };
  editorial_summary?: string;
  wheelchair_accessible_entrance?: boolean;
}

export interface YelpBusinessDetails {
  id: string;
  name: string;
  image_url: string;
  url: string;
  display_phone: string;
  phone: string;
  rating: number;
  review_count: number;
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  categories: Array<{
    alias: string;
    title: string;
  }>;
  hours?: Array<{
    open: Array<{
      is_overnight: boolean;
      start: string;
      end: string;
      day: number;
    }>;
    hours_type: string;
    is_open_now: boolean;
  }>;
  attributes?: Record<string, any>;
  messaging?: {
    url: string;
    use_case_text: string;
  };
  transactions: string[];
}

export class EnhancedDataCollector {
  private googleApiKey: string;
  private yelpApiKey: string;

  constructor(googleApiKey: string, yelpApiKey: string) {
    this.googleApiKey = googleApiKey;
    this.yelpApiKey = yelpApiKey;
  }

  /**
   * Search for businesses using Google Places Nearby Search
   */
  async searchGooglePlaces(config: {
    lat: number;
    lng: number;
    radius: number; // in meters
    keyword: string;
    type?: string;
  }): Promise<GooglePlaceDetails[]> {
    const { lat, lng, radius, keyword, type = 'health' } = config;
    
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&` +
        `type=${type}&key=${this.googleApiKey}`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`);
      }

      const places: GooglePlaceDetails[] = [];

      // Get detailed information for each place
      for (const place of data.results || []) {
        try {
          const details = await this.getGooglePlaceDetails(place.place_id);
          if (details) {
            places.push(details);
          }
          
          // Rate limiting
          await this.delay(100);
        } catch (error) {
          console.warn(`Failed to get details for place ${place.place_id}:`, error);
        }
      }

      return places;
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
      const fields = [
        'place_id', 'name', 'formatted_address', 'formatted_phone_number',
        'international_phone_number', 'website', 'rating', 'user_ratings_total',
        'price_level', 'business_status', 'geometry', 'address_components',
        'opening_hours', 'photos', 'reviews', 'types', 'plus_code',
        'editorial_summary', 'wheelchair_accessible_entrance'
      ].join(',');

      const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}&fields=${fields}&key=${this.googleApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Place Details API error: ${data.status}`);
      }

      return data.result;
    } catch (error) {
      console.error(`Failed to get Google Place details for ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Search for businesses using Yelp Fusion API
   */
  async searchYelp(config: {
    lat: number;
    lng: number;
    radius: number; // in meters
    term: string;
    categories?: string;
    limit?: number;
  }): Promise<YelpBusinessDetails[]> {
    const { lat, lng, radius, term, categories, limit = 50 } = config;

    try {
      const searchParams = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius: Math.min(radius, 40000).toString(), // Yelp max radius is 40km
        term,
        limit: limit.toString(),
        sort_by: 'best_match'
      });

      if (categories) {
        searchParams.append('categories', categories);
      }

      const url = `https://api.yelp.com/v3/businesses/search?${searchParams}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.yelpApiKey}`
        }
      });

      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(`Yelp API error: ${response.status} - ${data.error?.description}`);
      }

      const businesses: YelpBusinessDetails[] = [];

      // Get detailed information for each business
      for (const business of data.businesses || []) {
        try {
          const details = await this.getYelpBusinessDetails(business.id);
          if (details) {
            businesses.push(details);
          }

          // Rate limiting
          await this.delay(200);
        } catch (error) {
          console.warn(`Failed to get Yelp details for ${business.id}:`, error);
        }
      }

      return businesses;
    } catch (error) {
      console.error('Yelp search failed:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a Yelp business
   */
  async getYelpBusinessDetails(businessId: string): Promise<YelpBusinessDetails | null> {
    try {
      const url = `https://api.yelp.com/v3/businesses/${businessId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.yelpApiKey}`
        }
      });

      if (response.status !== 200) {
        throw new Error(`Yelp Business Details API error: ${response.status}`);
      }

      const business = await response.json();
      return business;
    } catch (error) {
      console.error(`Failed to get Yelp business details for ${businessId}:`, error);
      return null;
    }
  }

  /**
   * Extract social media links from a website
   */
  async extractSocialMediaLinks(websiteUrl: string): Promise<Partial<Clinic['socialMedia']>> {
    try {
      const response = await fetch(websiteUrl);
      const html = await response.text();

      const socialMedia: Partial<Clinic['socialMedia']> = {};

      // Instagram
      const instagramMatch = html.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_\.]+)/);
      if (instagramMatch) {
        socialMedia.instagram = `https://instagram.com/${instagramMatch[1]}`;
      }

      // Facebook
      const facebookMatch = html.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9_\.]+)/);
      if (facebookMatch) {
        socialMedia.facebook = `https://facebook.com/${facebookMatch[1]}`;
      }

      // Twitter
      const twitterMatch = html.match(/(?:https?:\/\/)?(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/);
      if (twitterMatch) {
        socialMedia.twitter = `https://twitter.com/${twitterMatch[1]}`;
      }

      // LinkedIn
      const linkedinMatch = html.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/);
      if (linkedinMatch) {
        socialMedia.linkedin = `https://linkedin.com/company/${linkedinMatch[1]}`;
      }

      // YouTube
      const youtubeMatch = html.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/)?([a-zA-Z0-9_-]+)/);
      if (youtubeMatch) {
        socialMedia.youtube = `https://youtube.com/channel/${youtubeMatch[1]}`;
      }

      return socialMedia;
    } catch (error) {
      console.warn(`Failed to extract social media from ${websiteUrl}:`, error);
      return {};
    }
  }

  /**
   * Detect specialized services from business information
   */
  detectSpecializedServices(businessInfo: {
    name: string;
    description?: string;
    categories?: string[];
    website?: string;
  }): Partial<Clinic['specializedServices']> {
    const { name, description = '', categories = [] } = businessInfo;
    const text = `${name} ${description} ${categories.join(' ')}`.toLowerCase();

    const services: Partial<Clinic['specializedServices']> = {};

    // TRT/Testosterone
    if (text.match(/\b(trt|testosterone|hormone replacement|androgen)\b/)) {
      services.trt = true;
    }

    // ED Treatment
    if (text.match(/\b(ed|erectile dysfunction|impotence|viagra|cialis)\b/)) {
      services.ed = true;
    }

    // Weight Loss
    if (text.match(/\b(weight loss|bariatric|obesity|diet|nutrition)\b/)) {
      services.weightLoss = true;
    }

    // Peptides
    if (text.match(/\b(peptide|growth hormone|hgh|sermorelin)\b/)) {
      services.peptides = true;
    }

    // HRT (general)
    if (text.match(/\b(hrt|hormone replacement|bioidentical|hormones)\b/)) {
      services.hrt = true;
    }

    // Wellness
    if (text.match(/\b(wellness|integrative|functional medicine|anti.?aging)\b/)) {
      services.wellness = true;
    }

    // Telehealth
    if (text.match(/\b(telehealth|telemedicine|virtual|online consultation)\b/)) {
      services.telehealth = true;
    }

    return services;
  }

  /**
   * Extract email addresses from website
   */
  async extractEmailAddresses(websiteUrl: string): Promise<string[]> {
    try {
      const response = await fetch(websiteUrl);
      const html = await response.text();

      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = html.match(emailRegex) || [];

      // Filter out common generic emails
      const filtered = emails.filter(email => 
        !email.includes('noreply') && 
        !email.includes('no-reply') &&
        !email.includes('example.com') &&
        !email.includes('test@')
      );

      return [...new Set(filtered)]; // Remove duplicates
    } catch (error) {
      console.warn(`Failed to extract emails from ${websiteUrl}:`, error);
      return [];
    }
  }

  /**
   * Merge Google and Yelp data into enhanced clinic profile
   */
  mergeBusinessData(
    googleData?: GooglePlaceDetails,
    yelpData?: YelpBusinessDetails,
    socialData?: Partial<Clinic['socialMedia']>,
    emails?: string[]
  ): Partial<Clinic> {
    const clinic: Partial<Clinic> = {
      enhancementStatus: 'complete'
    };

    // Basic information (prefer Google for accuracy)
    if (googleData) {
      clinic.name = googleData.name;
      clinic.address = this.extractStreetAddress(googleData.address_components);
      clinic.city = this.extractAddressComponent(googleData.address_components, 'locality');
      clinic.state = this.extractAddressComponent(googleData.address_components, 'administrative_area_level_1');
      clinic.zip = this.extractAddressComponent(googleData.address_components, 'postal_code');
      clinic.phone = googleData.formatted_phone_number || googleData.international_phone_number;
      clinic.website = googleData.website;
      clinic.lat = googleData.geometry.location.lat;
      clinic.lng = googleData.geometry.location.lng;
      clinic.googlePlacesId = googleData.place_id;

      // Business intelligence from Google
      clinic.priceLevel = googleData.price_level;
      clinic.businessStatus = googleData.business_status as any;
      clinic.googleRating = googleData.rating;
      clinic.googleReviewCount = googleData.user_ratings_total;

      // Accessibility
      clinic.accessibility = {
        wheelchairAccessible: googleData.wheelchair_accessible_entrance
      };

      // Photos from Google
      clinic.photos = {
        google: googleData.photos || [],
        hero: googleData.photos?.[0]?.photo_reference
      };
    }

    // Additional data from Yelp
    if (yelpData) {
      clinic.yelpBusinessId = yelpData.id;
      clinic.priceBracket = yelpData.price as any;
      clinic.yelpRating = yelpData.rating;
      clinic.yelpReviewCount = yelpData.review_count;

      // If no Google data, use Yelp for basic info
      if (!googleData) {
        clinic.name = yelpData.name;
        clinic.address = yelpData.location.address1;
        clinic.city = yelpData.location.city;
        clinic.state = yelpData.location.state;
        clinic.zip = yelpData.location.zip_code;
        clinic.phone = yelpData.display_phone;
        clinic.lat = yelpData.coordinates.latitude;
        clinic.lng = yelpData.coordinates.longitude;
      }

      // Yelp photos
      if (clinic.photos) {
        clinic.photos.yelp = yelpData.photos.map(url => ({ url, width: 0, height: 0 }));
        clinic.photos.gallery = [...(clinic.photos.gallery || []), ...yelpData.photos];
      }

      // Categories for service detection
      const categories = yelpData.categories.map(cat => cat.title);
      clinic.specializedServices = this.detectSpecializedServices({
        name: yelpData.name,
        categories
      });

      // Messaging capability
      if (yelpData.messaging) {
        clinic.contactMethods = {
          phone: clinic.phone || '',
          messaging: yelpData.messaging
        };
      }
    }

    // Social media data
    if (socialData) {
      clinic.socialMedia = socialData;
    }

    // Contact methods
    if (emails && emails.length > 0) {
      clinic.contactMethods = {
        ...clinic.contactMethods,
        email: emails[0], // Use first email found
        phone: clinic.phone || ''
      };
    }

    // Set default tier
    clinic.tier = 'free';
    clinic.status = 'active';

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
   * Extract specific address component from Google address components
   */
  private extractAddressComponent(
    components: GooglePlaceDetails['address_components'],
    type: string
  ): string {
    const component = components.find(comp => comp.types.includes(type));
    return component?.long_name || component?.short_name || '';
  }

  /**
   * Rate limiting delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Predefined search niches
export const SEARCH_NICHES = {
  mensHealth: {
    id: 'mensHealth',
    name: "Men's Health Clinics",
    searchTerms: [
      'mens health clinic',
      'testosterone clinic',
      'TRT clinic',
      'mens wellness center',
      'hormone replacement therapy',
      'erectile dysfunction clinic',
      'low testosterone treatment'
    ],
    yelpCategories: 'menshealth,health,doctors,testosterone',
    googleTypes: ['health', 'doctor', 'hospital'],
    excludeTerms: ['spa', 'salon', 'massage'],
    description: 'Clinics specializing in men\'s health, testosterone therapy, and related services'
  },
  urgentCare: {
    id: 'urgentCare',
    name: 'Urgent Care Centers',
    searchTerms: [
      'urgent care',
      'walk in clinic',
      'immediate care',
      'emergency clinic'
    ],
    yelpCategories: 'urgentcare,health,doctors',
    googleTypes: ['health', 'hospital'],
    excludeTerms: ['emergency room', 'hospital'],
    description: 'Walk-in urgent care and immediate medical care facilities'
  },
  wellness: {
    id: 'wellness',
    name: 'Wellness Centers',
    searchTerms: [
      'wellness center',
      'integrative medicine',
      'functional medicine',
      'anti aging clinic',
      'longevity clinic'
    ],
    yelpCategories: 'wellness,health,alternativemedicine',
    googleTypes: ['health'],
    excludeTerms: ['spa', 'massage'],
    description: 'Integrative and functional medicine wellness centers'
  }
};