import { DiscoveryGrid } from '../../types';

// Major US Metro Areas for Priority 1 searching
const MAJOR_METROS = [
  { name: 'New York', lat: 40.7128, lng: -74.0060, radius: 50, population: 8336817 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, radius: 60, population: 3979576 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, radius: 40, population: 2693976 },
  { name: 'Houston', lat: 29.7604, lng: -95.3698, radius: 45, population: 2320268 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740, radius: 35, population: 1680992 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652, radius: 35, population: 1584064 },
  { name: 'San Antonio', lat: 29.4241, lng: -98.4936, radius: 30, population: 1547253 },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611, radius: 35, population: 1423851 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970, radius: 40, population: 1343573 },
  { name: 'San Jose', lat: 37.3382, lng: -121.8863, radius: 25, population: 1021795 },
  { name: 'Austin', lat: 30.2672, lng: -97.7431, radius: 25, population: 978908 },
  { name: 'Jacksonville', lat: 30.3322, lng: -81.6557, radius: 30, population: 911507 },
  { name: 'Fort Worth', lat: 32.7555, lng: -97.3308, radius: 25, population: 909585 },
  { name: 'Columbus', lat: 39.9612, lng: -82.9988, radius: 25, population: 898553 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, radius: 20, population: 881549 },
  { name: 'Charlotte', lat: 35.2271, lng: -80.8431, radius: 25, population: 885708 },
  { name: 'Indianapolis', lat: 39.7684, lng: -86.1581, radius: 25, population: 887642 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, radius: 25, population: 749256 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, radius: 30, population: 715522 },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369, radius: 30, population: 705749 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, radius: 25, population: 695506 },
  { name: 'El Paso', lat: 31.7619, lng: -106.4850, radius: 25, population: 695044 },
  { name: 'Nashville', lat: 36.1627, lng: -86.7816, radius: 25, population: 689447 },
  { name: 'Detroit', lat: 42.3314, lng: -83.0458, radius: 25, population: 672662 },
  { name: 'Oklahoma City', lat: 35.4676, lng: -97.5164, radius: 30, population: 695979 },
  { name: 'Portland', lat: 45.5152, lng: -122.6784, radius: 25, population: 652503 },
  { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, radius: 25, population: 651319 },
  { name: 'Memphis', lat: 35.1495, lng: -90.0490, radius: 25, population: 633104 },
  { name: 'Louisville', lat: 38.2527, lng: -85.7585, radius: 25, population: 617638 },
  { name: 'Baltimore', lat: 39.2904, lng: -76.6122, radius: 25, population: 576498 },
  { name: 'Milwaukee', lat: 43.0389, lng: -87.9065, radius: 25, population: 577222 },
  { name: 'Albuquerque', lat: 35.0844, lng: -106.6504, radius: 25, population: 563002 },
  { name: 'Tucson', lat: 32.2226, lng: -110.9747, radius: 25, population: 548073 },
  { name: 'Fresno', lat: 36.7378, lng: -119.7871, radius: 25, population: 542107 },
  { name: 'Mesa', lat: 33.4152, lng: -111.8315, radius: 20, population: 518012 },
  { name: 'Sacramento', lat: 38.5816, lng: -121.4944, radius: 25, population: 513624 },
  { name: 'Atlanta', lat: 33.7490, lng: -84.3880, radius: 30, population: 506811 },
  { name: 'Kansas City', lat: 39.0997, lng: -94.5786, radius: 25, population: 508090 },
  { name: 'Colorado Springs', lat: 38.8339, lng: -104.8214, radius: 25, population: 478961 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, radius: 25, population: 442241 },
  { name: 'Raleigh', lat: 35.7796, lng: -78.6382, radius: 25, population: 474069 },
  { name: 'Omaha', lat: 41.2565, lng: -95.9345, radius: 25, population: 486051 },
  { name: 'Long Beach', lat: 33.7701, lng: -118.1937, radius: 15, population: 462628 },
  { name: 'Virginia Beach', lat: 36.8529, lng: -75.9780, radius: 25, population: 459470 },
  { name: 'Oakland', lat: 37.8044, lng: -122.2711, radius: 15, population: 440646 },
  { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, radius: 25, population: 429954 },
  { name: 'Tulsa', lat: 36.1540, lng: -95.9928, radius: 25, population: 413066 },
  { name: 'Tampa', lat: 27.9506, lng: -82.4572, radius: 25, population: 399700 },
  { name: 'Arlington', lat: 32.7357, lng: -97.1081, radius: 15, population: 398854 },
  { name: 'New Orleans', lat: 29.9511, lng: -90.0715, radius: 25, population: 383997 }
];

// Secondary cities (population 100k-500k)
const SECONDARY_CITIES = [
  { name: 'Wichita', lat: 37.6872, lng: -97.3301, population: 389965 },
  { name: 'Bakersfield', lat: 35.3733, lng: -119.0187, population: 383579 },
  { name: 'Aurora', lat: 39.7294, lng: -104.8319, population: 379289 },
  { name: 'Anaheim', lat: 33.8366, lng: -117.9143, population: 352497 },
  { name: 'Honolulu', lat: 21.3099, lng: -157.8581, population: 347397 },
  { name: 'Santa Ana', lat: 33.7455, lng: -117.8677, population: 335400 },
  { name: 'Riverside', lat: 33.9533, lng: -117.3962, population: 331360 },
  { name: 'Corpus Christi', lat: 27.8006, lng: -97.3964, population: 326586 },
  { name: 'Lexington', lat: 38.0406, lng: -84.5037, population: 323152 },
  { name: 'Henderson', lat: 36.0197, lng: -114.9817, population: 320189 },
  // Add more as needed...
];

export class GridGenerator {
  /**
   * Generate complete US search grid with priority-based coverage
   */
  static generateUSSearchGrid(config: {
    spacing?: number;
    includeRural?: boolean;
    maxGrids?: number;
    strategy?: 'metro_first' | 'nationwide' | 'state_by_state';
  } = {}): DiscoveryGrid[] {
    const {
      spacing = 10,
      includeRural = false,
      maxGrids = 10000,
      strategy = 'metro_first'
    } = config;

    const grids: DiscoveryGrid[] = [];

    switch (strategy) {
      case 'metro_first':
        // Phase 1: Dense metro coverage (Priority 1)
        grids.push(...this.generateMetroGrids(spacing / 2)); // 5 mile spacing
        
        // Phase 2: Secondary cities (Priority 2)
        grids.push(...this.generateSecondaryGrids(spacing)); // 10 mile spacing
        
        // Phase 3: Rural fill-in (Priority 3)
        if (includeRural) {
          grids.push(...this.generateRuralGrids(spacing * 2.5)); // 25 mile spacing
        }
        break;

      case 'nationwide':
        grids.push(...this.generateNationwideGrid(spacing));
        break;

      case 'state_by_state':
        grids.push(...this.generateStateByStateGrid(spacing));
        break;
    }

    // Remove overlaps and limit
    const optimized = this.optimizeGridOverlap(grids);
    return optimized.slice(0, maxGrids);
  }

  /**
   * Generate dense grids around major metro areas
   */
  private static generateMetroGrids(spacing: number): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];

    MAJOR_METROS.forEach((metro, index) => {
      const metroGrids = this.createRadialGrid({
        centerLat: metro.lat,
        centerLng: metro.lng,
        radiusKm: metro.radius * 1.60934, // Convert miles to km
        spacingKm: spacing * 1.60934,
        priority: 1,
        areaName: metro.name,
        expectedDensity: 'high'
      });

      grids.push(...metroGrids);
    });

    return grids;
  }

  /**
   * Generate grids for secondary cities
   */
  private static generateSecondaryGrids(spacing: number): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];

    SECONDARY_CITIES.forEach(city => {
      const cityGrids = this.createRadialGrid({
        centerLat: city.lat,
        centerLng: city.lng,
        radiusKm: 20 * 1.60934, // 20 mile radius
        spacingKm: spacing * 1.60934,
        priority: 2,
        areaName: city.name,
        expectedDensity: 'medium'
      });

      grids.push(...cityGrids);
    });

    return grids;
  }

  /**
   * Generate sparse rural coverage
   */
  private static generateRuralGrids(spacing: number): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];
    
    // US bounding box
    const bounds = {
      north: 49.3457868, // US northern border
      south: 24.7433195, // US southern border
      west: -124.7844079, // US western border
      east: -66.9513812  // US eastern border
    };

    const spacingLat = (spacing * 1.60934) / 111; // Convert miles to degrees latitude
    const spacingLng = spacingLat / Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);

    for (let lat = bounds.south; lat < bounds.north; lat += spacingLat) {
      for (let lng = bounds.west; lng < bounds.east; lng += spacingLng) {
        // Skip if too close to existing metro/secondary grids
        if (!this.isNearExistingGrid(lat, lng, grids, spacing * 1.60934)) {
          grids.push({
            id: `rural_${lat.toFixed(4)}_${lng.toFixed(4)}`,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            radius: spacing * 1.60934,
            priority: 3,
            status: 'pending',
            searchTermsUsed: [],
            clinicsFound: 0,
            area: 'Rural Coverage'
          });
        }
      }
    }

    return grids;
  }

  /**
   * Create radial grid around a center point
   */
  private static createRadialGrid(config: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    spacingKm: number;
    priority: 1 | 2 | 3;
    areaName: string;
    expectedDensity: 'high' | 'medium' | 'low';
  }): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];
    const { centerLat, centerLng, radiusKm, spacingKm, priority, areaName } = config;

    // Convert to degrees
    const radiusDeg = radiusKm / 111;
    const spacingDeg = spacingKm / 111;

    // Create grid points in a circle
    for (let lat = centerLat - radiusDeg; lat <= centerLat + radiusDeg; lat += spacingDeg) {
      for (let lng = centerLng - radiusDeg; lng <= centerLng + radiusDeg; lng += spacingDeg) {
        const distance = this.calculateDistance(centerLat, centerLng, lat, lng);
        
        if (distance <= radiusKm) {
          grids.push({
            id: `${areaName.toLowerCase().replace(/\s+/g, '_')}_${lat.toFixed(4)}_${lng.toFixed(4)}`,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            radius: spacingKm,
            priority,
            status: 'pending',
            searchTermsUsed: [],
            clinicsFound: 0,
            area: areaName
          });
        }
      }
    }

    return grids;
  }

  /**
   * Generate nationwide uniform grid
   */
  private static generateNationwideGrid(spacing: number): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];
    
    // US bounding box
    const bounds = {
      north: 49.3457868,
      south: 24.7433195,
      west: -124.7844079,
      east: -66.9513812
    };

    const spacingLat = (spacing * 1.60934) / 111;
    const spacingLng = spacingLat / Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);

    for (let lat = bounds.south; lat < bounds.north; lat += spacingLat) {
      for (let lng = bounds.west; lng < bounds.east; lng += spacingLng) {
        grids.push({
          id: `grid_${lat.toFixed(4)}_${lng.toFixed(4)}`,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          radius: spacing * 1.60934,
          priority: 2,
          status: 'pending',
          searchTermsUsed: [],
          clinicsFound: 0,
          area: 'Nationwide Coverage'
        });
      }
    }

    return grids;
  }

  /**
   * Generate state-by-state grid
   */
  private static generateStateByStateGrid(spacing: number): DiscoveryGrid[] {
    // This would require state boundary data
    // For now, return metro + secondary
    return [
      ...this.generateMetroGrids(spacing),
      ...this.generateSecondaryGrids(spacing)
    ];
  }

  /**
   * Remove overlapping grids and optimize coverage
   */
  private static optimizeGridOverlap(grids: DiscoveryGrid[]): DiscoveryGrid[] {
    const optimized: DiscoveryGrid[] = [];
    const minDistance = 8; // Minimum 8km between grid centers

    // Sort by priority first
    const sorted = grids.sort((a, b) => a.priority - b.priority);

    for (const grid of sorted) {
      const tooClose = optimized.some(existing => 
        this.calculateDistance(grid.lat, grid.lng, existing.lat, existing.lng) < minDistance
      );

      if (!tooClose) {
        optimized.push(grid);
      }
    }

    return optimized;
  }

  /**
   * Check if a point is near existing grids
   */
  private static isNearExistingGrid(
    lat: number, 
    lng: number, 
    existingGrids: DiscoveryGrid[], 
    minDistanceKm: number
  ): boolean {
    return existingGrids.some(grid => 
      this.calculateDistance(lat, lng, grid.lat, grid.lng) < minDistanceKm
    );
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get grid statistics
   */
  static getGridStats(grids: DiscoveryGrid[]) {
    const stats = {
      total: grids.length,
      byPriority: {
        high: grids.filter(g => g.priority === 1).length,
        medium: grids.filter(g => g.priority === 2).length,
        low: grids.filter(g => g.priority === 3).length
      },
      byStatus: {
        pending: grids.filter(g => g.status === 'pending').length,
        inProgress: grids.filter(g => g.status === 'in_progress').length,
        completed: grids.filter(g => g.status === 'completed').length,
        failed: grids.filter(g => g.status === 'failed').length
      },
      coverage: {
        metros: grids.filter(g => g.priority === 1).length,
        cities: grids.filter(g => g.priority === 2).length,
        rural: grids.filter(g => g.priority === 3).length
      }
    };

    return stats;
  }
}