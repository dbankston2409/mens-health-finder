import { ClinicEngagementMetrics, MetricOptions } from './types';

/**
 * Client-side stub for getClinicEngagement
 * This is a stub implementation that returns mock data for client-side rendering
 * In a real implementation, this would be an API call to the server
 * 
 * @param _db Unused database parameter (for API compatibility)
 * @param clinicId ID of the clinic to get metrics for
 * @param _options Options for filtering the metrics (unused in stub)
 * @returns Mock engagement metrics
 */
export async function getClinicEngagement(
  _db: any,
  clinicId: string,
  _options: MetricOptions = {}
): Promise<ClinicEngagementMetrics> {
  // Safety check for required clinicId
  if (!clinicId) {
    throw new Error('Clinic ID is required');
  }

  // Return mock data for client-side rendering
  return {
    totalViews: Math.floor(Math.random() * 500) + 100,
    viewsThisMonth: Math.floor(Math.random() * 100) + 20,
    viewsTrend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
    lastViewed: null,
    topSearchTerms: [
      { term: 'testosterone therapy', count: 12 },
      { term: 'mens health', count: 8 },
      { term: 'ed treatment', count: 5 },
      { term: 'low testosterone', count: 4 },
      { term: 'hormone therapy', count: 3 }
    ],
    avgTimeOnPageEstimate: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
  };
}