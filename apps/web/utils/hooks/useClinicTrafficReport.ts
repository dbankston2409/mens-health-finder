import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTraffic, TrafficEvent } from './useTraffic';

// Types for our report
export type SearchQueryData = {
  term: string;
  clicks: number;
  firstSeen: Date;
  lastSeen: Date;
};

export type PageData = {
  page: string;
  clicks: number;
  type: 'internal' | 'referral' | 'search';
};

export type DeviceBreakdown = {
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
};

export type HeatmapPoint = {
  x: number;
  y: number;
  intensity: number;
  element: string;
};

export type KeywordRanking = 'high' | 'medium' | 'low';

export type KeywordInsight = {
  primary: string[];
  geo: string[];
  services: string[];
  rankingStrength: KeywordRanking;
  opportunity: string;
  suggestedMetaDescription?: string;
  missingSuggestions?: string[];
};

export type PerformanceSummary = {
  totalClicks30Days: number;
  uniqueSearchTerms: number;
  avgClicksPerDay: number;
  mostCommonDevice: string;
  mostCommonDevicePercentage: number;
  mostCommonRegion: string;
  topActionClicked: string;
};

export type TrafficReportData = {
  searchQueries: SearchQueryData[];
  topPages: PageData[];
  deviceBreakdown: DeviceBreakdown;
  heatmapData: HeatmapPoint[];
  keywordInsights: KeywordInsight;
  performanceSummary: PerformanceSummary;
  trafficOverTime: {
    date: string;
    views: number;
    clicks: number;
  }[];
};

// Helper to extract the click element from logs
const identifyClickElement = (event: TrafficEvent): string => {
  // In a real implementation, this would use the event data to determine what was clicked
  // For the mock, we'll return common elements
  const elements = [
    'phone-button',
    'website-link',
    'directions-button',
    'services-section',
    'reviews-section',
    'hours-section',
    'contact-form',
    'gallery-image'
  ];
  
  // Use a deterministic method to assign elements based on session ID hash
  const hashCode = (event.sessionId || '').split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return elements[Math.abs(hashCode) % elements.length];
};

// Helper to convert click elements to heatmap coordinates
const elementToCoordinates = (element: string): { x: number, y: number } => {
  // Map common click elements to x,y coordinates (0-100)
  const elementMap: Record<string, { x: number, y: number }> = {
    'phone-button': { x: 85, y: 25 },
    'website-link': { x: 70, y: 30 },
    'directions-button': { x: 80, y: 35 },
    'services-section': { x: 50, y: 50 },
    'reviews-section': { x: 50, y: 70 },
    'hours-section': { x: 30, y: 65 },
    'contact-form': { x: 50, y: 85 },
    'gallery-image': { x: 25, y: 40 }
  };
  
  // Add some randomness for realism
  const base = elementMap[element] || { x: 50, y: 50 };
  return {
    x: base.x + (Math.random() * 10 - 5),
    y: base.y + (Math.random() * 10 - 5)
  };
};

// Helper to analyze keywords from search queries
const analyzeKeywords = (searchQueries: SearchQueryData[], clinicName: string, city: string, state: string): KeywordInsight => {
  // Extract words from search queries
  const words = searchQueries.flatMap(q => 
    q.term.toLowerCase().split(' ').filter(w => w.length > 2)
  );
  
  // Count word frequencies
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Common men's health services
  const serviceTerms = ['trt', 'testosterone', 'ed', 'hrt', 'peptide', 'weight', 'loss', 'hormones', 'therapy'];
  
  // Extract primary keywords (high frequency non-geo terms)
  const primary = Object.entries(wordCounts)
    .filter(([word, count]) => 
      count > 2 && 
      !word.includes(city.toLowerCase()) && 
      !word.includes(state.toLowerCase()) &&
      word !== 'near' && 
      word !== 'clinic' && 
      word !== 'doctor'
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Extract geo keywords
  const geo = Object.entries(wordCounts)
    .filter(([word]) => 
      word.includes(city.toLowerCase()) || 
      word.includes(state.toLowerCase()) ||
      word === 'near' ||
      word.includes('local')
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
  
  // Extract service keywords
  const services = Object.entries(wordCounts)
    .filter(([word]) => serviceTerms.includes(word))
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  
  // Identify missing service terms
  const missingSuggestions = serviceTerms
    .filter(term => !services.includes(term))
    .slice(0, 3);
  
  // Determine ranking strength
  let rankingStrength: KeywordRanking = 'low';
  if (primary.length >= 3 && geo.length >= 2) {
    rankingStrength = 'high';
  } else if (primary.length >= 2 || geo.length >= 1) {
    rankingStrength = 'medium';
  }
  
  // Determine opportunity
  let opportunity = 'Add more service keywords to improve visibility';
  if (searchQueries.length > 10 && rankingStrength !== 'high') {
    opportunity = 'High Impressions, Low Search Position';
  } else if (searchQueries.length < 5) {
    opportunity = 'Low Search Visibility, Optimize Content';
  } else if (rankingStrength === 'medium' && primary.length < 3) {
    opportunity = 'Good Search Position but Low Engagement';
  }
  
  // Generate meta description suggestion
  const suggestedMetaDescription = `${clinicName} offers ${
    services.length > 0 
      ? services.slice(0, 3).join(', ') 
      : 'men\'s health services'
  } in ${city}, ${state}. Contact us today for ${
    primary.length > 0 
      ? primary.slice(0, 2).join(' and ') 
      : 'expert men\'s healthcare'
  }.`;
  
  return {
    primary,
    geo,
    services,
    rankingStrength,
    opportunity,
    suggestedMetaDescription,
    missingSuggestions
  };
};

export const useClinicTrafficReport = (clinicId: string | undefined) => {
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use the existing traffic hook to get basic metrics
  const { trafficData, loading: trafficLoading, error: trafficError } = useTraffic(clinicId);
  
  // Load clinic details
  useEffect(() => {
    const fetchClinic = async () => {
      if (!clinicId) return;
      
      try {
        const clinicDoc = await getDocs(query(collection(db, 'clinics'), where('id', '==', clinicId)));
        if (!clinicDoc.empty) {
          setClinic(clinicDoc.docs[0].data());
        }
      } catch (err) {
        console.error('Error fetching clinic:', err);
        setError(err as Error);
      }
    };
    
    fetchClinic();
  }, [clinicId]);
  
  // Process data for the report
  const reportData = useMemo((): TrafficReportData | null => {
    if (trafficLoading || !trafficData || !clinic) return null;
    
    try {
      // Process search queries
      const searchQueries: Record<string, SearchQueryData> = {};
      trafficData.events.forEach(event => {
        if (event.searchQuery && event.eventType === 'search') {
          const term = event.searchQuery.toLowerCase().trim();
          if (!searchQueries[term]) {
            searchQueries[term] = {
              term,
              clicks: 0,
              firstSeen: event.timestamp,
              lastSeen: event.timestamp
            };
          }
          
          searchQueries[term].clicks++;
          
          if (event.timestamp < searchQueries[term].firstSeen) {
            searchQueries[term].firstSeen = event.timestamp;
          }
          
          if (event.timestamp > searchQueries[term].lastSeen) {
            searchQueries[term].lastSeen = event.timestamp;
          }
        }
      });
      
      const searchQueriesArray = Object.values(searchQueries)
        .sort((a, b) => b.clicks - a.clicks);
      
      // Process top pages
      const pages: Record<string, PageData> = {};
      trafficData.events.forEach(event => {
        if (event.eventType === 'click' && event.referrer) {
          const page = event.referrer;
          let type: 'internal' | 'referral' | 'search' = 'referral';
          
          if (page.includes('search')) {
            type = 'search';
          } else if (page.includes(clinic.slug) || page.includes('/trt') || page.includes('/ed')) {
            type = 'internal';
          }
          
          if (!pages[page]) {
            pages[page] = {
              page,
              clicks: 0,
              type
            };
          }
          
          pages[page].clicks++;
        }
      });
      
      const topPages = Object.values(pages)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
      
      // Process device breakdown
      const devices: Record<string, number> = {
        mobile: 0,
        desktop: 0,
        tablet: 0,
        other: 0
      };
      
      trafficData.events.forEach(event => {
        if (event.deviceType) {
          const deviceType = event.deviceType.toLowerCase();
          if (deviceType.includes('mobile') || deviceType.includes('phone')) {
            devices.mobile++;
          } else if (deviceType.includes('desktop')) {
            devices.desktop++;
          } else if (deviceType.includes('tablet') || deviceType.includes('ipad')) {
            devices.tablet++;
          } else {
            devices.other++;
          }
        }
      });
      
      const totalDevices = Object.values(devices).reduce((sum, count) => sum + count, 0);
      
      // Process heatmap data
      const clickElements: Record<string, number> = {};
      trafficData.events
        .filter(event => event.eventType === 'click')
        .forEach(event => {
          const element = identifyClickElement(event);
          clickElements[element] = (clickElements[element] || 0) + 1;
        });
      
      // Generate heatmap points
      const heatmapPoints: HeatmapPoint[] = [];
      Object.entries(clickElements).forEach(([element, count]) => {
        const maxClicks = Math.max(...Object.values(clickElements));
        const normalizedIntensity = count / maxClicks;
        
        // Create multiple points for each element with high click counts
        const numPoints = Math.max(1, Math.floor(count / 2));
        for (let i = 0; i < numPoints; i++) {
          const coords = elementToCoordinates(element);
          heatmapPoints.push({
            x: coords.x,
            y: coords.y,
            intensity: normalizedIntensity,
            element
          });
        }
      });
      
      // Get most common device
      const deviceEntries = Object.entries(devices);
      const mostCommonDeviceEntry = deviceEntries.reduce((max, entry) => 
        entry[1] > max[1] ? entry : max, ['other', 0]);
      
      const mostCommonDevice = mostCommonDeviceEntry[0];
      const mostCommonDevicePercentage = totalDevices > 0 
        ? Math.round((mostCommonDeviceEntry[1] / totalDevices) * 100) 
        : 0;
      
      // Get most clicked element
      const elementEntries = Object.entries(clickElements);
      const topActionClicked = elementEntries.length > 0 
        ? elementEntries.reduce((max, entry) => entry[1] > max[1] ? entry : max, ['none', 0])[0]
            .replace(/-/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
        : 'None';
      
      // Find most common region
      const mostCommonRegion = trafficData.topCities.length > 0 
        ? `${trafficData.topCities[0].city}, ${trafficData.topCities[0].state}` 
        : 'Unknown';
      
      // Process keyword insights
      const keywordInsights = analyzeKeywords(
        searchQueriesArray, 
        clinic.name, 
        clinic.city, 
        clinic.state
      );
      
      // Build performance summary
      const performanceSummary: PerformanceSummary = {
        totalClicks30Days: trafficData.clicksLast30Days,
        uniqueSearchTerms: searchQueriesArray.length,
        avgClicksPerDay: trafficData.clicksLast30Days / 30,
        mostCommonDevice,
        mostCommonDevicePercentage,
        mostCommonRegion,
        topActionClicked
      };
      
      return {
        searchQueries: searchQueriesArray,
        topPages,
        deviceBreakdown: devices as DeviceBreakdown,
        heatmapData: heatmapPoints,
        keywordInsights,
        performanceSummary,
        trafficOverTime: trafficData.dailyTraffic
      };
    } catch (err) {
      console.error('Error processing traffic report data:', err);
      setError(err as Error);
      return null;
    }
  }, [trafficData, trafficLoading, clinic]);
  
  // Update loading state based on all data sources
  useEffect(() => {
    setLoading(trafficLoading || !clinic);
  }, [trafficLoading, clinic]);
  
  // Combine errors
  useEffect(() => {
    if (trafficError) setError(trafficError);
  }, [trafficError]);
  
  return {
    clinic,
    reportData,
    loading,
    error
  };
};

export default useClinicTrafficReport;