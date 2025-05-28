import { LostRevenueMetrics, MetricOptions } from './types';

/**
 * Client-side stub for getLostRevenue
 * This is a stub implementation that returns mock data for client-side rendering
 * In a real implementation, this would be an API call to the server
 * 
 * @param _db Unused database parameter (for API compatibility)
 * @param _options Options for filtering the metrics (unused in stub)
 * @returns Mock lost revenue metrics
 */
export async function getLostRevenue(
  _db: any,
  _options: MetricOptions = {}
): Promise<LostRevenueMetrics> {
  // Return mock data for client-side rendering
  return {
    lostThisMonth: 799.96,
    lostThisYear: 7599.42,
    breakdownByReason: {
      canceled: 3199.84,
      downgrade: 1800.00,
      failedPayment: 1999.90,
      missedUpsell: 599.97,
      expiredTrial: 0
    },
    rawEvents: [
      {
        clinicId: '1234',
        clinicName: 'Prime Men\'s Health Clinic',
        amount: 199.99,
        reason: 'canceled',
        date: new Date() // Client-side date object instead of Firestore Timestamp
      },
      {
        clinicId: '5678',
        clinicName: 'Elite Men\'s Clinic',
        amount: 150.00,
        reason: 'downgrade',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    ]
  };
}