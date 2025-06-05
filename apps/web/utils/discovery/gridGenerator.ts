import { DiscoveryGrid } from '../../types';

export interface GridBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class GridGenerator {
  // Major US metro areas for metro_first strategy
  private metroAreas = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, radius: 50 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, radius: 50 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298, radius: 40 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698, radius: 40 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.0740, radius: 35 },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652, radius: 35 },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936, radius: 30 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611, radius: 30 },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970, radius: 35 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863, radius: 25 },
    { name: 'Austin', lat: 30.2672, lng: -97.7431, radius: 25 },
    { name: 'Jacksonville', lat: 30.3322, lng: -81.6557, radius: 25 },
    { name: 'Fort Worth', lat: 32.7555, lng: -97.3308, radius: 25 },
    { name: 'Columbus', lat: 39.9612, lng: -82.9988, radius: 20 },
    { name: 'Charlotte', lat: 35.2271, lng: -80.8431, radius: 20 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, radius: 25 },
    { name: 'Indianapolis', lat: 39.7684, lng: -86.1581, radius: 20 },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321, radius: 25 },
    { name: 'Denver', lat: 39.7392, lng: -104.9903, radius: 25 },
    { name: 'Washington DC', lat: 38.9072, lng: -77.0369, radius: 25 },
    { name: 'Boston', lat: 42.3601, lng: -71.0589, radius: 25 },
    { name: 'Nashville', lat: 36.1627, lng: -86.7816, radius: 20 },
    { name: 'Baltimore', lat: 39.2904, lng: -76.6122, radius: 20 },
    { name: 'Oklahoma City', lat: 35.4676, lng: -97.5164, radius: 20 },
    { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, radius: 20 },
    { name: 'Portland', lat: 45.5152, lng: -122.6784, radius: 20 },
    { name: 'Memphis', lat: 35.1495, lng: -90.0490, radius: 20 },
    { name: 'Louisville', lat: 38.2527, lng: -85.7585, radius: 20 },
    { name: 'Milwaukee', lat: 43.0389, lng: -87.9065, radius: 20 },
    { name: 'Albuquerque', lat: 35.0844, lng: -106.6504, radius: 20 },
    { name: 'Tucson', lat: 32.2226, lng: -110.9747, radius: 20 },
    { name: 'Fresno', lat: 36.7378, lng: -119.7871, radius: 15 },
    { name: 'Sacramento', lat: 38.5816, lng: -121.4944, radius: 20 },
    { name: 'Kansas City', lat: 39.0997, lng: -94.5786, radius: 20 },
    { name: 'Mesa', lat: 33.4152, lng: -111.8315, radius: 15 },
    { name: 'Atlanta', lat: 33.7490, lng: -84.3880, radius: 30 },
    { name: 'Miami', lat: 25.7617, lng: -80.1918, radius: 30 },
    { name: 'Tampa', lat: 27.9506, lng: -82.4572, radius: 25 },
    { name: 'Orlando', lat: 28.5383, lng: -81.3792, radius: 20 },
    { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, radius: 25 }
  ];

  // US bounds for nationwide strategy
  private usBounds: GridBounds = {
    north: 49.0,
    south: 25.0,
    east: -66.0,
    west: -125.0
  };

  generateGrids(strategy: 'metro_first' | 'nationwide' | 'state_by_state', targetCount: number): DiscoveryGrid[] {
    switch (strategy) {
      case 'metro_first':
        return this.generateMetroFirstGrids(targetCount);
      case 'nationwide':
        return this.generateNationwideGrids(targetCount);
      case 'state_by_state':
        return this.generateStateByStateGrids(targetCount);
      default:
        return this.generateMetroFirstGrids(targetCount);
    }
  }

  private generateMetroFirstGrids(targetCount: number): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];
    const gridSize = 0.05; // Approximately 5.5km x 5.5km at mid-latitudes
    
    // Calculate grids per metro to reach target
    const gridsPerMetro = Math.ceil(targetCount / this.metroAreas.length / 20); // Estimate ~20 clinics per grid
    
    this.metroAreas.forEach((metro, metroIndex) => {
      const metroGrids = this.generateGridsForArea(
        metro.lat,
        metro.lng,
        metro.radius,
        gridSize,
        gridsPerMetro
      );
      
      metroGrids.forEach((grid, gridIndex) => {
        grids.push({
          id: `metro_${metroIndex}_${gridIndex}`,
          bounds: grid,
          status: 'pending',
          clinicsFound: 0,
          lastSearched: null,
          searchQueries: [
            'men\'s health clinic',
            'testosterone therapy',
            'TRT clinic',
            'men\'s wellness center',
            'hormone replacement therapy'
          ]
        });
      });
    });
    
    return grids;
  }

  private generateNationwideGrids(targetCount: number): DiscoveryGrid[] {
    const grids: DiscoveryGrid[] = [];
    const gridSize = 0.25; // Larger grids for nationwide coverage
    
    const latSteps = Math.ceil((this.usBounds.north - this.usBounds.south) / gridSize);
    const lngSteps = Math.ceil((this.usBounds.east - this.usBounds.west) / gridSize);
    
    let gridId = 0;
    for (let latStep = 0; latStep < latSteps; latStep++) {
      for (let lngStep = 0; lngStep < lngSteps; lngStep++) {
        const south = this.usBounds.south + (latStep * gridSize);
        const north = Math.min(south + gridSize, this.usBounds.north);
        const west = this.usBounds.west + (lngStep * gridSize);
        const east = Math.min(west + gridSize, this.usBounds.east);
        
        grids.push({
          id: `nationwide_${gridId++}`,
          bounds: { north, south, east, west },
          status: 'pending',
          clinicsFound: 0,
          lastSearched: null,
          searchQueries: [
            'men\'s health clinic',
            'testosterone clinic',
            'men\'s wellness'
          ]
        });
        
        // Stop if we have enough grids
        if (grids.length >= targetCount / 10) break;
      }
      if (grids.length >= targetCount / 10) break;
    }
    
    return grids;
  }

  private generateStateByStateGrids(targetCount: number): DiscoveryGrid[] {
    // For demo, just use top states by population
    const topStates = [
      { name: 'California', bounds: { north: 42.0, south: 32.5, east: -114.0, west: -124.5 } },
      { name: 'Texas', bounds: { north: 36.5, south: 25.8, east: -93.5, west: -106.6 } },
      { name: 'Florida', bounds: { north: 31.0, south: 24.5, east: -80.0, west: -87.6 } },
      { name: 'New York', bounds: { north: 45.0, south: 40.5, east: -71.8, west: -79.8 } },
      { name: 'Pennsylvania', bounds: { north: 42.3, south: 39.7, east: -74.7, west: -80.5 } },
      { name: 'Illinois', bounds: { north: 42.5, south: 37.0, east: -87.0, west: -91.5 } },
      { name: 'Ohio', bounds: { north: 42.0, south: 38.4, east: -80.5, west: -84.8 } },
      { name: 'Georgia', bounds: { north: 35.0, south: 30.4, east: -81.0, west: -85.6 } },
      { name: 'North Carolina', bounds: { north: 36.6, south: 33.8, east: -75.5, west: -84.3 } },
      { name: 'Michigan', bounds: { north: 48.3, south: 41.7, east: -82.1, west: -90.4 } }
    ];
    
    const grids: DiscoveryGrid[] = [];
    const gridsPerState = Math.ceil(targetCount / topStates.length / 15);
    
    topStates.forEach((state, stateIndex) => {
      const stateGrids = this.generateGridsForBounds(
        state.bounds,
        0.1, // 0.1 degree grids
        gridsPerState
      );
      
      stateGrids.forEach((grid, gridIndex) => {
        grids.push({
          id: `state_${state.name}_${gridIndex}`,
          bounds: grid,
          status: 'pending',
          clinicsFound: 0,
          lastSearched: null,
          searchQueries: [
            'men\'s health clinic',
            'testosterone replacement therapy',
            'TRT center',
            'hormone clinic'
          ]
        });
      });
    });
    
    return grids;
  }

  private generateGridsForArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    gridSize: number,
    maxGrids: number
  ): GridBounds[] {
    const grids: GridBounds[] = [];
    const radiusDegrees = radiusKm / 111; // Rough conversion
    
    const latSteps = Math.ceil((radiusDegrees * 2) / gridSize);
    const lngSteps = Math.ceil((radiusDegrees * 2) / gridSize);
    
    for (let latStep = 0; latStep < latSteps && grids.length < maxGrids; latStep++) {
      for (let lngStep = 0; lngStep < lngSteps && grids.length < maxGrids; lngStep++) {
        const south = centerLat - radiusDegrees + (latStep * gridSize);
        const north = south + gridSize;
        const west = centerLng - radiusDegrees + (lngStep * gridSize);
        const east = west + gridSize;
        
        // Check if grid center is within radius
        const gridCenterLat = (north + south) / 2;
        const gridCenterLng = (east + west) / 2;
        const distance = this.getDistance(centerLat, centerLng, gridCenterLat, gridCenterLng);
        
        if (distance <= radiusKm) {
          grids.push({ north, south, east, west });
        }
      }
    }
    
    return grids;
  }

  private generateGridsForBounds(
    bounds: GridBounds,
    gridSize: number,
    maxGrids: number
  ): GridBounds[] {
    const grids: GridBounds[] = [];
    
    const latSteps = Math.ceil((bounds.north - bounds.south) / gridSize);
    const lngSteps = Math.ceil((bounds.east - bounds.west) / gridSize);
    
    for (let latStep = 0; latStep < latSteps && grids.length < maxGrids; latStep++) {
      for (let lngStep = 0; lngStep < lngSteps && grids.length < maxGrids; lngStep++) {
        const south = bounds.south + (latStep * gridSize);
        const north = Math.min(south + gridSize, bounds.north);
        const west = bounds.west + (lngStep * gridSize);
        const east = Math.min(west + gridSize, bounds.east);
        
        grids.push({ north, south, east, west });
      }
    }
    
    return grids;
  }

  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}