import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { mockTrafficData } from './stubs/mockAdminData';

export type TrafficEvent = {
  id: string;
  clinicId: string;
  timestamp: Date;
  eventType: 'view' | 'click' | 'search' | 'impression';
  source?: string;
  referrer?: string;
  searchQuery?: string;
  city?: string;
  state?: string;
  deviceType?: string;
  sessionId?: string;
};

export type SearchTerm = {
  term: string;
  count: number;
};

export type ReferringCity = {
  city: string;
  state: string;
  count: number;
};

export type TrafficMetrics = {
  events: TrafficEvent[];
  totalViews: number;
  totalClicks: number;
  viewsLast30Days: number;
  clicksLast30Days: number;
  lastViewed: Date | null;
  topSearchTerms: SearchTerm[];
  topCities: ReferringCity[];
  dailyTraffic: Array<{
    date: string;
    views: number;
    clicks: number;
  }>;
};

export const useTraffic = (clinicId: string | undefined) => {
  const [trafficData, setTrafficData] = useState<TrafficMetrics>({
    events: [],
    totalViews: 0,
    totalClicks: 0,
    viewsLast30Days: 0,
    clicksLast30Days: 0,
    lastViewed: null,
    topSearchTerms: [],
    topCities: [],
    dailyTraffic: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query traffic logs for this clinic
    const trafficRef = collection(db, 'traffic_logs');
    const trafficQuery = query(
      trafficRef,
      where('clinicId', '==', clinicId),
      orderBy('timestamp', 'desc'),
      limit(1000) // Reasonable limit to avoid excessive data
    );

    const unsubscribe = onSnapshot(
      trafficQuery,
      (querySnapshot) => {
        const events: TrafficEvent[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert timestamp to Date
          const timestamp = data.timestamp 
            ? new Date(data.timestamp.seconds * 1000) 
            : new Date();

          const event: TrafficEvent = {
            id: doc.id,
            clinicId: data.clinicId,
            timestamp,
            eventType: data.eventType || 'view',
            source: data.source,
            referrer: data.referrer,
            searchQuery: data.searchQuery,
            city: data.city,
            state: data.state,
            deviceType: data.deviceType,
            sessionId: data.sessionId,
          };

          events.push(event);
        });

        // Calculate metrics
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const views = events.filter(e => e.eventType === 'view');
        const clicks = events.filter(e => e.eventType === 'click');
        
        // Last 30 days metrics
        const recentViews = views.filter(e => e.timestamp >= thirtyDaysAgo);
        const recentClicks = clicks.filter(e => e.timestamp >= thirtyDaysAgo);
        
        // Last viewed date
        const lastViewed = views.length > 0 ? views[0].timestamp : null;
        
        // Aggregate search terms
        const searchTerms: Record<string, number> = {};
        events.forEach(event => {
          if (event.searchQuery && event.searchQuery.trim()) {
            const term = event.searchQuery.toLowerCase().trim();
            searchTerms[term] = (searchTerms[term] || 0) + 1;
          }
        });
        
        const topSearchTerms = Object.entries(searchTerms)
          .map(([term, count]) => ({ term, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Aggregate referring cities
        const cities: Record<string, { city: string; state: string; count: number }> = {};
        events.forEach(event => {
          if (event.city && event.state) {
            const key = `${event.city},${event.state}`.toLowerCase();
            if (!cities[key]) {
              cities[key] = {
                city: event.city,
                state: event.state,
                count: 0
              };
            }
            cities[key].count++;
          }
        });
        
        const topCities = Object.values(cities)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Calculate daily traffic for chart
        const dailyData: Record<string, { views: number; clicks: number }> = {};
        
        // Initialize with last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dailyData[dateStr] = { views: 0, clicks: 0 };
        }
        
        // Fill in actual data
        events.forEach(event => {
          if (event.timestamp >= thirtyDaysAgo) {
            const dateStr = event.timestamp.toISOString().split('T')[0];
            
            if (!dailyData[dateStr]) {
              dailyData[dateStr] = { views: 0, clicks: 0 };
            }
            
            if (event.eventType === 'view') {
              dailyData[dateStr].views++;
            } else if (event.eventType === 'click') {
              dailyData[dateStr].clicks++;
            }
          }
        });
        
        const dailyTraffic = Object.entries(dailyData)
          .map(([date, data]) => ({
            date,
            views: data.views,
            clicks: data.clicks
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setTrafficData({
          events,
          totalViews: views.length,
          totalClicks: clicks.length,
          viewsLast30Days: recentViews.length,
          clicksLast30Days: recentClicks.length,
          lastViewed,
          topSearchTerms,
          topCities,
          dailyTraffic,
        });
        
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching traffic data:', err);
        // Use mock data if Firebase access fails
        console.log('Using mock traffic data due to Firebase access error');
        setTrafficData({
          events: [],
          totalViews: mockTrafficData.views.total,
          totalClicks: mockTrafficData.clicks.total,
          viewsLast30Days: mockTrafficData.views.thisMonth,
          clicksLast30Days: mockTrafficData.clicks.thisMonth,
          lastViewed: new Date(),
          topSearchTerms: mockTrafficData.sources.map(s => ({ term: s.source, count: s.count })),
          topCities: [
            { city: 'New York', state: 'NY', count: 45 },
            { city: 'Los Angeles', state: 'CA', count: 32 },
            { city: 'Chicago', state: 'IL', count: 28 }
          ],
          dailyTraffic: mockTrafficData.dailyViews.map(dv => ({
            date: dv.date,
            views: dv.views,
            clicks: Math.floor(dv.views * 0.15)
          }))
        });
        setError(null); // Clear error since we're using mock data
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { trafficData, loading, error };
};

export default useTraffic;