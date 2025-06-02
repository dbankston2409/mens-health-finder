import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc, increment } from '../lib/firebase-compat';

export interface EngagementEvent {
  type: 'email_open' | 'email_click' | 'sms_click' | 'sms_reply' | 'unsubscribe' | 'bounce';
  messageId: string;
  clinicSlug?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  metadata?: Record<string, any>;
}

// Process engagement events from webhooks
export async function processEngagementEvent(event: EngagementEvent): Promise<void> {
  try {
    if (!event.clinicSlug) {
      console.warn('⚠️ No clinic slug in engagement event:', event);
      return;
    }

    const clinicRef = doc(db, 'clinics', event.clinicSlug);
    const clinicSnap = await getDoc(clinicRef);
    
    if (!clinicSnap.exists()) {
      console.error(`❌ Clinic not found: ${event.clinicSlug}`);
      return;
    }

    // Update engagement metrics
    const updateData: any = {};
    
    switch (event.type) {
      case 'email_open':
        updateData['engagement.emailOpens'] = arrayUnion({
          timestamp: event.timestamp,
          messageId: event.messageId,
          userAgent: event.userAgent,
          location: event.location
        });
        updateData['engagement.lastEmailOpen'] = event.timestamp;
        break;
        
      case 'email_click':
        updateData['engagement.emailClicks'] = arrayUnion({
          timestamp: event.timestamp,
          messageId: event.messageId,
          link: event.metadata?.link,
          userAgent: event.userAgent,
          location: event.location
        });
        updateData['engagement.lastEmailClick'] = event.timestamp;
        break;
        
      case 'sms_click':
        updateData['engagement.smsClicks'] = arrayUnion({
          timestamp: event.timestamp,
          messageId: event.messageId,
          link: event.metadata?.link
        });
        updateData['engagement.lastSmsClick'] = event.timestamp;
        break;
        
      case 'sms_reply':
        updateData['engagement.smsReplies'] = arrayUnion({
          timestamp: event.timestamp,
          messageId: event.messageId,
          content: event.metadata?.content
        });
        updateData['engagement.lastSmsReply'] = event.timestamp;
        break;
        
      case 'unsubscribe':
        updateData['engagement.unsubscribed'] = true;
        updateData['engagement.unsubscribedAt'] = event.timestamp;
        updateData['engagement.unsubscribeReason'] = event.metadata?.reason || 'user_requested';
        break;
        
      case 'bounce':
        updateData['engagement.bounces'] = arrayUnion({
          timestamp: event.timestamp,
          messageId: event.messageId,
          type: event.metadata?.bounceType || 'hard',
          reason: event.metadata?.reason
        });
        break;
    }
    
    // Update last activity
    updateData['engagement.lastActivity'] = event.timestamp;
    updateData['engagement.lastActivityType'] = event.type;
    
    // Update clinic document
    await updateDoc(clinicRef, updateData);
    
    // Track engagement score
    await updateEngagementScore(event.clinicSlug, event.type);
    
    console.log(`✅ Tracked ${event.type} for clinic ${event.clinicSlug}`);
    
  } catch (error) {
    console.error('❌ Error tracking engagement event:', error);
    throw error;
  }
}

// Update engagement score based on event type
async function updateEngagementScore(clinicSlug: string, eventType: string): Promise<void> {
  const weights = {
    email_open: 1,
    email_click: 3,
    sms_click: 3,
    sms_reply: 5,
    unsubscribe: -10,
    bounce: -5
  };
  
  const score = weights[eventType] || 0;
  
  if (score !== 0) {
    const clinicRef = doc(db, 'clinics', clinicSlug);
    await updateDoc(clinicRef, {
      'engagement.score': increment(score),
      'engagement.scoreLastUpdated': serverTimestamp()
    });
  }
}

// Process batch of engagement events
export async function processBatchEngagementEvents(events: EngagementEvent[]): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const event of events) {
    try {
      await processEngagementEvent(event);
      processed++;
    } catch (error) {
      failed++;
      errors.push(`Failed to process ${event.type} for ${event.clinicSlug}: ${error.message}`);
    }
  }
  
  return { processed, failed, errors };
}

