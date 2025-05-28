import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';

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

// Webhook handler for SendGrid events
export async function handleSendGridWebhook(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify webhook signature (important for security)
    const isValid = await verifySendGridSignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    for (const event of events) {
      await processSendGridEvent(event);
    }
    
    res.status(200).json({ processed: events.length });
    
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Webhook handler for Twilio events
export async function handleTwilioWebhook(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify webhook signature
    const isValid = await verifyTwilioSignature(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    await processTwilioEvent(req.body);
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function processSendGridEvent(event: any): Promise<void> {
  try {
    const messageId = event.sg_message_id || event.customArgs?.trackingId;
    if (!messageId) {
      console.warn('SendGrid event missing message ID:', event);
      return;
    }
    
    const engagementEvent: EngagementEvent = {
      type: mapSendGridEventType(event.event),
      messageId,
      timestamp: new Date(event.timestamp * 1000),
      userAgent: event.useragent,
      ipAddress: event.ip,
      metadata: {
        email: event.email,
        reason: event.reason,
        url: event.url,
        sgEventId: event.sg_event_id,
        sgMessageId: event.sg_message_id
      }
    };
    
    // Add location if available
    if (event.city || event.state || event.country) {
      engagementEvent.location = {
        city: event.city,
        state: event.state,
        country: event.country
      };
    }
    
    await trackEngagementEvent(engagementEvent);
    
  } catch (error) {
    console.error('Error processing SendGrid event:', error);
  }
}

async function processTwilioEvent(event: any): Promise<void> {
  try {
    const messageId = event.MessageSid;
    const trackingId = extractTrackingIdFromCallback(event.StatusCallbackUrl);
    
    if (!trackingId) {
      console.warn('Twilio event missing tracking ID:', event);
      return;
    }
    
    const engagementEvent: EngagementEvent = {
      type: mapTwilioEventType(event.MessageStatus, event.Body),
      messageId: trackingId,
      timestamp: new Date(),
      metadata: {
        twilioMessageSid: messageId,
        status: event.MessageStatus,
        errorCode: event.ErrorCode,
        errorMessage: event.ErrorMessage,
        from: event.From,
        to: event.To,
        body: event.Body
      }
    };
    
    await trackEngagementEvent(engagementEvent);
    
  } catch (error) {
    console.error('Error processing Twilio event:', error);
  }
}

function mapSendGridEventType(eventType: string): EngagementEvent['type'] {
  switch (eventType) {
    case 'open':
      return 'email_open';
    case 'click':
      return 'email_click';
    case 'unsubscribe':
      return 'unsubscribe';
    case 'bounce':
    case 'blocked':
    case 'dropped':
      return 'bounce';
    default:
      return 'email_open'; // Default fallback
  }
}

function mapTwilioEventType(status: string, body?: string): EngagementEvent['type'] {
  // Check for replies
  if (body && body.length > 0) {
    return 'sms_reply';
  }
  
  // Map status to event type
  switch (status) {
    case 'delivered':
      return 'sms_click'; // Assume delivery = potential engagement
    case 'failed':
    case 'undelivered':
      return 'bounce';
    default:
      return 'sms_click';
  }
}

export async function trackEngagementEvent(event: EngagementEvent): Promise<void> {
  try {
    // Update the outreach queue message
    await updateOutreachMessage(event);
    
    // Log to clinic engagement events (if clinic slug available)
    if (event.clinicSlug) {
      await logClinicEngagementEvent(event);
    }
    
    // Trigger automated responses if applicable
    await handleAutomatedResponses(event);
    
    console.log(`📊 Tracked engagement: ${event.type} for message ${event.messageId}`);
    
  } catch (error) {
    console.error('Error tracking engagement event:', error);
  }
}

async function updateOutreachMessage(event: EngagementEvent): Promise<void> {
  try {
    const messageRef = doc(db, 'outreachQueue', event.messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      console.warn(`Outreach message ${event.messageId} not found`);
      return;
    }
    
    const updates: Record<string, any> = {
      lastEngagement: event.timestamp,
      lastEngagementType: event.type
    };
    
    // Update specific engagement flags
    switch (event.type) {
      case 'email_open':
        updates.opened = true;
        updates.openedAt = event.timestamp;
        break;
      case 'email_click':
      case 'sms_click':
        updates.clicked = true;
        updates.clickedAt = event.timestamp;
        break;
      case 'sms_reply':
        updates.replied = true;
        updates.repliedAt = event.timestamp;
        updates.status = 'responded';
        break;
      case 'unsubscribe':
        updates.unsubscribed = true;
        updates.unsubscribedAt = event.timestamp;
        break;
      case 'bounce':
        updates.bounced = true;
        updates.bouncedAt = event.timestamp;
        updates.status = 'failed';
        break;
    }
    
    await updateDoc(messageRef, updates);
    
    // Store clinic slug for future reference if not already set
    const messageData = messageDoc.data();
    if (messageData.clinicSlug) {
      event.clinicSlug = messageData.clinicSlug;
    }
    
  } catch (error) {
    console.error('Error updating outreach message:', error);
  }
}

async function logClinicEngagementEvent(event: EngagementEvent): Promise<void> {
  try {
    if (!event.clinicSlug) return;
    
    const clinicRef = doc(db, 'clinics', event.clinicSlug);
    
    const engagementLogEntry = {
      type: event.type,
      messageId: event.messageId,
      timestamp: event.timestamp,
      userAgent: event.userAgent,
      ipAddress: event.ipAddress,
      location: event.location,
      metadata: event.metadata
    };
    
    await updateDoc(clinicRef, {
      'engagementEvents': arrayUnion(engagementLogEntry),
      'engagement.lastActivity': event.timestamp,
      'engagement.lastActivityType': event.type
    });
    
  } catch (error) {
    console.error('Error logging clinic engagement event:', error);
  }
}

async function handleAutomatedResponses(event: EngagementEvent): Promise<void> {
  try {
    // Handle SMS replies with interest keywords
    if (event.type === 'sms_reply' && event.metadata?.body) {
      const replyText = event.metadata.body.toLowerCase();
      const interestKeywords = ['yes', 'interested', 'tell me more', 'info', 'upgrade', 'demo'];
      
      const showsInterest = interestKeywords.some(keyword => replyText.includes(keyword));
      
      if (showsInterest) {
        await handlePositiveReply(event);
      }
    }
    
    // Handle email clicks on upgrade CTAs
    if (event.type === 'email_click' && event.metadata?.url) {
      const url = event.metadata.url;
      if (url.includes('/upgrade') || url.includes('utm_campaign=outreach')) {
        await handleUpgradeInterest(event);
      }
    }
    
  } catch (error) {
    console.error('Error handling automated responses:', error);
  }
}

async function handlePositiveReply(event: EngagementEvent): Promise<void> {
  try {
    // Import auto-reply functionality
    const { autoReplyToInterest } = await import('../utils/autoReplyToInterest');
    await autoReplyToInterest(event.messageId, event.metadata?.body || '');
    
  } catch (error) {
    console.error('Error handling positive reply:', error);
  }
}

async function handleUpgradeInterest(event: EngagementEvent): Promise<void> {
  try {
    if (!event.clinicSlug) return;
    
    // Tag clinic as showing upgrade interest
    const clinicRef = doc(db, 'clinics', event.clinicSlug);
    await updateDoc(clinicRef, {
      tags: arrayUnion('upgrade_interest'),
      'sales.lastUpgradeInterest': event.timestamp,
      'sales.interestSource': 'outreach_email'
    });
    
    // Could trigger follow-up actions like sales notification
    console.log(`🎯 Upgrade interest detected for clinic ${event.clinicSlug}`);
    
  } catch (error) {
    console.error('Error handling upgrade interest:', error);
  }
}

async function verifySendGridSignature(req: NextApiRequest): Promise<boolean> {
  try {
    // In production, implement SendGrid signature verification
    // For now, return true for development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;
    
    // Implement proper signature verification
    // See: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
    
    return Boolean(signature && timestamp);
    
  } catch (error) {
    console.error('Error verifying SendGrid signature:', error);
    return false;
  }
}

async function verifyTwilioSignature(req: NextApiRequest): Promise<boolean> {
  try {
    // In production, implement Twilio signature verification
    // For now, return true for development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const signature = req.headers['x-twilio-signature'] as string;
    
    // Implement proper signature verification
    // See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
    
    return Boolean(signature);
    
  } catch (error) {
    console.error('Error verifying Twilio signature:', error);
    return false;
  }
}

function extractTrackingIdFromCallback(callbackUrl: string): string | null {
  try {
    const url = new URL(callbackUrl);
    return url.searchParams.get('trackingId');
  } catch {
    return null;
  }
}

// API route handlers
export const sendGridWebhookHandler = handleSendGridWebhook;
export const twilioWebhookHandler = handleTwilioWebhook;

// Manual event tracking (for testing or direct integration)
export async function trackManualEvent(
  messageId: string,
  eventType: EngagementEvent['type'],
  metadata: Record<string, any> = {}
): Promise<void> {
  const event: EngagementEvent = {
    type: eventType,
    messageId,
    timestamp: new Date(),
    metadata
  };
  
  await trackEngagementEvent(event);
}