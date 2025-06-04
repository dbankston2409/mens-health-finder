import { Clinic } from '../../types';

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
}