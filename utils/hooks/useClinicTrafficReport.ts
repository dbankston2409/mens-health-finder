import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../apps/web/lib/firebase';

interface ActionData {
  type: 'call' | 'website' | 'directions' | 'profile';
  count: number;
}

interface SearchTerm {
  term: string;
  clicks: number;
  impressions?: number;
  ctr?: number;
}

interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet?: number;
}

interface TrafficReportData {
  totalClicks: number;
  uniqueVisitors: number;
  callClicks: number;
  deviceBreakdown: DeviceBreakdown;
  actions: ActionData[];
  searchTerms: SearchTerm[];
  period: {
    startDate: Date;
    endDate: Date;
  };
}

interface UseClinicTrafficReportResult {
  data: TrafficReportData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClinicTrafficReport(clinicId: string): UseClinicTrafficReportResult {
  const [data, setData] = useState<TrafficReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrafficData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get clinic basic info
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);
      
      if (!clinicSnap.exists()) {
        throw new Error('Clinic not found');
      }

      const clinic = clinicSnap.data();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // Mock data generation based on clinic characteristics
      const hasGoodSeo = clinic.seoMeta?.title && clinic.seoMeta?.content;
      const isPremium = clinic.tier === 'premium' || clinic.tier === 'elite';
      const multiplier = (hasGoodSeo ? 1.5 : 1) * (isPremium ? 2 : 1);

      // Generate realistic traffic data
      const baseClicks = Math.floor((Math.random() * 100 + 20) * multiplier);
      const uniqueVisitors = Math.floor(baseClicks * 0.7); // 70% unique
      const callClicks = Math.floor(baseClicks * 0.15); // 15% call rate
      
      const mobilePercent = 65 + Math.floor(Math.random() * 20); // 65-85% mobile
      
      // Generate action data
      const actions: ActionData[] = [
        { type: 'call', count: callClicks },
        { type: 'website', count: Math.floor(baseClicks * 0.25) },
        { type: 'directions', count: Math.floor(baseClicks * 0.35) },
        { type: 'profile', count: Math.floor(baseClicks * 0.25) }
      ].sort((a, b) => b.count - a.count);

      // Generate search terms based on clinic data
      const baseTerms = [
        `${clinic.services?.[0] || 'testosterone therapy'} ${clinic.city}`,
        `mens health clinic ${clinic.city}`,
        `${clinic.name?.toLowerCase().replace(/[^a-z0-9]/g, ' ')}`,
        `trt clinic ${clinic.state}`,
        'testosterone replacement therapy near me',
        `low t treatment ${clinic.city}`,
        'mens wellness center'
      ];

      const searchTerms: SearchTerm[] = baseTerms
        .slice(0, 5)
        .map((term, index) => {
          const clicks = Math.floor(baseClicks * (0.4 - index * 0.08));
          const impressions = clicks * (8 + Math.floor(Math.random() * 12));
          return {
            term,
            clicks,
            impressions,
            ctr: (clicks / impressions) * 100
          };
        })
        .filter(term => term.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks);

      const trafficData: TrafficReportData = {
        totalClicks: baseClicks,
        uniqueVisitors,
        callClicks,
        deviceBreakdown: {
          mobile: mobilePercent,
          desktop: 100 - mobilePercent
        },
        actions,
        searchTerms,
        period: {
          startDate: thirtyDaysAgo,
          endDate: now
        }
      };

      setData(trafficData);

    } catch (err) {
      console.error('Error fetching traffic report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load traffic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchTrafficData();
    }
  }, [clinicId]);

  return {
    data,
    loading,
    error,
    refresh: fetchTrafficData
  };
}

export function useCallMetrics(clinicId: string) {
  const [callData, setCallData] = useState<{
    hourlyBreakdown: { hour: number; calls: number }[];
    deviceBreakdown: { device: string; count: number; percentage: number }[];
    averageCallDuration?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCallMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock call metrics data
        const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
          let calls = 0;
          // Simulate higher call volume during business hours
          if (hour >= 8 && hour <= 18) {
            calls = Math.floor(Math.random() * 10 + 2);
          } else if (hour >= 19 && hour <= 21) {
            calls = Math.floor(Math.random() * 5 + 1);
          } else {
            calls = Math.floor(Math.random() * 2);
          }
          return { hour, calls };
        });

        const totalCalls = hourlyBreakdown.reduce((sum, h) => sum + h.calls, 0);
        const mobileCalls = Math.floor(totalCalls * 0.8);
        const desktopCalls = totalCalls - mobileCalls;

        const deviceBreakdown = [
          { device: 'Mobile', count: mobileCalls, percentage: (mobileCalls / totalCalls) * 100 },
          { device: 'Desktop', count: desktopCalls, percentage: (desktopCalls / totalCalls) * 100 }
        ];

        setCallData({
          hourlyBreakdown,
          deviceBreakdown,
          averageCallDuration: 180 + Math.floor(Math.random() * 120) // 3-5 minutes
        });

      } catch (err) {
        console.error('Error fetching call metrics:', err);
        setError('Failed to load call metrics');
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchCallMetrics();
    }
  }, [clinicId]);

  return { callData, loading, error };
}