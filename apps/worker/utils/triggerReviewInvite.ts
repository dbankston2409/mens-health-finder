import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export interface ReviewInviteTrigger {
  userId?: string;
  email?: string;
  phone?: string;
  clinicSlug: string;
  triggerType: 'call-click' | 'dwell-time' | 'form-submission' | 'manual';
  sessionData?: any;
}

export interface ReviewInviteResult {
  success: boolean;
  inviteId?: string;
  channel: 'sms' | 'email' | 'none';
  message?: string;
  error?: string;
}

export async function triggerReviewInvite(
  trigger: ReviewInviteTrigger
): Promise<ReviewInviteResult> {
  try {
    const { userId, email, phone, clinicSlug, triggerType, sessionData } = trigger;
    
    // Get clinic information
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinic = clinicDoc.data();
    
    // Check if we should send invite based on trigger conditions
    const shouldSend = await evaluateTriggerConditions(trigger, sessionData);
    
    if (!shouldSend) {
      return {
        success: false,
        channel: 'none',
        message: 'Trigger conditions not met'
      };
    }
    
    // Check if invite was already sent recently
    const recentInvite = await checkRecentInvite(clinicSlug, email, phone);
    if (recentInvite) {
      return {
        success: false,
        channel: 'none',
        message: 'Recent invite already sent'
      };
    }
    
    // Determine best communication channel
    const channel = determineBestChannel(email, phone);
    
    if (channel === 'none') {
      return {
        success: false,
        channel: 'none',
        message: 'No valid communication channel available'
      };
    }
    
    // Create invite record
    const inviteData = {
      userId,
      email: email?.toLowerCase(),
      phone,
      clinicSlug,
      clinicName: clinic.name,
      triggerType,
      channel,
      status: 'sent',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
      clickedAt: null,
      completedAt: null,
      sessionData
    };
    
    const invitesRef = collection(db, 'reviewInvites');
    const inviteDoc = await addDoc(invitesRef, inviteData);
    
    // Send the actual invite
    const sendResult = await sendInviteMessage(inviteDoc.id, channel, {
      clinicName: clinic.name,
      clinicSlug,
      recipient: channel === 'email' ? email : phone,
      reviewUrl: generateReviewUrl(clinicSlug, inviteDoc.id)
    });
    
    if (!sendResult.success) {
      throw new Error(`Failed to send ${channel}: ${sendResult.error}`);
    }
    
    console.log(`📧 Review invite sent via ${channel} for ${clinic.name}`);
    
    return {
      success: true,
      inviteId: inviteDoc.id,
      channel,
      message: `Review invite sent via ${channel}`
    };
    
  } catch (error) {
    console.error('Error triggering review invite:', error);
    return {
      success: false,
      channel: 'none',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function evaluateTriggerConditions(
  trigger: ReviewInviteTrigger,
  sessionData: any
): Promise<boolean> {
  const { triggerType } = trigger;
  
  switch (triggerType) {
    case 'call-click':
      return evaluateCallClickTrigger(trigger, sessionData);
    
    case 'dwell-time':
      return evaluateDwellTimeTrigger(trigger, sessionData);
    
    case 'form-submission':
      return evaluateFormSubmissionTrigger(trigger, sessionData);
    
    case 'manual':
      return true;
    
    default:
      return false;
  }
}

async function evaluateCallClickTrigger(
  trigger: ReviewInviteTrigger,
  sessionData: any
): Promise<boolean> {
  // Check if call was clicked within past 48 hours
  if (!sessionData?.events) return false;
  
  const callEvents = sessionData.events.filter((event: any) => 
    event.action === 'clicked-call' || event.action === 'phone-click'
  );
  
  if (callEvents.length === 0) return false;
  
  const lastCallClick = new Date(callEvents[callEvents.length - 1].timestamp);
  const fortyEightHoursAgo = new Date(Date.now() - (48 * 60 * 60 * 1000));
  
  return lastCallClick > fortyEightHoursAgo;
}

async function evaluateDwellTimeTrigger(
  trigger: ReviewInviteTrigger,
  sessionData: any
): Promise<boolean> {
  // Check dwell time > 45 seconds and meaningful engagement
  if (!sessionData?.dwellTime) return false;
  
  const dwellTime = sessionData.dwellTime; // in seconds
  const hasEngagement = sessionData.events?.some((event: any) => 
    ['scrolled-profile', 'viewed-services', 'clicked-directions'].includes(event.action)
  );
  
  return dwellTime >= 45 && hasEngagement;
}

async function evaluateFormSubmissionTrigger(
  trigger: ReviewInviteTrigger,
  sessionData: any
): Promise<boolean> {
  // Form submission automatically qualifies
  return sessionData?.events?.some((event: any) => 
    event.action === 'form-submitted' || event.action === 'lead-submitted'
  );
}

async function checkRecentInvite(
  clinicSlug: string,
  email?: string,
  phone?: string
): Promise<boolean> {
  try {
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const invitesRef = collection(db, 'reviewInvites');
    
    let recentQuery;
    if (email) {
      recentQuery = query(
        invitesRef,
        where('clinicSlug', '==', clinicSlug),
        where('email', '==', email.toLowerCase()),
        where('createdAt', '>', sevenDaysAgo)
      );
    } else if (phone) {
      recentQuery = query(
        invitesRef,
        where('clinicSlug', '==', clinicSlug),
        where('phone', '==', phone),
        where('createdAt', '>', sevenDaysAgo)
      );
    } else {
      return false;
    }
    
    const snapshot = await getDocs(recentQuery);
    return !snapshot.empty;
    
  } catch (error) {
    console.error('Error checking recent invite:', error);
    return false;
  }
}

function determineBestChannel(email?: string, phone?: string): 'email' | 'sms' | 'none' {
  // Prefer email for review invites (better experience)
  if (email && isValidEmail(email)) {
    return 'email';
  }
  
  if (phone && isValidPhone(phone)) {
    return 'sms';
  }
  
  return 'none';
}

async function sendInviteMessage(
  inviteId: string,
  channel: 'email' | 'sms',
  data: {
    clinicName: string;
    clinicSlug: string;
    recipient: string | undefined;
    reviewUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { clinicName, recipient, reviewUrl } = data;
  
  if (!recipient) {
    return { success: false, error: 'No recipient provided' };
  }
  
  try {
    if (channel === 'email') {
      return await sendReviewInviteEmail(recipient, clinicName, reviewUrl);
    } else {
      return await sendReviewInviteSMS(recipient, clinicName, reviewUrl);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendReviewInviteEmail(
  email: string,
  clinicName: string,
  reviewUrl: string
): Promise<{ success: boolean; error?: string }> {
  // In development, mock the email sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 MOCK REVIEW INVITE EMAIL:');
    console.log('To:', email);
    console.log('Subject:', `How was your visit to ${clinicName}?`);
    console.log('Body:', generateEmailTemplate(clinicName, reviewUrl));
    
    return { success: true };
  }
  
  // In production, integrate with email provider
  try {
    // Example implementation with SendGrid or similar
    /*
    const emailData = {
      to: email,
      subject: `How was your visit to ${clinicName}?`,
      html: generateEmailTemplate(clinicName, reviewUrl),
      from: 'noreply@menshealthfinder.com'
    };
    
    await emailProvider.send(emailData);
    */
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed'
    };
  }
}

async function sendReviewInviteSMS(
  phone: string,
  clinicName: string,
  reviewUrl: string
): Promise<{ success: boolean; error?: string }> {
  const message = `Tell others how it went with ${clinicName}. Leave a quick review here: ${reviewUrl}`;
  
  // In development, mock the SMS sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📱 MOCK REVIEW INVITE SMS:');
    console.log('To:', phone);
    console.log('Message:', message);
    
    return { success: true };
  }
  
  // In production, integrate with SMS provider (Twilio, etc.)
  try {
    /*
    await smsProvider.send({
      to: phone,
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    */
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS send failed'
    };
  }
}

function generateReviewUrl(clinicSlug: string, inviteId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menshealthfinder.com';
  return `${baseUrl}/review/create/${clinicSlug}?invite=${inviteId}`;
}

function generateEmailTemplate(clinicName: string, reviewUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>How was your visit?</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">How was your visit to ${clinicName}?</h2>
            
            <p>Hi there,</p>
            
            <p>We hope your recent visit to <strong>${clinicName}</strong> went well!</p>
            
            <p>Your experience matters to other men seeking healthcare. Would you mind taking 2 minutes to share how your visit went?</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${reviewUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Leave a Review</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
                ✓ Takes less than 2 minutes<br>
                ✓ You can post anonymously<br>
                ✓ Helps other men find quality care
            </p>
            
            <p>Thank you for helping our community!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
                You received this because you recently visited ${clinicName}. 
                If you didn't visit this clinic, please ignore this email.
            </p>
        </div>
    </body>
    </html>
  `;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}