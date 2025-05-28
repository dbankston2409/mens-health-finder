import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteField } from 'firebase/firestore';

export interface ResolveOpportunityRequest {
  clinicSlug: string;
  opportunityType: 'seo' | 'upgrade' | 'engagement' | 'traffic' | 'indexing';
  resolution: 'upgraded' | 'fixed' | 'implemented' | 'dismissed';
  notes?: string;
  newTier?: string;
}

export interface ResolveOpportunityResult {
  success: boolean;
  alertsRemoved: number;
  tagsRemoved: number;
  suggestionsRemoved: number;
  message: string;
}

export async function resolveOpportunity(
  request: ResolveOpportunityRequest
): Promise<ResolveOpportunityResult> {
  try {
    const { clinicSlug, opportunityType, resolution, notes, newTier } = request;
    
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinic = clinicDoc.data();
    let alertsRemoved = 0;
    let tagsRemoved = 0;
    let suggestionsRemoved = 0;
    
    // Handle different resolution types
    switch (resolution) {
      case 'upgraded':
        await handleUpgradeResolution(clinicRef, clinic, newTier, notes);
        break;
      case 'fixed':
        await handleFixResolution(clinicRef, clinic, opportunityType, notes);
        break;
      case 'implemented':
        await handleImplementationResolution(clinicRef, clinic, opportunityType, notes);
        break;
      case 'dismissed':
        await handleDismissalResolution(clinicRef, clinic, opportunityType, notes);
        break;
    }
    
    // Remove related alerts
    const alerts = clinic.alerts || [];
    const relatedAlerts = alerts.filter((alert: any) => 
      isRelatedAlert(alert, opportunityType)
    );
    
    if (relatedAlerts.length > 0) {
      const updatedAlerts = alerts.filter((alert: any) => 
        !isRelatedAlert(alert, opportunityType)
      );
      
      await updateDoc(clinicRef, {
        alerts: updatedAlerts
      });
      
      // Also remove from global alerts
      await removeFromGlobalAlerts(relatedAlerts);
      alertsRemoved = relatedAlerts.length;
    }
    
    // Remove related tags
    const tags = clinic.tags || [];
    const opportunityTag = `opportunity-${opportunityType}`;
    
    if (tags.includes(opportunityTag)) {
      await updateDoc(clinicRef, {
        tags: arrayRemove(opportunityTag)
      });
      tagsRemoved = 1;
    }
    
    // Remove related suggestions
    const suggestions = clinic.opportunities?.suggestions || [];
    const relatedSuggestions = suggestions.filter((suggestion: any) => 
      suggestion.type === opportunityType
    );
    
    if (relatedSuggestions.length > 0) {
      const updatedSuggestions = suggestions.filter((suggestion: any) => 
        suggestion.type !== opportunityType
      );
      
      await updateDoc(clinicRef, {
        'opportunities.suggestions': updatedSuggestions
      });
      suggestionsRemoved = relatedSuggestions.length;
    }
    
    // Log the resolution
    await updateDoc(clinicRef, {
      'opportunities.resolutions': clinic.opportunities?.resolutions || [] + [{
        type: opportunityType,
        resolution,
        resolvedAt: new Date(),
        resolvedBy: 'admin', // Could be passed as parameter
        notes,
        newTier
      }]
    });
    
    console.log(`✅ Opportunity resolved: ${opportunityType} for ${clinic.name} (${resolution})`);
    
    return {
      success: true,
      alertsRemoved,
      tagsRemoved,
      suggestionsRemoved,
      message: `${opportunityType} opportunity resolved as ${resolution}`
    };
    
  } catch (error) {
    console.error('Error resolving opportunity:', error);
    return {
      success: false,
      alertsRemoved: 0,
      tagsRemoved: 0,
      suggestionsRemoved: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function handleUpgradeResolution(
  clinicRef: any,
  clinic: any,
  newTier?: string,
  notes?: string
): Promise<void> {
  const updates: any = {
    'opportunities.lastUpgrade': new Date(),
    'opportunities.upgradeNotes': notes
  };
  
  if (newTier) {
    updates.package = newTier;
    updates.upgradedAt = new Date();
    
    // Reset trial flags if applicable
    if (clinic.trial?.active) {
      updates['trial.active'] = false;
      updates['trial.completedAt'] = new Date();
    }
  }
  
  await updateDoc(clinicRef, updates);
}

async function handleFixResolution(
  clinicRef: any,
  clinic: any,
  opportunityType: string,
  notes?: string
): Promise<void> {
  const updates: any = {
    [`opportunities.${opportunityType}Fixed`]: true,
    [`opportunities.${opportunityType}FixedAt`]: new Date(),
    [`opportunities.${opportunityType}FixNotes`]: notes
  };
  
  // Update specific fields based on opportunity type
  switch (opportunityType) {
    case 'seo':
      updates['seoMeta.lastOptimized'] = new Date();
      break;
    case 'indexing':
      updates['seoMeta.indexed'] = true;
      updates['seoMeta.indexedAt'] = new Date();
      break;
    case 'engagement':
      if (notes?.includes('call tracking')) {
        updates['callTracking.enabled'] = true;
        updates['callTracking.enabledAt'] = new Date();
      }
      break;
  }
  
  await updateDoc(clinicRef, updates);
}

async function handleImplementationResolution(
  clinicRef: any,
  clinic: any,
  opportunityType: string,
  notes?: string
): Promise<void> {
  const updates: any = {
    [`opportunities.${opportunityType}Implemented`]: true,
    [`opportunities.${opportunityType}ImplementedAt`]: new Date(),
    [`opportunities.${opportunityType}Implementation`]: notes
  };
  
  await updateDoc(clinicRef, updates);
}

async function handleDismissalResolution(
  clinicRef: any,
  clinic: any,
  opportunityType: string,
  notes?: string
): Promise<void> {
  const updates: any = {
    [`opportunities.${opportunityType}Dismissed`]: true,
    [`opportunities.${opportunityType}DismissedAt`]: new Date(),
    [`opportunities.${opportunityType}DismissalReason`]: notes
  };
  
  await updateDoc(clinicRef, updates);
}

function isRelatedAlert(alert: any, opportunityType: string): boolean {
  const typeMapping: Record<string, string[]> = {
    seo: ['low_seo_score_paid', 'premium_not_indexed'],
    upgrade: ['high_traffic_free_clinic', 'upgrade_opportunity'],
    engagement: ['missing_call_tracking', 'low_engagement'],
    traffic: ['traffic_loss', 'low_ctr'],
    indexing: ['premium_not_indexed', 'indexing_issues']
  };
  
  const relatedTypes = typeMapping[opportunityType] || [];
  return relatedTypes.includes(alert.type);
}

async function removeFromGlobalAlerts(alerts: any[]): Promise<void> {
  try {
    const globalAlertsRef = doc(db, 'admin', 'alerts');
    const updates: any = {};
    
    alerts.forEach(alert => {
      updates[`active.${alert.id}`] = deleteField();
      updates[`resolved.${alert.id}`] = {
        resolvedAt: new Date(),
        reason: 'opportunity_resolved'
      };
    });
    
    await updateDoc(globalAlertsRef, updates);
  } catch (error) {
    console.error('Error removing global alerts:', error);
  }
}

export async function bulkResolveOpportunities(
  requests: ResolveOpportunityRequest[]
): Promise<ResolveOpportunityResult[]> {
  const results: ResolveOpportunityResult[] = [];
  
  for (const request of requests) {
    try {
      const result = await resolveOpportunity(request);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        alertsRemoved: 0,
        tagsRemoved: 0,
        suggestionsRemoved: 0,
        message: `Error resolving ${request.opportunityType}: ${error}`
      });
    }
  }
  
  return results;
}

export async function getOpportunityHistory(clinicSlug: string): Promise<any[]> {
  try {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      return [];
    }
    
    const clinic = clinicDoc.data();
    return clinic.opportunities?.resolutions || [];
    
  } catch (error) {
    console.error('Error getting opportunity history:', error);
    return [];
  }
}