import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  Timestamp, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Logs a call click event to Firestore
 * 
 * @param clinicId - The ID of the clinic being called
 * @param searchQuery - The search query that led to this call (if any)
 * @param sourcePage - The page that initiated the call
 */
export const logCallClick = async (
  clinicId: string, 
  searchQuery?: string, 
  sourcePage?: string
): Promise<void> => {
  try {
    // Get device type information
    const deviceType = getDeviceType();
    
    // Get user region (if available through browser)
    const userRegion = getUserRegion();
    
    // Create call log document
    await addDoc(collection(db, 'call_logs'), {
      clinicId,
      timestamp: Timestamp.now(),
      searchQuery: searchQuery || '',
      sourcePage: sourcePage || window.location.pathname + window.location.search,
      userRegion,
      deviceType
    });
    
    // Update clinic call metrics
    const clinicRef = doc(db, 'clinics', clinicId);
    
    // Check if trafficMeta exists
    const clinicDoc = await getDoc(clinicRef);
    if (!clinicDoc.exists()) {
      console.error(`Clinic ${clinicId} does not exist`);
      return;
    }
    
    const clinicData = clinicDoc.data();
    
    // If trafficMeta doesn't exist, create it
    if (!clinicData.trafficMeta) {
      await updateDoc(clinicRef, {
        'trafficMeta': {
          callClicks: 1,
          lastCallClick: Timestamp.now()
        }
      });
    } else {
      // Update existing trafficMeta
      await updateDoc(clinicRef, {
        'trafficMeta.callClicks': increment(1),
        'trafficMeta.lastCallClick': Timestamp.now()
      });
    }
    
    console.log(`Call click logged for clinic ${clinicId}`);
  } catch (error) {
    console.error('Error logging call click:', error);
  }
};

/**
 * Gets call click metrics for a clinic within a specific time range
 * 
 * @param clinicId - The ID of the clinic
 * @param timeRange - The time range in days (default: 30)
 */
export const getCallClickMetrics = async (
  clinicId: string, 
  timeRange: number = 30
) => {
  try {
    // Calculate start date for time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    // Query call logs for this clinic within the time range
    const callLogsRef = collection(db, 'call_logs');
    const q = query(
      callLogsRef,
      where('clinicId', '==', clinicId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Process results
    const calls: any[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Convert timestamp to Date
      const timestamp = data.timestamp instanceof Timestamp 
        ? data.timestamp.toDate() 
        : new Date(data.timestamp);
        
      calls.push({
        ...data,
        timestamp
      });
    });
    
    // Count total calls
    const totalCalls = calls.length;
    
    // Get unique days with calls
    const uniqueDays = new Set(
      calls.map(call => call.timestamp.toISOString().split('T')[0])
    );
    
    // Calculate peak call day
    const dayCount: Record<string, number> = {};
    calls.forEach(call => {
      const day = call.timestamp.toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    const peakCallDay = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])
      .map(([day]) => day)[0] || 'N/A';
    
    // Aggregate calls by hour
    const callsByHour: Record<string, number> = {};
    calls.forEach(call => {
      const hour = call.timestamp.getHours().toString().padStart(2, '0') + ':00';
      callsByHour[hour] = (callsByHour[hour] || 0) + 1;
    });
    
    // Aggregate calls by device
    const deviceCount: Record<string, number> = {};
    calls.forEach(call => {
      const device = call.deviceType || 'unknown';
      deviceCount[device] = (deviceCount[device] || 0) + 1;
    });
    
    const callsByDevice: Record<string, string> = {};
    Object.entries(deviceCount).forEach(([device, count]) => {
      const percentage = Math.round((count / totalCalls) * 100);
      callsByDevice[device] = `${percentage}%`;
    });
    
    // Aggregate calls by search query
    const queryCount: Record<string, number> = {};
    calls.forEach(call => {
      if (call.searchQuery) {
        const query = call.searchQuery.toLowerCase().trim();
        queryCount[query] = (queryCount[query] || 0) + 1;
      }
    });
    
    const callsBySearchQuery = Object.entries(queryCount)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalCalls,
      uniqueDays: uniqueDays.size,
      peakCallDay,
      callsByHour,
      callsByDevice,
      callsBySearchQuery
    };
  } catch (error) {
    console.error('Error getting call click metrics:', error);
    return {
      totalCalls: 0,
      uniqueDays: 0,
      peakCallDay: 'N/A',
      callsByHour: {},
      callsByDevice: {},
      callsBySearchQuery: []
    };
  }
};

/**
 * Gets the top clinics by call volume within a specific time range
 * 
 * @param limit - The number of top clinics to return
 * @param timeRange - The time range in days (default: 30)
 */
export const getTopClinicsByCallVolume = async (
  limitCount: number = 5,
  timeRange: number = 30
) => {
  try {
    // Calculate start date for time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    // Query call logs within the time range
    const callLogsRef = collection(db, 'call_logs');
    const q = query(
      callLogsRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const querySnapshot = await getDocs(q);
    
    // Count calls by clinic
    const clinicCallCount: Record<string, number> = {};
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const clinicId = data.clinicId;
      
      clinicCallCount[clinicId] = (clinicCallCount[clinicId] || 0) + 1;
    });
    
    // Sort clinics by call count
    const sortedClinics = Object.entries(clinicCallCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount);
    
    // Get clinic details for each top clinic
    const topClinics = await Promise.all(
      sortedClinics.map(async ([clinicId, callCount]) => {
        try {
          const clinicDoc = await getDoc(doc(db, 'clinics', clinicId));
          if (clinicDoc.exists()) {
            const clinicData = clinicDoc.data();
            return {
              id: clinicId,
              name: clinicData.name,
              city: clinicData.city,
              state: clinicData.state,
              callCount
            };
          }
          return null;
        } catch (err) {
          console.error(`Error getting clinic ${clinicId}:`, err);
          return null;
        }
      })
    );
    
    return topClinics.filter(clinic => clinic !== null);
  } catch (error) {
    console.error('Error getting top clinics by call volume:', error);
    return [];
  }
};

/**
 * Helper to determine the user's device type
 */
const getDeviceType = (): string => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  if (/android/i.test(userAgent)) {
    return 'mobile';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    // iOS detection
    return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  if (/tablet|iPad/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
};

/**
 * Helper to determine the user's region (if available)
 */
const getUserRegion = (): string | null => {
  try {
    const language = navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Return basic region information based on browser data
    return `${language}, ${timeZone}`;
  } catch (error) {
    console.error('Error getting user region:', error);
    return null;
  }
};

export default { 
  logCallClick, 
  getCallClickMetrics, 
  getTopClinicsByCallVolume 
};