import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export interface AutoReplyConfig {
  enabled: boolean;
  interestKeywords: string[];
  negativeKeywords: string[];
  replyTemplates: {
    sms: string;
    email: string;
  };
  escalationEnabled: boolean;
  salesNotificationEmail?: string;
}

export interface AutoReplyResult {
  success: boolean;
  replyType: 'sms' | 'email' | 'none';
  escalated: boolean;
  message?: string;
  error?: string;
}

export async function autoReplyToInterest(
  messageId: string,
  incomingMessage: string
): Promise<AutoReplyResult> {
  try {
    // Get the original outreach message
    const messageRef = doc(db, 'outreachQueue', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error(`Message ${messageId} not found`);
    }
    
    const originalMessage = messageDoc.data();
    
    // Get auto-reply configuration
    const config = await getAutoReplyConfig();
    
    if (!config.enabled) {
      return {
        success: false,
        replyType: 'none',
        escalated: false,
        message: 'Auto-reply disabled'
      };
    }
    
    // Analyze incoming message sentiment
    const sentiment = analyzeMessageSentiment(incomingMessage, config);
    
    if (sentiment === 'negative') {
      console.log(`❌ Negative sentiment detected in reply: "${incomingMessage}"`);
      return {
        success: false,
        replyType: 'none',
        escalated: false,
        message: 'Negative sentiment - no auto-reply sent'
      };
    }
    
    if (sentiment === 'neutral') {
      console.log(`😐 Neutral sentiment detected - no auto-reply triggered`);
      return {
        success: false,
        replyType: 'none',
        escalated: false,
        message: 'Neutral sentiment - no action taken'
      };
    }
    
    // Positive sentiment detected - send auto-reply
    console.log(`✅ Positive sentiment detected: "${incomingMessage}"`);
    
    const replyResult = await sendAutoReply(originalMessage, config);
    
    // Escalate to sales team if configured
    let escalated = false;
    if (config.escalationEnabled) {
      escalated = await escalateToSales(originalMessage, incomingMessage, config);
    }
    
    // Update original message status
    await updateDoc(messageRef, {
      status: 'responded',
      respondedAt: serverTimestamp(),
      autoReplyEnabled: true,
      autoReplySent: replyResult.success,
      escalated,
      sentiment: 'positive'
    });
    
    return {
      success: replyResult.success,
      replyType: replyResult.replyType,
      escalated,
      message: 'Auto-reply sent successfully'
    };
    
  } catch (error) {
    console.error('Error in auto-reply to interest:', error);
    return {
      success: false,
      replyType: 'none',
      escalated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function analyzeMessageSentiment(
  message: string,
  config: AutoReplyConfig
): 'positive' | 'negative' | 'neutral' {
  const lowerMessage = message.toLowerCase();
  
  // Check for negative keywords first
  const hasNegativeKeywords = config.negativeKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  if (hasNegativeKeywords) {
    return 'negative';
  }
  
  // Check for positive/interest keywords
  const hasInterestKeywords = config.interestKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  if (hasInterestKeywords) {
    return 'positive';
  }
  
  // Check for common positive patterns
  const positivePatterns = [
    /yes\b/i,
    /interested/i,
    /tell me more/i,
    /want to know/i,
    /sounds good/i,
    /let[''']s talk/i,
    /call me/i,
    /when can/i,
    /how much/i,
    /what[''']s the cost/i,
    /sign me up/i,
    /i[''']m in/i
  ];
  
  const hasPositivePattern = positivePatterns.some(pattern => pattern.test(message));
  
  if (hasPositivePattern) {
    return 'positive';
  }
  
  return 'neutral';
}

async function sendAutoReply(
  originalMessage: any,
  config: AutoReplyConfig
): Promise<{ success: boolean; replyType: 'sms' | 'email' | 'none' }> {
  try {
    const replyType = originalMessage.type; // Reply using same channel
    const template = config.replyTemplates[replyType as keyof typeof config.replyTemplates];
    
    if (!template) {
      return { success: false, replyType: 'none' };
    }
    
    const personalizedReply = personalizeReplyTemplate(template, originalMessage);
    
    if (replyType === 'sms') {
      return await sendAutoReplySMS(originalMessage.recipient, personalizedReply);
    } else {
      return await sendAutoReplyEmail(originalMessage.recipient, personalizedReply, originalMessage);
    }
    
  } catch (error) {
    console.error('Error sending auto-reply:', error);
    return { success: false, replyType: 'none' };
  }
}

async function sendAutoReplySMS(
  recipient: string,
  message: string
): Promise<{ success: boolean; replyType: 'sms' }> {
  try {
    // In development, mock the SMS sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 MOCK AUTO-REPLY SMS:');
      console.log(`To: ${recipient}`);
      console.log(`Message: ${message}`);
      return { success: true, replyType: 'sms' };
    }
    
    // In production, integrate with Twilio
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipient
    });
    */
    
    return { success: true, replyType: 'sms' };
    
  } catch (error) {
    console.error('Error sending auto-reply SMS:', error);
    return { success: false, replyType: 'sms' };
  }
}

async function sendAutoReplyEmail(
  recipient: string,
  message: string,
  originalMessage: any
): Promise<{ success: boolean; replyType: 'email' }> {
  try {
    const subject = `Re: ${originalMessage.subject}`;
    const htmlBody = generateAutoReplyEmailHTML(message, originalMessage);
    
    // In development, mock the email sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 MOCK AUTO-REPLY EMAIL:');
      console.log(`To: ${recipient}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${message}`);
      return { success: true, replyType: 'email' };
    }
    
    // In production, integrate with SendGrid
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: recipient,
      from: process.env.OUTREACH_FROM_EMAIL,
      subject,
      html: htmlBody
    });
    */
    
    return { success: true, replyType: 'email' };
    
  } catch (error) {
    console.error('Error sending auto-reply email:', error);
    return { success: false, replyType: 'email' };
  }
}

function personalizeReplyTemplate(template: string, originalMessage: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menshealthfinder.com';
  const upgradeUrl = `${baseUrl}/upgrade?clinic=${originalMessage.clinicSlug}&utm_source=auto_reply`;
  const demoUrl = `${baseUrl}/demo?clinic=${originalMessage.clinicSlug}&utm_source=auto_reply`;
  
  return template
    .replace(/\{clinic_name\}/g, originalMessage.clinicName || 'your clinic')
    .replace(/\{upgrade_url\}/g, upgradeUrl)
    .replace(/\{demo_url\}/g, demoUrl)
    .replace(/\{support_email\}/g, 'support@menshealthfinder.com')
    .replace(/\{support_phone\}/g, '(555) 123-4567');
}

function generateAutoReplyEmailHTML(message: string, originalMessage: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Thanks for your interest!</title>
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
                ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            
            <div class="footer">
                <p>This is an automated response. A team member will follow up with you soon.</p>
                <p>Men's Health Finder | © ${new Date().getFullYear()} All rights reserved</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

async function escalateToSales(
  originalMessage: any,
  incomingReply: string,
  config: AutoReplyConfig
): Promise<boolean> {
  try {
    if (!config.salesNotificationEmail) {
      console.log('No sales notification email configured');
      return false;
    }
    
    // Create sales lead record
    const salesLeadData = {
      clinicSlug: originalMessage.clinicSlug,
      clinicName: originalMessage.clinicName,
      originalMessageId: originalMessage.id,
      campaignType: originalMessage.campaignType,
      incomingReply,
      contactInfo: {
        email: originalMessage.recipient,
        channel: originalMessage.type
      },
      priority: 'high',
      status: 'new',
      source: 'outreach_auto_reply',
      createdAt: serverTimestamp(),
      assignedTo: null,
      notes: `Auto-escalated from outreach campaign. Original reply: "${incomingReply}"`
    };
    
    const salesLeadsRef = collection(db, 'salesLeads');
    const salesLeadDoc = await addDoc(salesLeadsRef, salesLeadData);
    
    // Send notification to sales team
    await sendSalesNotification(salesLeadData, config.salesNotificationEmail);
    
    console.log(`🎯 Escalated to sales: ${salesLeadDoc.id}`);
    
    return true;
    
  } catch (error) {
    console.error('Error escalating to sales:', error);
    return false;
  }
}

async function sendSalesNotification(
  salesLead: any,
  salesEmail: string
): Promise<void> {
  try {
    const subject = `🔥 Hot Lead: ${salesLead.clinicName} showed interest`;
    const body = `
      New hot lead from outreach campaign!
      
      Clinic: ${salesLead.clinicName}
      Campaign: ${salesLead.campaignType}
      Contact: ${salesLead.contactInfo.email}
      Channel: ${salesLead.contactInfo.channel}
      
      Their reply: "${salesLead.incomingReply}"
      
      Action required: Follow up within 24 hours for best conversion rates.
      
      View lead details: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/sales/leads/${salesLead.id}
    `;
    
    // In development, mock the notification
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 MOCK SALES NOTIFICATION:');
      console.log(`To: ${salesEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      return;
    }
    
    // In production, send via email provider
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: salesEmail,
      from: 'alerts@menshealthfinder.com',
      subject,
      text: body
    });
    */
    
  } catch (error) {
    console.error('Error sending sales notification:', error);
  }
}

async function getAutoReplyConfig(): Promise<AutoReplyConfig> {
  try {
    const configRef = doc(db, 'settings', 'autoReplyConfig');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      return configDoc.data() as AutoReplyConfig;
    }
    
    // Return default configuration
    return {
      enabled: true,
      interestKeywords: [
        'yes', 'interested', 'tell me more', 'info', 'information',
        'upgrade', 'demo', 'pricing', 'cost', 'how much',
        'sign up', 'sign me up', 'lets talk', 'call me',
        'want to know', 'sounds good', 'im in'
      ],
      negativeKeywords: [
        'no', 'not interested', 'stop', 'unsubscribe',
        'remove', 'dont contact', 'not now', 'maybe later',
        'never', 'spam', 'scam'
      ],
      replyTemplates: {
        sms: `Awesome! Thanks for your interest. Here's your upgrade link: {upgrade_url}
        
Questions? Call us at {support_phone} or email {support_email}
        
Reply STOP to opt out`,
        email: `Thanks for your interest in upgrading {clinic_name}!

We're excited to help you get more patients and grow your practice.

Next steps:
• View upgrade options: {upgrade_url}
• Schedule a demo: {demo_url}
• Call us directly: {support_phone}

Our team will also reach out within 24 hours to answer any questions and help you get started.

Best regards,
The Men's Health Finder Team`
      },
      escalationEnabled: true,
      salesNotificationEmail: 'sales@menshealthfinder.com'
    };
    
  } catch (error) {
    console.error('Error getting auto-reply config:', error);
    return {
      enabled: false,
      interestKeywords: [],
      negativeKeywords: [],
      replyTemplates: { sms: '', email: '' },
      escalationEnabled: false
    };
  }
}