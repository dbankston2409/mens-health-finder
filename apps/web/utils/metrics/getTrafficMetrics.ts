import { TrafficMetrics, MetricOptions } from './types';

/**
 * Client-side stub for getTrafficMetrics
 * This is a stub implementation that returns mock data for client-side rendering
 * In a real implementation, this would be an API call to the server
 * 
 * @param _db Unused database parameter (for API compatibility)
 * @param options Options for filtering the metrics (clinicId is used for variation)
 * @returns Mock traffic metrics
 */
export async function getTrafficMetrics(
  _db: any,
  options: MetricOptions = {}
): Promise<TrafficMetrics> {
  // Use clinicId to vary data slightly if provided
  const variationFactor = options.clinicId ? 
    (parseInt(options.clinicId.substring(0, 1), 16) / 16) + 0.5 : 1;
  
  // Return mock data for client-side rendering
  return {
    totalClicksThisMonth: Math.floor(300 * variationFactor),
    topPages: [
      { slug: '/ed-treatment', clickCount: Math.floor(120 * variationFactor) },
      { slug: '/testosterone-therapy', clickCount: Math.floor(85 * variationFactor) },
      { slug: '/hormone-optimization', clickCount: Math.floor(65 * variationFactor) },
      { slug: '/about', clickCount: Math.floor(45 * variationFactor) },
      { slug: '/contact', clickCount: Math.floor(30 * variationFactor) }
    ],
    topSearchQueries: [
      { term: 'testosterone therapy near me', count: Math.floor(42 * variationFactor) },
      { term: 'ed clinic', count: Math.floor(36 * variationFactor) },
      { term: 'hormone therapy for men', count: Math.floor(28 * variationFactor) },
      { term: 'low t treatment', count: Math.floor(22 * variationFactor) },
      { term: 'mens health clinic', count: Math.floor(18 * variationFactor) }
    ],
    bounceRateEstimate: 35 + Math.floor(Math.random() * 15),
    avgClicksPerDay: 12.5 * variationFactor,
    dailyTraffic: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      views: Math.floor((15 + Math.random() * 20) * variationFactor),
      clicks: Math.floor((5 + Math.random() * 10) * variationFactor)
    }))
  };
}