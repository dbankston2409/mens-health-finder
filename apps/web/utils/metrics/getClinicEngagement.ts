import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { ClinicEngagementMetrics, MetricOptions } from './types';
import { getDateDaysAgo, getStartOfMonth, isCurrentMonth } from './dateUtils';

/**
 * Get engagement metrics for a specific clinic
 * 
 * @param db Firestore database instance
 * @param clinicId ID of the clinic to analyze
 * @param options Options for filtering the metrics
 * @returns Promise resolving to ClinicEngagementMetrics object
 */
export async function getClinicEngagement(
  db: Firestore,
  clinicId: string,
  options: MetricOptions = {}
): Promise<ClinicEngagementMetrics> {
  try {
    if (!clinicId) {
      throw new Error('Clinic ID is required');
    }

    // Default to last 90 days if no date range specified
    const startDate = options.startDate || getDateDaysAgo(90);
    const endDate = options.endDate || Timestamp.now();
    const limit = options.limit || 10;
    
    // Get previous period for trend comparison
    const endTimeMs = endDate instanceof Timestamp 
      ? endDate.toMillis()
      : endDate.getTime();
      
    const startTimeMs = startDate instanceof Timestamp
      ? startDate.toMillis()
      : startDate.getTime();
      
    const periodLengthMs = endTimeMs - startTimeMs;
    
    let previousPeriodStart;
    if (startDate instanceof Timestamp) {
      previousPeriodStart = new Timestamp(
        startDate.seconds - Math.floor(periodLengthMs / 1000),
        startDate.nanoseconds || 0
      );
    } else {
      const prevDate = new Date(startDate.getTime() - periodLengthMs);
      previousPeriodStart = Timestamp.fromDate(prevDate);
    }
    
    // Query traffic logs for this clinic
    const trafficLogsRef = db.collection('traffic_logs');
    const currentPeriodQuery = trafficLogsRef
      .where('clinicId', '==', clinicId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
      
    const previousPeriodQuery = trafficLogsRef
      .where('clinicId', '==', clinicId)
      .where('timestamp', '>=', previousPeriodStart)
      .where('timestamp', '<', startDate);
    
    // Run queries in parallel
    const [currentLogsSnapshot, previousLogsSnapshot] = await Promise.all([
      currentPeriodQuery.get(),
      previousPeriodQuery.get()
    ]);
    
    const currentLogs = currentLogsSnapshot.docs.map(doc => doc.data());
    const previousLogs = previousLogsSnapshot.docs.map(doc => doc.data());
    
    // Calculate total views
    const totalViews = currentLogs.filter(log => 
      log.eventType === 'view' || log.eventType === 'click'
    ).length;
    
    // Find last viewed timestamp
    let lastViewed: Timestamp | null = null;
    
    if (currentLogs.length > 0) {
      // Sort logs by timestamp (descending)
      const sortedLogs = [...currentLogs].sort((a, b) => 
        b.timestamp.toMillis() - a.timestamp.toMillis()
      );
      
      // Find the most recent view or click event
      const mostRecentLog = sortedLogs.find(log => 
        log.eventType === 'view' || log.eventType === 'click'
      );
      
      if (mostRecentLog) {
        lastViewed = mostRecentLog.timestamp;
      }
    }
    
    // Count views this month
    const currentMonthStart = getStartOfMonth();
    const viewsThisMonth = currentLogs.filter(log => 
      (log.eventType === 'view' || log.eventType === 'click') &&
      isCurrentMonth(log.timestamp)
    ).length;
    
    // Calculate view trend compared to previous period
    const previousPeriodViews = previousLogs.filter(log => 
      log.eventType === 'view' || log.eventType === 'click'
    ).length;
    
    let viewsTrend: 'up' | 'down' | 'stable' = 'stable';
    
    if (totalViews > previousPeriodViews * 1.1) {
      viewsTrend = 'up';
    } else if (totalViews < previousPeriodViews * 0.9) {
      viewsTrend = 'down';
    }
    
    // Aggregate search terms that led to this clinic
    const searchTerms: Record<string, number> = {};
    
    currentLogs.forEach(log => {
      // Only include search events that led to this clinic
      if (log.searchQuery && log.resultingClinicId === clinicId) {
        const normalizedQuery = log.searchQuery.toLowerCase().trim();
        searchTerms[normalizedQuery] = (searchTerms[normalizedQuery] || 0) + 1;
      }
    });
    
    // Sort search terms by count and get top results
    const topSearchTerms = Object.entries(searchTerms)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    // Estimate average time on page if timestamps available
    let avgTimeOnPageEstimate: number | undefined = undefined;
    
    // Group logs by session
    const sessionMap: Record<string, any[]> = {};
    currentLogs.forEach(log => {
      if (log.sessionId) {
        if (!sessionMap[log.sessionId]) {
          sessionMap[log.sessionId] = [];
        }
        sessionMap[log.sessionId].push(log);
      }
    });
    
    // Calculate time on page for sessions with multiple events
    const sessionDurations: number[] = [];
    
    Object.values(sessionMap).forEach(sessionLogs => {
      // Only analyze sessions with clinic views
      const clinicViews = sessionLogs.filter(log => 
        log.clinicId === clinicId && 
        (log.eventType === 'view' || log.eventType === 'click')
      );
      
      if (clinicViews.length > 0) {
        // Sort logs by timestamp
        const sortedLogs = [...sessionLogs].sort((a, b) => 
          a.timestamp.toMillis() - b.timestamp.toMillis()
        );
        
        // Find when user entered clinic page and when they left
        let entryIndex = -1;
        let exitIndex = -1;
        
        for (let i = 0; i < sortedLogs.length; i++) {
          if (sortedLogs[i].clinicId === clinicId && entryIndex === -1) {
            entryIndex = i;
          } else if (entryIndex !== -1 && sortedLogs[i].clinicId !== clinicId) {
            exitIndex = i;
            break;
          }
        }
        
        // If we found entry and exit points, calculate duration
        if (entryIndex !== -1 && exitIndex !== -1) {
          const duration = sortedLogs[exitIndex].timestamp.toMillis() - 
                           sortedLogs[entryIndex].timestamp.toMillis();
          
          // Only include reasonable durations (less than 30 minutes)
          if (duration > 0 && duration < 30 * 60 * 1000) {
            sessionDurations.push(duration);
          }
        }
      }
    });
    
    // Calculate average if we have enough data
    if (sessionDurations.length > 0) {
      const totalDuration = sessionDurations.reduce((sum, duration) => sum + duration, 0);
      avgTimeOnPageEstimate = Math.round(totalDuration / sessionDurations.length / 1000); // in seconds
    }
    
    return {
      totalViews,
      lastViewed,
      topSearchTerms,
      viewsThisMonth,
      viewsTrend,
      avgTimeOnPageEstimate
    };
  } catch (error) {
    console.error('Error getting clinic engagement metrics:', error);
    return {
      totalViews: 0,
      lastViewed: null,
      topSearchTerms: [],
      viewsThisMonth: 0
    };
  }
}

/**
 * Get comparative engagement metrics for all clinics 
 * 
 * @param db Firestore database instance
 * @param options Options for filtering the metrics
 * @returns Promise resolving to array of clinic engagement summaries
 */
export async function getAllClinicsEngagement(
  db: Firestore,
  options: MetricOptions = {}
): Promise<Array<{
  clinicId: string;
  clinicName: string;
  totalViews: number;
  viewsThisMonth: number;
  lastViewed: Timestamp | null;
}>> {
  try {
    // Default to last 30 days if no date range specified
    const startDate = options.startDate || getDateDaysAgo(30);
    const endDate = options.endDate || Timestamp.now();
    const limit = options.limit || 100; // Default to top 100 clinics
    
    // Query traffic logs
    const trafficLogsRef = db.collection('traffic_logs');
    const logsSnapshot = await trafficLogsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .where('eventType', 'in', ['view', 'click'])
      .get();
      
    const logs = logsSnapshot.docs.map(doc => doc.data());
    
    // Get all clinics data for names
    const clinicsSnapshot = await db.collection('clinics').get();
    const clinicsMap: Record<string, string> = {};
    
    clinicsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      clinicsMap[doc.id] = data.name || 'Unknown Clinic';
    });
    
    // Group logs by clinic
    const clinicViews: Record<string, {
      views: number;
      viewsThisMonth: number;
      lastViewed: Timestamp | null;
    }> = {};
    
    const currentMonthStart = getStartOfMonth();
    
    logs.forEach(log => {
      if (log.clinicId) {
        if (!clinicViews[log.clinicId]) {
          clinicViews[log.clinicId] = {
            views: 0,
            viewsThisMonth: 0,
            lastViewed: null
          };
        }
        
        // Increment total views
        clinicViews[log.clinicId].views++;
        
        // Check if view is from current month
        if (isCurrentMonth(log.timestamp)) {
          clinicViews[log.clinicId].viewsThisMonth++;
        }
        
        // Update last viewed if this is more recent
        if (!clinicViews[log.clinicId].lastViewed || 
            log.timestamp.toMillis() > clinicViews[log.clinicId].lastViewed!.toMillis()) {
          clinicViews[log.clinicId].lastViewed = log.timestamp;
        }
      }
    });
    
    // Format results and sort by total views
    const results = Object.entries(clinicViews)
      .map(([clinicId, data]) => ({
        clinicId,
        clinicName: clinicsMap[clinicId] || 'Unknown Clinic',
        totalViews: data.views,
        viewsThisMonth: data.viewsThisMonth,
        lastViewed: data.lastViewed
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);
      
    return results;
  } catch (error) {
    console.error('Error getting all clinics engagement metrics:', error);
    return [];
  }
}