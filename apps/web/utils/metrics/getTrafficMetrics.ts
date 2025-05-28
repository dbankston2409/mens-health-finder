import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { TrafficMetrics, MetricOptions } from './types';
import { getDateDaysAgo, getStartOfMonth } from './dateUtils';

/**
 * Get traffic metrics from Firestore traffic_logs
 * 
 * @param db Firestore database instance
 * @param options Options for filtering the metrics
 * @returns Promise resolving to TrafficMetrics object
 */
export async function getTrafficMetrics(
  db: Firestore,
  options: MetricOptions = {}
): Promise<TrafficMetrics> {
  try {
    // Default to last 30 days if no date range specified
    const startDate = options.startDate || getDateDaysAgo(30);
    const endDate = options.endDate || Timestamp.now();
    const clinicId = options.clinicId;
    const limit = options.limit || 10; // Default top 10 results for each category
    
    // Base query for traffic logs within the date range
    const trafficLogsRef = db.collection('traffic_logs');
    let baseQuery = trafficLogsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
      
    // Add clinic filter if specified
    if (clinicId) {
      baseQuery = baseQuery.where('clinicId', '==', clinicId);
    }
    
    // Execute query
    const trafficLogsSnapshot = await baseQuery.get();
    
    // Process logs for various metrics
    const logs = trafficLogsSnapshot.docs.map(doc => doc.data());
    
    // Count total clicks this month
    const currentMonthStart = getStartOfMonth();
    const totalClicksThisMonth = logs.filter(
      log => log.timestamp >= currentMonthStart && log.eventType === 'click'
    ).length;
    
    // Aggregate page views by page slug
    const pageViews: Record<string, number> = {};
    logs.forEach(log => {
      if (log.resultingPage) {
        pageViews[log.resultingPage] = (pageViews[log.resultingPage] || 0) + 1;
      }
    });
    
    // Sort pages by click count and get top results
    const topPages = Object.entries(pageViews)
      .map(([slug, clickCount]) => ({ slug, clickCount }))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, limit);
    
    // Aggregate search queries
    const searchQueries: Record<string, number> = {};
    logs.forEach(log => {
      if (log.searchQuery && log.searchQuery.trim()) {
        const normalizedQuery = log.searchQuery.toLowerCase().trim();
        searchQueries[normalizedQuery] = (searchQueries[normalizedQuery] || 0) + 1;
      }
    });
    
    // Sort search queries by count and get top results
    const topSearchQueries = Object.entries(searchQueries)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    // Calculate bounce rate if possible (sessions with only 1 click / total sessions)
    // This requires sessionId to be tracked in logs
    const sessions: Record<string, number> = {};
    logs.forEach(log => {
      if (log.sessionId) {
        sessions[log.sessionId] = (sessions[log.sessionId] || 0) + 1;
      }
    });
    
    const totalSessions = Object.keys(sessions).length;
    const bouncedSessions = Object.values(sessions).filter(clicks => clicks === 1).length;
    const bounceRateEstimate = totalSessions > 0 
      ? (bouncedSessions / totalSessions) * 100 
      : undefined;
    
    // Calculate average clicks per day
    const msInDay = 24 * 60 * 60 * 1000;
    const startDateMs = startDate instanceof Timestamp 
      ? startDate.toMillis() 
      : startDate.getTime();
    const endDateMs = endDate instanceof Timestamp 
      ? endDate.toMillis() 
      : endDate.getTime();
    const daysCovered = Math.ceil((endDateMs - startDateMs) / msInDay);
    
    const avgClicksPerDay = daysCovered > 0 
      ? logs.filter(log => log.eventType === 'click').length / daysCovered 
      : undefined;
    
    return {
      totalClicksThisMonth,
      topPages,
      topSearchQueries,
      bounceRateEstimate,
      avgClicksPerDay
    };
  } catch (error) {
    console.error('Error getting traffic metrics:', error);
    // Return default metrics with zeros in case of error
    return {
      totalClicksThisMonth: 0,
      topPages: [],
      topSearchQueries: [],
    };
  }
}

/**
 * Get detailed traffic breakdown by category
 * 
 * @param db Firestore database instance
 * @param category Category to analyze ('city', 'device', 'referrer')
 * @param options Options for filtering the metrics
 * @returns Promise resolving to array of category breakdown
 */
export async function getTrafficBreakdown(
  db: Firestore,
  category: 'city' | 'device' | 'referrer',
  options: MetricOptions = {}
): Promise<Array<{ name: string; count: number }>> {
  try {
    // Default to last 30 days if no date range specified
    const startDate = options.startDate || getDateDaysAgo(30);
    const endDate = options.endDate || Timestamp.now();
    const limit = options.limit || 10;
    
    // Query traffic logs
    const trafficLogsRef = db.collection('traffic_logs');
    const query = trafficLogsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    const snapshot = await query.get();
    
    // Aggregate by the specified category
    const categoryCounts: Record<string, number> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const value = data[category];
      
      if (value && typeof value === 'string') {
        categoryCounts[value] = (categoryCounts[value] || 0) + 1;
      }
    });
    
    // Sort and limit results
    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
      
  } catch (error) {
    console.error(`Error getting traffic breakdown by ${category}:`, error);
    return [];
  }
}