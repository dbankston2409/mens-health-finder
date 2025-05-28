import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { getStartOfMonth, getStartOfYear, isCurrentMonth, isCurrentYear } from './dateUtils';
import { LostRevenueMetrics, LostRevenueEvent, MetricOptions, LOST_REVENUE_ESTIMATES } from './types';

/**
 * Get lost revenue metrics from Firestore
 * 
 * @param db Firestore database instance
 * @param options Options for filtering the metrics
 * @returns Promise resolving to LostRevenueMetrics object
 */
export async function getLostRevenue(
  db: Firestore,
  options: MetricOptions = {}
): Promise<LostRevenueMetrics> {
  try {
    // Set up default return structure
    const metrics: LostRevenueMetrics = {
      lostThisMonth: 0,
      lostThisYear: 0,
      breakdownByReason: {
        canceled: 0,
        downgrade: 0,
        failedPayment: 0,
        missedUpsell: 0,
        expiredTrial: 0
      },
      rawEvents: []
    };

    // Get time boundaries
    const startOfMonth = getStartOfMonth();
    const startOfYear = getStartOfYear();
    
    // Query for canceled subscriptions
    const clinicsRef = db.collection('clinics');
    const canceledQuery = clinicsRef
      .where('status', '==', 'canceled')
      .where('lastUpdated', '>=', startOfYear);
    
    // Query for failed payments
    const billingRef = db.collection('billing');
    const failedPaymentsQuery = billingRef
      .where('status', '==', 'Failed')
      .where('date', '>=', startOfYear);
    
    // Query for admin logs with plan changes
    const adminLogsRef = db.collection('admin_logs');
    const planChangesQuery = adminLogsRef
      .where('actionType', '==', 'updatePlan')
      .where('timestamp', '>=', startOfYear);
    
    // Query for expired trials
    const trialExpiredQuery = clinicsRef
      .where('status', '==', 'basic')
      .where('createdAt', '>=', Timestamp.fromDate(new Date(
        new Date().setDate(new Date().getDate() - 30) // Look for trials created 14-30 days ago
      )))
      .where('createdAt', '<=', Timestamp.fromDate(new Date(
        new Date().setDate(new Date().getDate() - 14) // Trials typically last 14 days
      )));
    
    // Execute all queries in parallel for efficiency
    const [
      canceledSnapshot,
      failedPaymentsSnapshot,
      planChangesSnapshot,
      trialExpiredSnapshot
    ] = await Promise.all([
      canceledQuery.get(),
      failedPaymentsQuery.get(),
      planChangesQuery.get(),
      trialExpiredQuery.get()
    ]);
    
    // Process canceled subscriptions
    canceledSnapshot.forEach(doc => {
      const clinic = doc.data();
      const lostAmount = clinic.package === 'premium' 
        ? LOST_REVENUE_ESTIMATES.canceled 
        : LOST_REVENUE_ESTIMATES.downgrade;
      
      const event: LostRevenueEvent = {
        clinicId: doc.id,
        clinicName: clinic.name || 'Unknown Clinic',
        amount: lostAmount,
        reason: 'canceled',
        date: clinic.lastUpdated
      };
      
      // Add to total amounts
      if (isCurrentMonth(clinic.lastUpdated)) {
        metrics.lostThisMonth += lostAmount;
        metrics.breakdownByReason.canceled += lostAmount;
      }
      
      if (isCurrentYear(clinic.lastUpdated)) {
        metrics.lostThisYear += lostAmount;
      }
      
      if (metrics.rawEvents) {
        metrics.rawEvents.push(event);
      }
    });
    
    // Process failed payments
    failedPaymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      const lostAmount = payment.amount || LOST_REVENUE_ESTIMATES.failedPayment;
      
      const event: LostRevenueEvent = {
        clinicId: payment.clinicId || doc.id,
        clinicName: payment.clinicName || 'Unknown Clinic',
        amount: lostAmount,
        reason: 'failedPayment',
        date: payment.date
      };
      
      // Add to total amounts
      if (isCurrentMonth(payment.date)) {
        metrics.lostThisMonth += lostAmount;
        metrics.breakdownByReason.failedPayment += lostAmount;
      }
      
      if (isCurrentYear(payment.date)) {
        metrics.lostThisYear += lostAmount;
      }
      
      if (metrics.rawEvents) {
        metrics.rawEvents.push(event);
      }
    });
    
    // Process plan downgrades
    planChangesSnapshot.forEach(doc => {
      const logData = doc.data();
      const payload = logData.payload || {};
      
      // Only count downgrades (premium to basic)
      if (payload.oldPlan === 'premium' && payload.newPlan === 'basic') {
        const lostAmount = LOST_REVENUE_ESTIMATES.downgrade;
        
        const event: LostRevenueEvent = {
          clinicId: logData.clinicId,
          clinicName: payload.clinicName || 'Unknown Clinic',
          amount: lostAmount,
          reason: 'downgrade',
          date: logData.timestamp
        };
        
        // Add to total amounts
        if (isCurrentMonth(logData.timestamp)) {
          metrics.lostThisMonth += lostAmount;
          metrics.breakdownByReason.downgrade += lostAmount;
        }
        
        if (isCurrentYear(logData.timestamp)) {
          metrics.lostThisYear += lostAmount;
        }
        
        if (metrics.rawEvents) {
          metrics.rawEvents.push(event);
        }
      }
    });
    
    // Process expired trials
    trialExpiredSnapshot.forEach(doc => {
      const clinic = doc.data();
      
      // Check if they've been active for at least 14 days but haven't upgraded
      if (clinic.createdAt && clinic.package === 'basic') {
        const lostAmount = LOST_REVENUE_ESTIMATES.expiredTrial;
        
        const event: LostRevenueEvent = {
          clinicId: doc.id,
          clinicName: clinic.name || 'Unknown Clinic',
          amount: lostAmount,
          reason: 'expiredTrial',
          date: Timestamp.fromDate(new Date(
            clinic.createdAt.toDate().getTime() + (14 * 24 * 60 * 60 * 1000) // 14 days after creation
          ))
        };
        
        // Add to total amounts
        if (isCurrentMonth(event.date)) {
          metrics.lostThisMonth += lostAmount;
          metrics.breakdownByReason.expiredTrial += lostAmount;
        }
        
        if (isCurrentYear(event.date)) {
          metrics.lostThisYear += lostAmount;
        }
        
        if (metrics.rawEvents) {
          metrics.rawEvents.push(event);
        }
      }
    });
    
    // Look for missed upsell opportunities
    // For this demo, we'll consider clinics with high traffic but still on basic plan
    const trafficRef = db.collection('traffic_logs');
    const highTrafficQuery = await trafficRef
      .where('timestamp', '>=', Timestamp.fromDate(new Date(
        new Date().setDate(new Date().getDate() - 30) // Last 30 days
      )))
      .get();
    
    // Group by clinicId and count views
    const clinicViews = new Map<string, number>();
    highTrafficQuery.forEach(doc => {
      const data = doc.data();
      const clinicId = data.clinicId;
      if (clinicId) {
        clinicViews.set(clinicId, (clinicViews.get(clinicId) || 0) + 1);
      }
    });
    
    // Find basic clinics with high traffic (potential missed upsells)
    const highTrafficThreshold = 20; // 20+ views in a month is considered high traffic
    for (const [clinicId, views] of clinicViews.entries()) {
      if (views >= highTrafficThreshold) {
        // Check if this is a basic plan clinic
        const clinicDoc = await clinicsRef.doc(clinicId).get();
        if (clinicDoc.exists) {
          const clinic = clinicDoc.data();
          if (clinic && clinic.package === 'basic') {
            const lostAmount = LOST_REVENUE_ESTIMATES.missedUpsell;
            
            const event: LostRevenueEvent = {
              clinicId: clinicId,
              clinicName: clinic.name || 'Unknown Clinic',
              amount: lostAmount,
              reason: 'missedUpsell',
              date: Timestamp.now()
            };
            
            // Add to monthly lost revenue
            metrics.lostThisMonth += lostAmount;
            metrics.lostThisYear += lostAmount;
            metrics.breakdownByReason.missedUpsell += lostAmount;
            
            if (metrics.rawEvents) {
              metrics.rawEvents.push(event);
            }
          }
        }
      }
    }
    
    // Sort raw events by date (most recent first)
    if (metrics.rawEvents) {
      metrics.rawEvents.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      
      // Apply limit if specified in options
      if (options.limit && metrics.rawEvents.length > options.limit) {
        metrics.rawEvents = metrics.rawEvents.slice(0, options.limit);
      }
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting lost revenue metrics:', error);
    // Return default metrics on error
    return {
      lostThisMonth: 0,
      lostThisYear: 0,
      breakdownByReason: {
        canceled: 0,
        downgrade: 0,
        failedPayment: 0,
        missedUpsell: 0,
        expiredTrial: 0
      }
    };
  }
}

/**
 * Get lost revenue metrics filtered by reason
 * 
 * @param db Firestore database instance
 * @param reason The specific reason to filter by
 * @param options Additional filtering options
 * @returns Promise resolving to filtered lost revenue metrics
 */
export async function getLostRevenueByReason(
  db: Firestore,
  reason: string,
  options: MetricOptions = {}
): Promise<LostRevenueMetrics> {
  // First get all lost revenue data
  const allLostRevenue = await getLostRevenue(db, options);
  
  // Filter raw events by reason
  if (allLostRevenue.rawEvents) {
    allLostRevenue.rawEvents = allLostRevenue.rawEvents.filter(
      event => event.reason === reason
    );
  }
  
  // Set breakdown to only include the specified reason
  const breakdownValue = allLostRevenue.breakdownByReason[reason] || 0;
  allLostRevenue.breakdownByReason = { [reason]: breakdownValue } as any;
  
  // Update monthly and yearly totals
  let monthlySumForReason = 0;
  let yearlySumForReason = 0;
  
  if (allLostRevenue.rawEvents) {
    for (const event of allLostRevenue.rawEvents) {
      if (isCurrentMonth(event.date)) {
        monthlySumForReason += event.amount;
      }
      if (isCurrentYear(event.date)) {
        yearlySumForReason += event.amount;
      }
    }
  } else {
    // If no raw events, use the breakdown value as an estimate
    monthlySumForReason = breakdownValue;
    yearlySumForReason = breakdownValue * 12; // Rough estimate
  }
  
  allLostRevenue.lostThisMonth = monthlySumForReason;
  allLostRevenue.lostThisYear = yearlySumForReason;
  
  return allLostRevenue;
}