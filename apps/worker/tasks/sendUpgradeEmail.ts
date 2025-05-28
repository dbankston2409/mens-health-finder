import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface UpgradeEmailData {
  clinicName: string;
  contactEmail: string;
  currentTier: string;
  suggestedTier: string;
  clicks30d: number;
  calls30d: number;
  revenueOpportunity: number;
  engagementLevel: string;
}

export interface UpgradeEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
  sentAt: Date;
}

export async function sendUpgradeEmail(clinicSlug: string): Promise<UpgradeEmailResult> {
  try {
    // Get clinic data
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      throw new Error(`Clinic ${clinicSlug} not found`);
    }
    
    const clinic = clinicDoc.data();
    
    // Prepare email data
    const emailData: UpgradeEmailData = {
      clinicName: clinic.name || 'Your Clinic',
      contactEmail: clinic.contactEmail || clinic.email,
      currentTier: clinic.package || 'free',
      suggestedTier: determineSuggestedTier(clinic),
      clicks30d: clinic.traffic?.clicks30d || 0,
      calls30d: clinic.traffic?.calls30d || 0,
      revenueOpportunity: calculateUpgradeValue(clinic),
      engagementLevel: clinic.engagement?.level || 'none'
    };
    
    if (!emailData.contactEmail) {
      throw new Error('No contact email found for clinic');
    }
    
    // Send email (mock during development)
    const emailResult = await sendEmailViaProvider(emailData);
    
    // Log the email sent
    await updateDoc(clinicRef, {
      'communications.emails': arrayUnion({
        type: 'upgrade_offer',
        sentAt: new Date(),
        emailId: emailResult.emailId,
        recipient: emailData.contactEmail,
        template: 'upgrade_offer_v1',
        data: {
          currentTier: emailData.currentTier,
          suggestedTier: emailData.suggestedTier,
          revenueOpportunity: emailData.revenueOpportunity
        }
      }),
      'sales.lastUpgradeEmailSent': new Date(),
      'sales.upgradeEmailCount': (clinic.sales?.upgradeEmailCount || 0) + 1
    });
    
    console.log(`Upgrade email sent to ${emailData.contactEmail} for clinic ${clinicSlug}`);
    
    return {
      success: true,
      emailId: emailResult.emailId,
      sentAt: new Date()
    };
    
  } catch (error) {
    console.error(`Error sending upgrade email for ${clinicSlug}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sentAt: new Date()
    };
  }
}

async function sendEmailViaProvider(emailData: UpgradeEmailData): Promise<{ emailId: string }> {
  // In development, mock the email sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 MOCK EMAIL SENT:');
    console.log('To:', emailData.contactEmail);
    console.log('Subject:', `Upgrade Your ${emailData.clinicName} Listing - Unlock More Patients`);
    console.log('Template:', generateEmailTemplate(emailData));
    
    return {
      emailId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  // In production, use SendGrid or similar
  try {
    // Example SendGrid implementation:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: emailData.contactEmail,
      from: 'noreply@menshealthfinder.com',
      templateId: 'd-upgrade-offer-template-id',
      dynamicTemplateData: emailData
    };
    
    const response = await sgMail.send(msg);
    return { emailId: response[0].headers['x-message-id'] };
    */
    
    // For now, return mock ID
    return { emailId: `prod_${Date.now()}` };
    
  } catch (error) {
    throw new Error(`Email provider error: ${error}`);
  }
}

function determineSuggestedTier(clinic: any): string {
  const clicks = clinic.traffic?.clicks30d || 0;
  const calls = clinic.traffic?.calls30d || 0;
  const currentTier = clinic.package || 'free';
  
  const totalActivity = clicks + (calls * 5); // Weight calls more heavily
  
  if (totalActivity >= 200 && currentTier !== 'enterprise') {
    return 'enterprise';
  } else if (totalActivity >= 75 && !['premium', 'enterprise'].includes(currentTier)) {
    return 'premium';
  } else if (totalActivity >= 25 && !['basic', 'premium', 'enterprise'].includes(currentTier)) {
    return 'basic';
  }
  
  return currentTier;
}

function calculateUpgradeValue(clinic: any): number {
  const clicks = clinic.traffic?.clicks30d || 0;
  const calls = clinic.traffic?.calls30d || 0;
  
  // Estimate patient value from activity
  const avgPatientValue = 200;
  const clickConversionRate = 0.02;
  const callConversionRate = 0.20;
  
  const monthlyPatients = (clicks * clickConversionRate) + (calls * callConversionRate);
  const monthlyRevenue = monthlyPatients * avgPatientValue;
  
  // Suggest upgrade price based on value generated
  if (monthlyRevenue >= 5000) return 599; // Enterprise
  if (monthlyRevenue >= 2000) return 299; // Premium
  if (monthlyRevenue >= 500) return 99;   // Basic
  
  return 0;
}

function generateEmailTemplate(data: UpgradeEmailData): string {
  return `
🏥 ${data.clinicName} - Upgrade Your Listing to Reach More Patients

Hi there,

Great news! Your clinic listing is performing well:
• ${data.clicks30d} clicks in the last 30 days
• ${data.calls30d} phone calls from potential patients
• ${data.engagementLevel} engagement level

Based on your activity, you could benefit from our ${data.suggestedTier.toUpperCase()} plan.

With ${data.revenueOpportunity > 0 ? `an estimated $${data.revenueOpportunity}/month` : 'increased visibility'}, 
upgrading could help you:
✓ Get priority placement in search results
✓ Track all phone calls and form submissions
✓ Access detailed analytics and reports
✓ Stand out with premium badges and features

Ready to grow your practice?
👉 Book a demo: https://menshealthfinder.com/upgrade
👉 View plans: https://menshealthfinder.com/pricing

Questions? Reply to this email or call (555) 123-4567

Best regards,
The Men's Health Finder Team
`;
}

export async function sendBulkUpgradeEmails(clinicSlugs: string[]): Promise<UpgradeEmailResult[]> {
  const results: UpgradeEmailResult[] = [];
  
  for (const slug of clinicSlugs) {
    try {
      const result = await sendUpgradeEmail(slug);
      results.push(result);
      
      // Rate limiting - wait 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date()
      });
    }
  }
  
  return results;
}