import admin from '../lib/firebase';

interface LocationStats {
  city: string;
  state: string;
  stateCode: string;
  clinicCount: number;
  premiumCount: number;
  enhancedCount: number;
  freeCount: number;
  topServices: string[];
  lastUpdated: Date;
}

interface CitySlugData {
  slug: string;
  city: string;
  state: string;
  stateCode: string;
  clinicCount: number;
  premiumCount: number;
  enhancedCount: number;
  freeCount: number;
  topServices: string[];
  lastUpdated: Date;
}

export async function clinicCountByLocation(): Promise<void> {
  console.log('🔍 Starting clinic count by location job...');
  
  const db = admin.firestore();
  const startTime = Date.now();
  
  try {
    // Get all active clinics
    const clinicsSnapshot = await db
      .collection('clinics')
      .where('status', '==', 'active')
      .get();
    
    console.log(`📊 Processing ${clinicsSnapshot.size} active clinics...`);
    
    // Group clinics by city and state
    const locationMap = new Map<string, {
      city: string;
      state: string;
      stateCode: string;
      clinics: any[];
    }>();
    
    clinicsSnapshot.docs.forEach(doc => {
      const clinic = doc.data();
      const locationKey = `${clinic.city.toLowerCase()}-${clinic.state.toLowerCase()}`;
      
      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          city: clinic.city,
          state: clinic.state,
          stateCode: getStateCode(clinic.state),
          clinics: []
        });
      }
      
      locationMap.get(locationKey)!.clinics.push(clinic);
    });
    
    console.log(`🌍 Found ${locationMap.size} unique locations`);
    
    // Process each location
    const batch = db.batch();
    const locationStats: LocationStats[] = [];
    
    for (const [locationKey, locationData] of locationMap) {
      const { city, state, stateCode, clinics } = locationData;
      
      // Count by tier
      const premiumCount = clinics.filter(c => c.package === 'premium').length;
      const enhancedCount = clinics.filter(c => c.package === 'basic').length;
      const freeCount = clinics.filter(c => c.package === 'free').length;
      
      // Get top services
      const serviceCount = new Map<string, number>();
      clinics.forEach(clinic => {
        (clinic.services || []).forEach((service: string) => {
          serviceCount.set(service, (serviceCount.get(service) || 0) + 1);
        });
      });
      
      const topServices = Array.from(serviceCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([service]) => service);
      
      const stats: LocationStats = {
        city,
        state,
        stateCode,
        clinicCount: clinics.length,
        premiumCount,
        enhancedCount,
        freeCount,
        topServices,
        lastUpdated: new Date()
      };
      
      locationStats.push(stats);
      
      // Create city slug
      const citySlug = createCitySlug(city, stateCode);
      
      const slugData: CitySlugData = {
        slug: citySlug,
        ...stats
      };
      
      // Add to batch
      const docRef = db.collection('stats').doc('cityCounts').collection('cities').doc(citySlug);
      batch.set(docRef, slugData);
      
      console.log(`📍 ${city}, ${stateCode}: ${clinics.length} clinics (${premiumCount} premium, ${enhancedCount} enhanced, ${freeCount} free)`);
    }
    
    // Create state-level stats
    const stateMap = new Map<string, {
      state: string;
      stateCode: string;
      totalClinics: number;
      premiumCount: number;
      enhancedCount: number;
      freeCount: number;
      cities: string[];
      topServices: string[];
    }>();
    
    locationStats.forEach(location => {
      const stateKey = location.stateCode;
      
      if (!stateMap.has(stateKey)) {
        stateMap.set(stateKey, {
          state: location.state,
          stateCode: location.stateCode,
          totalClinics: 0,
          premiumCount: 0,
          enhancedCount: 0,
          freeCount: 0,
          cities: [],
          topServices: []
        });
      }
      
      const stateData = stateMap.get(stateKey)!;
      stateData.totalClinics += location.clinicCount;
      stateData.premiumCount += location.premiumCount;
      stateData.enhancedCount += location.enhancedCount;
      stateData.freeCount += location.freeCount;
      stateData.cities.push(location.city);
    });
    
    // Add state-level documents
    for (const [stateCode, stateData] of stateMap) {
      // Get top services for the state
      const stateServiceCount = new Map<string, number>();
      locationStats
        .filter(l => l.stateCode === stateCode)
        .forEach(location => {
          location.topServices.forEach(service => {
            stateServiceCount.set(service, (stateServiceCount.get(service) || 0) + 1);
          });
        });
      
      stateData.topServices = Array.from(stateServiceCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([service]) => service);
      
      const stateDocRef = db.collection('stats').doc('stateCounts').collection('states').doc(stateCode);
      batch.set(stateDocRef, {
        ...stateData,
        lastUpdated: new Date()
      });
      
      console.log(`🏛️  ${stateData.state} (${stateCode}): ${stateData.totalClinics} total clinics across ${stateData.cities.length} cities`);
    }
    
    // Create summary document
    const summaryData = {
      totalClinics: clinicsSnapshot.size,
      totalLocations: locationMap.size,
      totalStates: stateMap.size,
      premiumClinics: locationStats.reduce((sum, l) => sum + l.premiumCount, 0),
      enhancedClinics: locationStats.reduce((sum, l) => sum + l.enhancedCount, 0),
      freeClinics: locationStats.reduce((sum, l) => sum + l.freeCount, 0),
      topStates: Array.from(stateMap.entries())
        .sort((a, b) => b[1].totalClinics - a[1].totalClinics)
        .slice(0, 10)
        .map(([code, data]) => ({
          stateCode: code,
          state: data.state,
          clinicCount: data.totalClinics
        })),
      topCities: locationStats
        .sort((a, b) => b.clinicCount - a.clinicCount)
        .slice(0, 20)
        .map(location => ({
          city: location.city,
          state: location.stateCode,
          clinicCount: location.clinicCount
        })),
      lastUpdated: new Date()
    };
    
    const summaryDocRef = db.collection('stats').doc('locationSummary');
    batch.set(summaryDocRef, summaryData);
    
    // Commit the batch
    await batch.commit();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Clinic count by location job completed in ${duration}ms`);
    console.log(`📊 Updated stats for ${locationMap.size} cities and ${stateMap.size} states`);
    
  } catch (error) {
    console.error('❌ Clinic count by location job failed:', error);
    throw error;
  }
}

function createCitySlug(city: string, stateCode: string): string {
  const citySlug = city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${citySlug}-${stateCode.toLowerCase()}`;
}

function getStateCode(stateName: string): string {
  const stateMap: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  
  // If it's already a 2-letter code, return as-is
  if (stateName.length === 2) {
    return stateName.toUpperCase();
  }
  
  // Otherwise, look up the full state name
  return stateMap[stateName] || stateName.substring(0, 2).toUpperCase();
}

// Helper function to get clinic counts for a specific city
export async function getClinicCountForCity(citySlug: string): Promise<CitySlugData | null> {
  try {
    const db = admin.firestore();
    const doc = await db
      .collection('stats')
      .doc('cityCounts')
      .collection('cities')
      .doc(citySlug)
      .get();
    
    if (doc.exists) {
      return doc.data() as CitySlugData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting clinic count for city:', error);
    return null;
  }
}

// Helper function to get all popular cities
export async function getPopularCities(limit: number = 20): Promise<CitySlugData[]> {
  try {
    const db = admin.firestore();
    const snapshot = await db
      .collection('stats')
      .doc('cityCounts')
      .collection('cities')
      .orderBy('clinicCount', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as CitySlugData);
  } catch (error) {
    console.error('Error getting popular cities:', error);
    return [];
  }
}

// Helper function to get location summary
export async function getLocationSummary(): Promise<any> {
  try {
    const db = admin.firestore();
    const doc = await db.collection('stats').doc('locationSummary').get();
    
    if (doc.exists) {
      return doc.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting location summary:', error);
    return null;
  }
}