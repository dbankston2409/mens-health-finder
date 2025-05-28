import { Firestore, CollectionReference, Timestamp } from 'firebase-admin/firestore';
import { getStartOfMonth, getStartOfYear, isCurrentMonth, isCurrentYear } from './dateUtils';
import { SalesMetrics, MetricOptions, PLAN_PRICES } from './types';

/**
 * Get sales and revenue metrics from Firestore
 * 
 * @param db Firestore database instance
 * @param options Options for filtering the metrics
 * @returns Promise resolving to SalesMetrics object
 */
export async function getSalesMetrics(
  db: Firestore,
  options: MetricOptions = {}
): Promise<SalesMetrics> {
  try {
    // Set up default return structure with zeroed metrics
    const metrics: SalesMetrics = {
      totalRevenueThisMonth: 0,
      totalRevenueThisYear: 0,
      newSignupsThisMonth: 0,
      activeSubscriptions: 0,
      churnedSubscriptions: 0,
      averageRevenuePerClinic: 0,
      subscriptionsByPlan: {
        premium: 0,
        basic: 0,
        free: 0
      }
    };

    // Get time boundaries
    const startOfMonth = getStartOfMonth();
    const startOfYear = getStartOfYear();
    
    // Get billing collection reference
    const billingRef = db.collection('billing');
    
    // Query for successful payments this month
    const thisMonthPaymentsQuery = billingRef
      .where('status', '==', 'Paid')
      .where('date', '>=', startOfMonth);
    
    // Query for successful payments this year
    const thisYearPaymentsQuery = billingRef
      .where('status', '==', 'Paid')
      .where('date', '>=', startOfYear);
    
    // Query for new signups this month
    const clinicsRef = db.collection('clinics');
    const newSignupsQuery = clinicsRef
      .where('createdAt', '>=', startOfMonth);
    
    // Query for active subscriptions (status = 'active')
    const activeSubscriptionsQuery = clinicsRef
      .where('status', '==', 'active');
    
    // Query for churned subscriptions this month
    const churnedSubscriptionsQuery = clinicsRef
      .where('status', '==', 'canceled')
      .where('lastUpdated', '>=', startOfMonth);
    
    // Execute all queries in parallel for efficiency
    const [
      thisMonthPaymentsSnapshot,
      thisYearPaymentsSnapshot,
      newSignupsSnapshot,
      activeSubscriptionsSnapshot,
      churnedSubscriptionsSnapshot
    ] = await Promise.all([
      thisMonthPaymentsQuery.get(),
      thisYearPaymentsQuery.get(),
      newSignupsQuery.get(),
      activeSubscriptionsQuery.get(),
      churnedSubscriptionsQuery.get()
    ]);
    
    // Calculate monthly revenue
    thisMonthPaymentsSnapshot.forEach(doc => {
      const data = doc.data();
      metrics.totalRevenueThisMonth += data.amount || 0;
    });
    
    // Calculate yearly revenue
    thisYearPaymentsSnapshot.forEach(doc => {
      const data = doc.data();
      metrics.totalRevenueThisYear += data.amount || 0;
    });
    
    // Count new signups
    metrics.newSignupsThisMonth = newSignupsSnapshot.size;
    
    // Count active subscriptions and breakdown by plan
    activeSubscriptionsSnapshot.forEach(doc => {
      const data = doc.data();
      metrics.activeSubscriptions++;
      
      // Count by plan
      const plan = data.package || 'free';
      if (metrics.subscriptionsByPlan) {
        metrics.subscriptionsByPlan[plan] = (metrics.subscriptionsByPlan[plan] || 0) + 1;
      }
    });
    
    // Count churned subscriptions
    metrics.churnedSubscriptions = churnedSubscriptionsSnapshot.size;
    
    // Calculate average revenue per clinic (for active subscriptions only)
    if (metrics.activeSubscriptions > 0) {
      metrics.averageRevenuePerClinic = metrics.totalRevenueThisMonth / metrics.activeSubscriptions;
    }
    
    // If no billing data exists yet, use plan data to estimate revenue
    if (metrics.totalRevenueThisMonth === 0 && metrics.subscriptionsByPlan) {
      // Calculate estimated revenue based on plan prices
      let estimatedRevenue = 0;
      for (const [plan, count] of Object.entries(metrics.subscriptionsByPlan)) {
        const planPrice = PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0;
        estimatedRevenue += planPrice * count;
      }
      
      metrics.totalRevenueThisMonth = estimatedRevenue;
      metrics.totalRevenueThisYear = estimatedRevenue * (new Date().getMonth() + 1);
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting sales metrics:', error);
    // Return default metrics on error
    return {
      totalRevenueThisMonth: 0,
      totalRevenueThisYear: 0,
      newSignupsThisMonth: 0,
      activeSubscriptions: 0,
      churnedSubscriptions: 0
    };
  }
}

/**
 * Get historical revenue data by month
 * 
 * @param db Firestore database instance
 * @param months Number of months to include
 * @returns Promise resolving to array of monthly revenue data
 */
export async function getRevenueByMonth(
  db: Firestore,
  months: number = 12
): Promise<Array<{ month: string; revenue: number }>> {
  try {
    const result: Array<{ month: string; revenue: number }> = [];
    const billingRef = db.collection('billing');
    
    // Calculate start date (months ago)
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);
    
    // Query for all payments since start date
    const paymentsQuery = await billingRef
      .where('status', '==', 'Paid')
      .where('date', '>=', Timestamp.fromDate(startDate))
      .get();
    
    // Initialize month buckets
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      result.unshift({ month: monthName, revenue: 0 });
    }
    
    // Group payments by month
    paymentsQuery.forEach(doc => {
      const data = doc.data();
      if (data.date) {
        const paymentDate = data.date.toDate();
        const monthDiff = (today.getFullYear() - paymentDate.getFullYear()) * 12 + 
                          (today.getMonth() - paymentDate.getMonth());
        
        if (monthDiff >= 0 && monthDiff < months) {
          result[months - 1 - monthDiff].revenue += data.amount || 0;
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting revenue by month:', error);
    return [];
  }
}