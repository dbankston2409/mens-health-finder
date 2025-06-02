import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from '../lib/firebase-compat';

export interface MessageSendResult {
  messagesSent: number;
  messagesFailed: number;
  emailsSent: number;
  smsSent: number;
  errors: string[];
  rateLimited: boolean;
}

export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
    from: string;
    trackingId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface SMSProvider {
  send(params: {
    to: string;
    body: string;
    from: string;
    trackingId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Mock providers for development
class MockEmailProvider implements EmailProvider {
  async send(params: any) {
    console.log('📧 MOCK EMAIL SENT:');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`From: ${params.from}`);
    console.log(`Tracking ID: ${params.trackingId}`);
    console.log('---');
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      return { success: false, error: 'Simulated delivery failure' };
    }
    
    return { 
      success: true, 
      messageId: `mock_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
  }
}

class MockSMSProvider implements SMSProvider {
  async send(params: any) {
    console.log('📱 MOCK SMS SENT:');
    console.log(`To: ${params.to}`);
    console.log(`Body: ${params.body}`);
    console.log(`From: ${params.from}`);
    console.log(`Tracking ID: ${params.trackingId}`);
    console.log('---');
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      return { success: false, error: 'Simulated delivery failure' };
    }
    
    return { 
      success: true, 
      messageId: `mock_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
  }
}

// Production providers (to be implemented)
class SendGridEmailProvider implements EmailProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async send(params: any) {
    try {
      // In production, implement SendGrid integration
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);
      
      const msg = {
        to: params.to,
        from: params.from,
        subject: params.subject,
        html: params.html,
        customArgs: {
          trackingId: params.trackingId
        }
      };
      
      const response = await sgMail.send(msg);
      return { 
        success: true, 
        messageId: response[0].headers['x-message-id'] 
      };
      */
      
      // For now, fall back to mock
      return new MockEmailProvider().send(params);
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  
  constructor(accountSid: string, authToken: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
  }
  
  async send(params: any) {
    try {
      // In production, implement Twilio integration
      /*
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      const message = await client.messages.create({
        body: params.body,
        from: params.from,
        to: params.to,
        statusCallback: `${process.env.BASE_URL}/api/webhooks/sms-status?trackingId=${params.trackingId}`
      });
      
      return { 
        success: true, 
        messageId: message.sid 
      };
      */
      
      // For now, fall back to mock
      return new MockSMSProvider().send(params);
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export async function sendQueuedMessages(options: {
  maxMessages?: number;
  dryRun?: boolean;
  priorityOnly?: boolean;
} = {}): Promise<MessageSendResult> {
  try {
    const { maxMessages = 100, dryRun = false, priorityOnly = false } = options;
    
    console.log(`📤 Starting queued message sending (${dryRun ? 'DRY RUN' : 'LIVE'})...`);
    
    // Get pending messages
    const pendingMessages = await getPendingMessages(maxMessages, priorityOnly);
    console.log(`📋 Found ${pendingMessages.length} pending messages`);
    
    if (pendingMessages.length === 0) {
      return createEmptyResult();
    }
    
    // Initialize providers
    const emailProvider = getEmailProvider();
    const smsProvider = getSMSProvider();
    
    let messagesSent = 0;
    let messagesFailed = 0;
    let emailsSent = 0;
    let smsSent = 0;
    const errors: string[] = [];
    let rateLimited = false;
    
    for (const message of pendingMessages) {
      try {
        // Check rate limiting
        if (await isRateLimited()) {
          rateLimited = true;
          console.log('⚠️ Rate limit reached, stopping send');
          break;
        }
        
        let sendResult;
        
        if (message.type === 'email') {
          sendResult = await sendEmail(message, emailProvider, dryRun);
          if (sendResult.success) emailsSent++;
        } else {
          sendResult = await sendSMS(message, smsProvider, dryRun);
          if (sendResult.success) smsSent++;
        }
        
        if (sendResult.success) {
          messagesSent++;
          
          if (!dryRun) {
            await updateMessageStatus(message.id, 'sent', {
              sentAt: new Date(),
              messageId: sendResult.messageId,
              provider: message.type === 'email' ? 'sendgrid' : 'twilio'
            });
          }
          
        } else {
          messagesFailed++;
          errors.push(`${message.type} to ${message.recipient}: ${sendResult.error}`);
          
          if (!dryRun) {
            await updateMessageStatus(message.id, 'failed', {
              error: sendResult.error,
              failedAt: new Date()
            });
          }
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const errorMsg = `Error sending message ${message.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        messagesFailed++;
      }
    }
    
    const result: MessageSendResult = {
      messagesSent,
      messagesFailed,
      emailsSent,
      smsSent,
      errors,
      rateLimited
    };
    
    console.log(`✅ Send complete: ${messagesSent} sent, ${messagesFailed} failed`);
    
    return result;
    
  } catch (error) {
    console.error('Error sending queued messages:', error);
    throw error;
  }
}

async function getPendingMessages(maxMessages: number, priorityOnly: boolean): Promise<any[]> {
  try {
    const outreachRef = collection(db, 'outreachQueue');
    const now = new Date();
    
    let messagesQuery = query(
      outreachRef,
      where('status', '==', 'pending'),
      where('scheduledFor', '<=', now)
    );
    
    const snapshot = await getDocs(messagesQuery);
    let messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledFor: doc.data().scheduledFor?.toDate() || new Date()
    }));
    
    // Filter by priority if requested
    if (priorityOnly) {
      messages = messages.filter(msg => msg.priority === 'high');
    }
    
    // Sort by priority and scheduled time
    messages.sort((a, b) => {
      // High priority first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      
      // Then by scheduled time
      return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    });
    
    return messages.slice(0, maxMessages);
    
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    return [];
  }
}

async function sendEmail(
  message: any,
  emailProvider: EmailProvider,
  dryRun: boolean
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (dryRun) {
    console.log(`[DRY RUN] Would send email to ${message.recipient}: ${message.subject}`);
    return { success: true, messageId: 'dry_run_email' };
  }
  
  const emailParams = {
    to: message.recipient,
    from: process.env.OUTREACH_FROM_EMAIL || 'noreply@menshealthfinder.com',
    subject: message.subject,
    html: generateEmailHTML(message),
    trackingId: message.id
  };
  
  return await emailProvider.send(emailParams);
}

async function sendSMS(
  message: any,
  smsProvider: SMSProvider,
  dryRun: boolean
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (dryRun) {
    console.log(`[DRY RUN] Would send SMS to ${message.recipient}: ${message.body.substring(0, 50)}...`);
    return { success: true, messageId: 'dry_run_sms' };
  }
  
  const smsParams = {
    to: message.recipient,
    from: process.env.TWILIO_PHONE_NUMBER || '+15551234567',
    body: generateSMSBody(message),
    trackingId: message.id
  };
  
  return await smsProvider.send(smsParams);
}

function generateEmailHTML(message: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menshealthfinder.com';
  const trackingPixel = `${baseUrl}/api/track/email-open?id=${message.id}`;
  const ctaUrl = `${baseUrl}/upgrade?clinic=${message.clinicSlug}&utm_source=outreach&utm_campaign=${message.campaignType}&track=${message.id}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${message.subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
            .content { margin-bottom: 30px; }
            .cta-button { 
                display: inline-block; 
                background-color: #2563eb; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                margin: 20px 0;
            }
            .footer { 
                border-top: 1px solid #eee; 
                padding-top: 20px; 
                font-size: 12px; 
                color: #666; 
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Men's Health Finder</div>
            </div>
            
            <div class="content">
                ${message.body.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
                
                <div style="text-align: center;">
                    <a href="${ctaUrl}" class="cta-button">${message.cta}</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${message.recipient} because you have a listing with Men's Health Finder.</p>
                <p>
                    <a href="${baseUrl}/unsubscribe?clinic=${message.clinicSlug}&track=${message.id}">Unsubscribe</a> | 
                    <a href="${baseUrl}/manage-preferences?clinic=${message.clinicSlug}">Manage Preferences</a>
                </p>
                <p>Men's Health Finder<br>© ${new Date().getFullYear()} All rights reserved</p>
            </div>
        </div>
        
        <!-- Tracking pixel -->
        <img src="${trackingPixel}" width="1" height="1" style="display: none;" />
    </body>
    </html>
  `;
}

function generateSMSBody(message: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menshealthfinder.com';
  const shortUrl = `${baseUrl}/u/${message.id}`; // Short URL that redirects and tracks
  
  // SMS has character limits, so create condensed version
  const condensedBody = message.body
    .replace(/\n\n/g, '\n')
    .substring(0, 100) + '...';
  
  return `${condensedBody}\n\n${message.cta}: ${shortUrl}\n\nReply STOP to opt out`;
}

async function updateMessageStatus(
  messageId: string,
  status: string,
  updates: Record<string, any>
): Promise<void> {
  try {
    const messageRef = doc(db, 'outreachQueue', messageId);
    await updateDoc(messageRef, {
      status,
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating message ${messageId}:`, error);
  }
}

async function isRateLimited(): Promise<boolean> {
  // Check against provider rate limits
  // For SendGrid: 600 emails/minute
  // For Twilio: 1 SMS/second per phone number
  
  // Simple implementation: check messages sent in last minute
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const outreachRef = collection(db, 'outreachQueue');
    const recentQuery = query(
      outreachRef,
      where('sentAt', '>', oneMinuteAgo),
      where('status', '==', 'sent')
    );
    
    const snapshot = await getDocs(recentQuery);
    
    // Conservative limit: 10 messages per minute
    return snapshot.size >= 10;
    
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }
}

function getEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV === 'development') {
    return new MockEmailProvider();
  }
  
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    return new SendGridEmailProvider(apiKey);
  }
  
  console.warn('No SendGrid API key found, using mock provider');
  return new MockEmailProvider();
}

function getSMSProvider(): SMSProvider {
  if (process.env.NODE_ENV === 'development') {
    return new MockSMSProvider();
  }
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid && authToken) {
    return new TwilioSMSProvider(accountSid, authToken);
  }
  
  console.warn('No Twilio credentials found, using mock provider');
  return new MockSMSProvider();
}

function createEmptyResult(): MessageSendResult {
  return {
    messagesSent: 0,
    messagesFailed: 0,
    emailsSent: 0,
    smsSent: 0,
    errors: [],
    rateLimited: false
  };
}

// CLI interface
export async function runMessageSender(options: {
  maxMessages?: number;
  dryRun?: boolean;
  priorityOnly?: boolean;
} = {}): Promise<void> {
  console.log('📤 Message Sender Starting...');
  console.log('Options:', options);
  
  const result = await sendQueuedMessages(options);
  
  console.log('\n📊 Results:');
  console.log(`Messages Sent: ${result.messagesSent}`);
  console.log(`Messages Failed: ${result.messagesFailed}`);
  console.log(`Emails Sent: ${result.emailsSent}`);
  console.log(`SMS Sent: ${result.smsSent}`);
  console.log(`Rate Limited: ${result.rateLimited}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
}