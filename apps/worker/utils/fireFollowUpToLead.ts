import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface FollowUpTrigger {
  leadId: string;
  clinicSlug: string;
  email?: string;
  phone?: string;
  name?: string;
  delayDays?: number;
  followUpType: 'review-request' | 'experience-check' | 'satisfaction-survey';
}

export interface FollowUpResult {
  success: boolean;
  followUpId?: string;
  channel: 'email' | 'sms' | 'none';
  scheduledFor: Date;
  message?: string;
  error?: string;
}

export async function fireFollowUpToLead(
  trigger: FollowUpTrigger
): Promise<FollowUpResult> {
  try {
    const {
      leadId,
      clinicSlug,
      email,
      phone,
      name,
      delayDays = 3,
      followUpType
    } = trigger;
    
    // Check if lead already has a review or recent follow-up
    const shouldSkip = await checkShouldSkipFollowUp(leadId, clinicSlug, email, phone);
    
    if (shouldSkip) {
      return {
        success: false,
        channel: 'none',
        scheduledFor: new Date(),
        message: 'Follow-up skipped - review already exists or recent follow-up sent'
      };
    }
    
    // Determine best communication channel
    const channel = determineBestChannel(email, phone);
    
    if (channel === 'none') {
      return {
        success: false,
        channel: 'none',
        scheduledFor: new Date(),
        message: 'No valid communication channel available'
      };
    }
    
    // Calculate follow-up schedule
    const scheduledFor = new Date(Date.now() + (delayDays * 24 * 60 * 60 * 1000));
    
    // Create follow-up record
    const followUpData = {
      leadId,
      clinicSlug,
      email: email?.toLowerCase(),
      phone,
      name,
      followUpType,
      channel,
      status: 'scheduled',
      scheduledFor,
      createdAt: serverTimestamp(),
      attempts: 0,
      lastAttempt: null,
      completed: false,
      clicked: false,
      replied: false
    };
    
    const followUpsRef = collection(db, 'followUps');
    const followUpDoc = await addDoc(followUpsRef, followUpData);
    
    // If delay is 0, send immediately
    if (delayDays === 0) {
      const sendResult = await sendFollowUpMessage(followUpDoc.id, followUpData);
      
      if (sendResult.success) {
        await updateDoc(doc(db, 'followUps', followUpDoc.id), {
          status: 'sent',
          lastAttempt: serverTimestamp(),
          attempts: 1
        });
      }
    }
    
    console.log(`📅 Follow-up scheduled for ${scheduledFor.toISOString()} via ${channel}`);
    
    return {
      success: true,
      followUpId: followUpDoc.id,
      channel,
      scheduledFor,
      message: `Follow-up scheduled for ${delayDays} days via ${channel}`
    };
    
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    return {
      success: false,
      channel: 'none',
      scheduledFor: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkShouldSkipFollowUp(
  leadId: string,
  clinicSlug: string,
  email?: string,
  phone?: string
): Promise<boolean> {
  try {
    // Check if user already left a review
    if (email || phone) {
      const reviewsRef = collection(db, 'reviews');
      let reviewQuery;
      
      if (email) {
        reviewQuery = query(
          reviewsRef,
          where('clinicSlug', '==', clinicSlug),
          where('email', '==', email.toLowerCase())
        );
      } else if (phone) {
        reviewQuery = query(
          reviewsRef,
          where('clinicSlug', '==', clinicSlug),
          where('phone', '==', phone)
        );
      }
      
      if (reviewQuery) {
        const reviewSnapshot = await getDocs(reviewQuery);
        if (!reviewSnapshot.empty) {
          return true; // Skip if review already exists
        }
      }
    }
    
    // Check if recent follow-up was already sent
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const followUpsRef = collection(db, 'followUps');
    
    const recentFollowUpQuery = query(
      followUpsRef,
      where('leadId', '==', leadId),
      where('createdAt', '>', sevenDaysAgo)
    );
    
    const followUpSnapshot = await getDocs(recentFollowUpQuery);
    if (!followUpSnapshot.empty) {
      return true; // Skip if recent follow-up exists
    }
    
    return false;
    
  } catch (error) {
    console.error('Error checking follow-up conditions:', error);
    return false;
  }
}

function determineBestChannel(email?: string, phone?: string): 'email' | 'sms' | 'none' {
  // Email is preferred for follow-ups (better experience and tracking)
  if (email && isValidEmail(email)) {
    return 'email';
  }
  
  if (phone && isValidPhone(phone)) {
    return 'sms';
  }
  
  return 'none';
}

async function sendFollowUpMessage(
  followUpId: string,
  followUpData: any
): Promise<{ success: boolean; error?: string }> {
  const {
    channel,
    email,
    phone,
    name,
    clinicSlug,
    followUpType
  } = followUpData;
  
  // Get clinic info
  const clinicDoc = await getDocs(query(
    collection(db, 'clinics'),
    where('__name__', '==', clinicSlug)
  ));
  
  const clinic = clinicDoc.docs[0]?.data();
  const clinicName = clinic?.name || 'the clinic';
  
  try {
    if (channel === 'email') {
      return await sendFollowUpEmail(email, name, clinicName, followUpType, followUpId);
    } else {
      return await sendFollowUpSMS(phone, name, clinicName, followUpType, followUpId);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function sendFollowUpEmail(
  email: string,
  name: string,
  clinicName: string,
  followUpType: string,
  followUpId: string
): Promise<{ success: boolean; error?: string }> {
  const subject = getEmailSubject(followUpType, clinicName);
  const body = generateEmailTemplate(name, clinicName, followUpType, followUpId);
  
  // In development, mock the email sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 MOCK FOLLOW-UP EMAIL:');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('Body:', body);
    
    return { success: true };
  }
  
  // In production, integrate with email provider
  try {
    /*
    const emailData = {
      to: email,
      subject,
      html: body,
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

async function sendFollowUpSMS(
  phone: string,
  name: string,
  clinicName: string,
  followUpType: string,
  followUpId: string
): Promise<{ success: boolean; error?: string }> {
  const message = generateSMSMessage(name, clinicName, followUpType, followUpId);
  
  // In development, mock the SMS sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📱 MOCK FOLLOW-UP SMS:');
    console.log('To:', phone);
    console.log('Message:', message);
    
    return { success: true };
  }
  
  // In production, integrate with SMS provider
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

function getEmailSubject(followUpType: string, clinicName: string): string {
  switch (followUpType) {
    case 'review-request':
      return `How was your visit to ${clinicName}?`;
    case 'experience-check':
      return `Following up on your ${clinicName} visit`;
    case 'satisfaction-survey':
      return `Quick feedback about ${clinicName}`;
    default:
      return `Following up on your visit to ${clinicName}`;
  }
}

function generateEmailTemplate(
  name: string,
  clinicName: string,
  followUpType: string,
  followUpId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menshealthfinder.com';
  const reviewUrl = `${baseUrl}/review/create/${clinicName.toLowerCase().replace(/\s+/g, '-')}?followup=${followUpId}`;
  
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  
  let content = '';
  
  switch (followUpType) {
    case 'review-request':
      content = `
        <p>We hope your recent visit to <strong>${clinicName}</strong> went well!</p>
        <p>Your experience matters to other men seeking quality healthcare. Would you mind taking 2 minutes to share how your visit went?</p>
        <p>Your feedback helps others in our community find the right care.</p>
      `;
      break;
    
    case 'experience-check':
      content = `
        <p>Thanks for contacting <strong>${clinicName}</strong> through Men's Health Finder!</p>
        <p>We'd love to hear how your experience went. Did they provide the care you were looking for?</p>
        <p>Your feedback helps us ensure we're connecting men with quality healthcare providers.</p>
      `;
      break;
    
    case 'satisfaction-survey':
      content = `
        <p>We hope you had a positive experience with <strong>${clinicName}</strong>.</p>
        <p>We'd appreciate a quick review of your visit to help other men in similar situations.</p>
        <p>It only takes a minute and helps build our community of trusted healthcare information.</p>
      `;
      break;
    
    default:
      content = `
        <p>Thanks for using Men's Health Finder to connect with <strong>${clinicName}</strong>.</p>
        <p>We'd love to hear about your experience to help improve our service.</p>
      `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Follow-up from Men's Health Finder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Following up on your ${clinicName} visit</h2>
            
            <p>${greeting}</p>
            
            ${content}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${reviewUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Share Your Experience</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
                ✓ Takes less than 2 minutes<br>
                ✓ You can post anonymously<br>
                ✓ Helps other men find quality care<br>
                ✓ No spam - just this one follow-up
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
                You received this because you recently contacted ${clinicName} through Men's Health Finder. 
                This is our only follow-up - we won't send additional emails.
            </p>
        </div>
    </body>
    </html>
  `;
}

function generateSMSMessage(
  name: string,
  clinicName: string,
  followUpType: string,
  followUpId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menshealthfinder.com';
  const reviewUrl = `${baseUrl}/review/create/${clinicName.toLowerCase().replace(/\s+/g, '-')}?followup=${followUpId}`;
  
  const greeting = name ? `Hi ${name}!` : 'Hi!';
  
  switch (followUpType) {
    case 'review-request':
      return `${greeting} How did your visit to ${clinicName} go? Help others by leaving a quick review: ${reviewUrl}`;
    
    case 'experience-check':
      return `${greeting} Thanks for contacting ${clinicName}! Let us know how it went: ${reviewUrl}`;
    
    case 'satisfaction-survey':
      return `${greeting} Hope your ${clinicName} visit went well! Quick review to help others: ${reviewUrl}`;
    
    default:
      return `${greeting} Thanks for using Men's Health Finder for ${clinicName}. Share your experience: ${reviewUrl}`;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

// Process scheduled follow-ups (to be called by cron job)
export async function processScheduledFollowUps(): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  try {
    const now = new Date();
    const followUpsRef = collection(db, 'followUps');
    
    // Get scheduled follow-ups that are due
    const dueFollowUpsQuery = query(
      followUpsRef,
      where('status', '==', 'scheduled'),
      where('scheduledFor', '<=', now)
    );
    
    const snapshot = await getDocs(dueFollowUpsQuery);
    const dueFollowUps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    let sent = 0;
    let errors = 0;
    
    for (const followUp of dueFollowUps) {
      try {
        const sendResult = await sendFollowUpMessage(followUp.id, followUp);
        
        if (sendResult.success) {
          await updateDoc(doc(db, 'followUps', followUp.id), {
            status: 'sent',
            lastAttempt: serverTimestamp(),
            attempts: (followUp.attempts || 0) + 1
          });
          sent++;
        } else {
          await updateDoc(doc(db, 'followUps', followUp.id), {
            status: 'failed',
            lastAttempt: serverTimestamp(),
            attempts: (followUp.attempts || 0) + 1,
            error: sendResult.error
          });
          errors++;
        }
      } catch (error) {
        console.error(`Error sending follow-up ${followUp.id}:`, error);
        errors++;
      }
    }
    
    console.log(`📧 Processed ${dueFollowUps.length} follow-ups: ${sent} sent, ${errors} errors`);
    
    return {
      processed: dueFollowUps.length,
      sent,
      errors
    };
    
  } catch (error) {
    console.error('Error processing scheduled follow-ups:', error);
    throw error;
  }
}