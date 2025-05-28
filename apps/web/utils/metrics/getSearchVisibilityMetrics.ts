import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { SearchVisibilityMetrics, MetricOptions } from './types';
import { getDateDaysAgo } from './dateUtils';

/**
 * Get search visibility metrics from traffic_logs
 * 
 * @param db Firestore database instance
 * @param options Options for filtering the metrics
 * @returns Promise resolving to SearchVisibilityMetrics object
 */
export async function getSearchVisibilityMetrics(
  db: Firestore, 
  options: MetricOptions = {}
): Promise<SearchVisibilityMetrics> {
  try {
    // Default to last 30 days if no date range specified
    const startDate = options.startDate || getDateDaysAgo(30);
    const endDate = options.endDate || Timestamp.now();
    const limit = options.limit || 10;
    
    // Base query for traffic logs within the date range
    const trafficLogsRef = db.collection('traffic_logs');
    let baseQuery = trafficLogsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .where('eventType', '==', 'search'); // Only search events
      
    // Execute query
    const searchLogsSnapshot = await baseQuery.get();
    const searchLogs = searchLogsSnapshot.docs.map(doc => doc.data());
    
    // For impressions, we need a secondary query to get the subsequent clicks
    const clicksQuery = trafficLogsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .where('eventType', '==', 'click')
      .where('fromSearch', '==', true); // Clicks that came from search results
      
    const clickLogsSnapshot = await clicksQuery.get();
    const clickLogs = clickLogsSnapshot.docs.map(doc => doc.data());
    
    // Calculate total search impressions
    const totalSearchImpressions = searchLogs.length;
    
    // Count clicks that originated from search
    const searchResultClicks = clickLogs.length;
    
    // Calculate average clicks per search
    const averageClicksPerSearch = totalSearchImpressions > 0 
      ? searchResultClicks / totalSearchImpressions 
      : 0;
    
    // Aggregate search terms
    const searchTerms: Record<string, number> = {};
    searchLogs.forEach(log => {
      if (log.searchQuery && log.searchQuery.trim()) {
        const normalizedQuery = log.searchQuery.toLowerCase().trim();
        searchTerms[normalizedQuery] = (searchTerms[normalizedQuery] || 0) + 1;
      }
    });
    
    // Sort search terms by count and get top results
    const topSearchTerms = Object.entries(searchTerms)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    // Aggregate cities searched
    const citiesSearched: Record<string, number> = {};
    searchLogs.forEach(log => {
      if (log.city) {
        // Normalize city names
        const normalizedCity = log.city.toLowerCase().trim();
        citiesSearched[normalizedCity] = (citiesSearched[normalizedCity] || 0) + 1;
      }
    });
    
    // Sort cities by count and get top results
    const topCitiesSearched = Object.entries(citiesSearched)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    // Optional: Aggregate services (if tracked in logs)
    const services: Record<string, number> = {};
    searchLogs.forEach(log => {
      if (log.service) {
        const normalizedService = log.service.toLowerCase().trim();
        services[normalizedService] = (services[normalizedService] || 0) + 1;
      }
    });
    
    // Sort services by count and get top results
    const topServices = Object.entries(services)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return {
      totalSearchImpressions,
      topSearchTerms,
      topCitiesSearched,
      averageClicksPerSearch,
      topServices: topServices.length > 0 ? topServices : undefined
    };
  } catch (error) {
    console.error('Error getting search visibility metrics:', error);
    // Return default metrics with zeros in case of error
    return {
      totalSearchImpressions: 0,
      topSearchTerms: [],
      topCitiesSearched: [],
      averageClicksPerSearch: 0
    };
  }
}

/**
 * Get search conversion metrics - how searches lead to actions
 * 
 * @param db Firestore database instance
 * @param options Options for filtering the metrics
 * @returns Promise with search conversion data
 */
export async function getSearchConversionMetrics(
  db: Firestore,
  options: MetricOptions = {}
): Promise<{
  searchesToClicks: number;
  clicksToProfileViews: number;
  termConversionRates: Array<{ term: string; conversionRate: number }>;
}> {
  try {
    // Default to last 30 days if no date range specified  
    const startDate = options.startDate || getDateDaysAgo(30);
    const endDate = options.endDate || Timestamp.now();
    const limit = options.limit || 10;
    
    // Get traffic logs with session IDs to track user journeys
    const trafficLogsRef = db.collection('traffic_logs');
    const logsSnapshot = await trafficLogsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();
      
    const logs = logsSnapshot.docs.map(doc => doc.data());
    
    // Group logs by session
    const sessionMap: Record<string, any[]> = {};
    logs.forEach(log => {
      if (log.sessionId) {
        if (!sessionMap[log.sessionId]) {
          sessionMap[log.sessionId] = [];
        }
        sessionMap[log.sessionId].push(log);
      }
    });
    
    // Count sessions with searches
    let sessionsWithSearch = 0;
    let sessionsWithSearchAndClick = 0;
    let sessionsWithProfileView = 0;
    
    // Track search term conversions
    const searchTermConversions: Record<string, { searches: number; clicks: number }> = {};
    
    // Analyze each session
    Object.values(sessionMap).forEach(sessionLogs => {
      // Sort logs by timestamp
      sessionLogs.sort((a, b) => {
        return a.timestamp.toMillis() - b.timestamp.toMillis();
      });
      
      const hasSearch = sessionLogs.some(log => log.eventType === 'search');
      const hasClick = sessionLogs.some(log => log.eventType === 'click' && log.fromSearch === true);
      const hasProfileView = sessionLogs.some(log => 
        log.eventType === 'view' && log.resultingPage && log.resultingPage.includes('/clinic/')
      );
      
      if (hasSearch) {
        sessionsWithSearch++;
        
        // Track which search terms led to clicks
        sessionLogs.forEach(log => {
          if (log.eventType === 'search' && log.searchQuery) {
            const term = log.searchQuery.toLowerCase().trim();
            
            if (!searchTermConversions[term]) {
              searchTermConversions[term] = { searches: 0, clicks: 0 };
            }
            
            searchTermConversions[term].searches++;
            
            // If this session also had a click from search, increment the clicks for this term
            if (hasClick) {
              searchTermConversions[term].clicks++;
            }
          }
        });
      }
      
      if (hasSearch && hasClick) {
        sessionsWithSearchAndClick++;
      }
      
      if (hasClick && hasProfileView) {
        sessionsWithProfileView++;
      }
    });
    
    // Calculate conversion rates
    const searchesToClicks = sessionsWithSearch > 0 
      ? (sessionsWithSearchAndClick / sessionsWithSearch) * 100 
      : 0;
      
    const clicksToProfileViews = sessionsWithSearchAndClick > 0 
      ? (sessionsWithProfileView / sessionsWithSearchAndClick) * 100 
      : 0;
    
    // Calculate term conversion rates
    const termConversionRates = Object.entries(searchTermConversions)
      .map(([term, data]) => ({
        term,
        conversionRate: data.searches > 0 ? (data.clicks / data.searches) * 100 : 0
      }))
      .filter(item => item.conversionRate > 0) // Only include terms with conversions
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);
    
    return {
      searchesToClicks,
      clicksToProfileViews,
      termConversionRates
    };
  } catch (error) {
    console.error('Error getting search conversion metrics:', error);
    return {
      searchesToClicks: 0,
      clicksToProfileViews: 0,
      termConversionRates: []
    };
  }
}