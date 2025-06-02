import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from '../lib/firebase-compat';

export interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  message: string;
  clinicSlug?: string;
  data?: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
  actionRequired?: boolean;
}

export interface AlertTrigger {
  type: string;
  condition: (clinic: any) => boolean;
  severity: 'info' | 'warn' | 'critical';
  title: (clinic: any) => string;
  message: (clinic: any) => string;
  actionRequired?: boolean;
}

export interface AlertEngineResult {
  alertsCreated: number;
  alertsResolved: number;
  clinicsProcessed: number;
  errors: string[];
}

const ALERT_TRIGGERS: AlertTrigger[] = [
  // High-traffic free clinic
  {
    type: 'high_traffic_free_clinic',
    condition: (clinic) => 
      clinic.package === 'free' && 
      (clinic.traffic?.clicks30d || 0) >= 50 &&
      clinic.engagement?.level === 'engaged',
    severity: 'warn',
    title: (clinic) => `High-Traffic Free Clinic: ${clinic.name}`,
    message: (clinic) => `${clinic.name} has ${clinic.traffic?.clicks30d} clicks but is on free plan. Upgrade opportunity!`,
    actionRequired: true
  },
  
  // Ghosted premium clinic
  {
    type: 'ghosted_premium_clinic',
    condition: (clinic) => 
      ['premium', 'enterprise'].includes(clinic.package) &&
      (clinic.traffic?.clicks30d || 0) === 0 &&
      (clinic.traffic?.calls30d || 0) === 0 &&
      clinic.status === 'active',
    severity: 'critical',
    title: (clinic) => `Ghosted Premium Client: ${clinic.name}`,
    message: (clinic) => `${clinic.name} is paying for ${clinic.package} but has 0 traffic. Needs attention!`,
    actionRequired: true
  },
  
  // Missing verification steps
  {
    type: 'incomplete_verification',
    condition: (clinic) => 
      clinic.package !== 'free' &&
      clinic.validation?.status !== 'verified' &&
      clinic.createdAt && 
      (Date.now() - clinic.createdAt.toDate?.().getTime()) > (7 * 24 * 60 * 60 * 1000), // 7 days old
    severity: 'warn',
    title: (clinic) => `Incomplete Verification: ${clinic.name}`,
    message: (clinic) => `${clinic.name} has been unverified for over 7 days. Complete verification process.`,
    actionRequired: true
  },
  
  // No indexing for premium listing
  {
    type: 'premium_not_indexed',
    condition: (clinic) => 
      ['premium', 'enterprise'].includes(clinic.package) &&
      clinic.seoMeta?.indexed === false,
    severity: 'critical',
    title: (clinic) => `Premium Clinic Not Indexed: ${clinic.name}`,
    message: (clinic) => `${clinic.name} is paying ${clinic.package} but not indexed by Google. SEO issue!`,
    actionRequired: true
  },
  
  // Low SEO score for paying clients
  {
    type: 'low_seo_score_paid',
    condition: (clinic) => 
      clinic.package !== 'free' &&
      (clinic.seoMeta?.score || 0) < 50,
    severity: 'warn',
    title: (clinic) => `Low SEO Score: ${clinic.name}`,
    message: (clinic) => `${clinic.name} has SEO score of ${clinic.seoMeta?.score || 0}/100. Needs optimization.`,
    actionRequired: false
  },
  
  // Call tracking disabled for engaged clinic
  {
    type: 'missing_call_tracking',
    condition: (clinic) => 
      clinic.engagement?.level === 'engaged' &&
      !clinic.callTracking?.enabled &&
      clinic.package !== 'free',
    severity: 'info',
    title: (clinic) => `Missing Call Tracking: ${clinic.name}`,
    message: (clinic) => `${clinic.name} is engaged but missing call tracking. Revenue opportunity!`,
    actionRequired: false
  }
];

export async function alertEngine(options: {
  clinicSlug?: string;
  dryRun?: boolean;
  maxAlerts?: number;
} = {}): Promise<AlertEngineResult> {
  try {
    const { clinicSlug, dryRun = false, maxAlerts = 100 } = options;
    
    let clinicsToProcess: any[] = [];
    
    if (clinicSlug) {
      // Process single clinic
      const clinicRef = doc(db, 'clinics', clinicSlug);
      const clinicDoc = await getDoc(clinicRef);
      if (clinicDoc.exists()) {
        clinicsToProcess = [{ id: clinicSlug, ...clinicDoc.data() }];
      }
    } else {
      // Process all active clinics
      const clinicsRef = collection(db, 'clinics');
      const clinicsQuery = query(clinicsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(clinicsQuery);
      clinicsToProcess = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    let alertsCreated = 0;
    let alertsResolved = 0;
    const errors: string[] = [];
    
    for (const clinic of clinicsToProcess) {
      try {
        const newAlerts = await processClinicAlerts(clinic, dryRun);
        alertsCreated += newAlerts;
        
        if (alertsCreated >= maxAlerts) break;
        
      } catch (error) {
        const errorMsg = `Error processing clinic ${clinic.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`Alert engine processed ${clinicsToProcess.length} clinics, created ${alertsCreated} alerts`);
    
    return {
      alertsCreated,
      alertsResolved,
      clinicsProcessed: clinicsToProcess.length,
      errors
    };
    
  } catch (error) {
    console.error('Alert engine error:', error);
    throw error;
  }
}

async function processClinicAlerts(clinic: any, dryRun: boolean): Promise<number> {
  let alertsCreated = 0;
  const existingAlerts = clinic.alerts || [];
  
  for (const trigger of ALERT_TRIGGERS) {
    try {
      // Check if alert already exists and is unresolved
      const existingAlert = existingAlerts.find((alert: SystemAlert) => 
        alert.type === trigger.type && !alert.resolvedAt
      );
      
      if (trigger.condition(clinic)) {
        if (!existingAlert) {
          // Create new alert
          const alert: SystemAlert = {
            id: `${trigger.type}_${clinic.id}_${Date.now()}`,
            type: trigger.type,
            severity: trigger.severity,
            title: trigger.title(clinic),
            message: trigger.message(clinic),
            clinicSlug: clinic.id,
            data: {
              package: clinic.package,
              clicks30d: clinic.traffic?.clicks30d || 0,
              calls30d: clinic.traffic?.calls30d || 0,
              engagement: clinic.engagement?.level,
              seoScore: clinic.seoMeta?.score
            },
            createdAt: new Date(),
            actionRequired: trigger.actionRequired
          };
          
          if (!dryRun) {
            const clinicRef = doc(db, 'clinics', clinic.id);
            await updateDoc(clinicRef, {
              alerts: arrayUnion(alert)
            });
            
            // Also add to global alerts collection for admin dashboard
            await addToGlobalAlerts(alert);
          }
          
          console.log(`🚨 Alert created: ${alert.title}`);
          alertsCreated++;
        }
      } else if (existingAlert) {
        // Condition no longer met, resolve alert
        if (!dryRun) {
          await resolveAlert(clinic.id, existingAlert.id);
        }
        console.log(`✅ Alert resolved: ${existingAlert.title}`);
      }
      
    } catch (error) {
      console.error(`Error processing trigger ${trigger.type} for clinic ${clinic.id}:`, error);
    }
  }
  
  return alertsCreated;
}

async function addToGlobalAlerts(alert: SystemAlert): Promise<void> {
  try {
    const globalAlertsRef = doc(db, 'admin', 'alerts');
    await updateDoc(globalAlertsRef, {
      [`active.${alert.id}`]: alert,
      lastUpdated: new Date()
    });
  } catch (error) {
    // Create the document if it doesn't exist
    const globalAlertsRef = doc(db, 'admin', 'alerts');
    await updateDoc(globalAlertsRef, {
      active: { [alert.id]: alert },
      lastUpdated: new Date()
    });
  }
}

async function resolveAlert(clinicSlug: string, alertId: string): Promise<void> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (clinicDoc.exists()) {
      const clinic = clinicDoc.data();
      const alerts = (clinic.alerts || []).map((alert: SystemAlert) => 
        alert.id === alertId ? { ...alert, resolvedAt: new Date() } : alert
      );
      
      await updateDoc(clinicRef, { alerts });
      
      // Remove from global alerts
      const globalAlertsRef = doc(db, 'admin', 'alerts');
      await updateDoc(globalAlertsRef, {
        [`active.${alertId}`]: null,
        [`resolved.${alertId}`]: {
          resolvedAt: new Date(),
          clinicSlug
        }
      });
    }
  } catch (error) {
    console.error(`Error resolving alert ${alertId}:`, error);
  }
}

export async function getActiveAlerts(limit: number = 50): Promise<SystemAlert[]> {
  try {
    const alertsRef = doc(db, 'admin', 'alerts');
    const alertsDoc = await getDoc(alertsRef);
    
    if (!alertsDoc.exists()) return [];
    
    const alertsData = alertsDoc.data();
    const activeAlerts = Object.values(alertsData.active || {}) as SystemAlert[];
    
    return activeAlerts
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => {
        // Sort by severity, then by creation date
        const severityOrder = { critical: 3, warn: 2, info: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return [];
  }
}

export async function resolveAlertById(alertId: string): Promise<void> {
  try {
    const alertsRef = doc(db, 'admin', 'alerts');
    const alertsDoc = await getDoc(alertsRef);
    
    if (alertsDoc.exists()) {
      const alertsData = alertsDoc.data();
      const alert = alertsData.active?.[alertId];
      
      if (alert) {
        await resolveAlert(alert.clinicSlug, alertId);
      }
    }
  } catch (error) {
    console.error(`Error resolving alert by ID ${alertId}:`, error);
    throw error;
  }
}