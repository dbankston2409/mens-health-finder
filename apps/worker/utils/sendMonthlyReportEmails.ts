import admin from '../../../packages/firebase/init';
import { generateClinicReportData } from './generateClinicReportData';
import { renderClinicReportPDF } from './renderClinicReportPDF';

interface EmailProvider {
  sendEmail: (to: string, subject: string, html: string, attachments?: any[]) => Promise<void>;
}

// Mock email provider - replace with actual SendGrid, SES, etc.
class MockEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string, attachments: any[] = []): Promise<void> {
    console.log(`📧 [MOCK] Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachments: ${attachments.length}`);
    // In production, implement actual email sending
  }
}

interface SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(to: string, subject: string, html: string, attachments: any[] = []): Promise<void> {
    // Example SendGrid implementation
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.apiKey);

    const msg = {
      to,
      from: 'reports@menshealth-finder.com',
      subject,
      html,
      attachments
    };

    await sgMail.send(msg);
  }
}

export async function sendMonthlyReportEmails(): Promise<void> {
  console.log('📊 Starting monthly report email job...');
  
  const db = admin.firestore();
  const startTime = Date.now();
  
  // Initialize email provider
  const emailProvider = process.env.SENDGRID_API_KEY 
    ? new SendGridProvider(process.env.SENDGRID_API_KEY)
    : new MockEmailProvider();
  
  try {
    // Calculate last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    console.log(`📅 Generating reports for: ${lastMonth.toISOString().split('T')[0]} to ${endOfLastMonth.toISOString().split('T')[0]}`);
    
    // Get eligible clinics for monthly reports
    const eligibleClinics = await getEligibleClinics();
    console.log(`🏥 Found ${eligibleClinics.length} eligible clinics for monthly reports`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each clinic
    for (const clinic of eligibleClinics) {
      try {
        await processClinicReport(
          clinic,
          lastMonth,
          endOfLastMonth,
          emailProvider
        );
        successCount++;
        
        // Update clinic's last report timestamp
        await db.collection('clinics').doc(clinic.slug).update({
          lastReportAt: new Date(),
          lastReportMonth: `${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}`
        });
        
        console.log(`✅ Sent monthly report to ${clinic.name} (${clinic.adminEmails.join(', ')})`);
        
        // Add delay to respect email rate limits
        await delay(1000);
        
      } catch (error) {
        console.error(`❌ Failed to send report for ${clinic.name}:`, error);
        errorCount++;
        
        // Log error for later review
        await logEmailError(clinic.slug, error);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Monthly report email job completed in ${duration}ms`);
    console.log(`📈 Results: ${successCount} sent, ${errorCount} failed`);
    
    // Log summary to Firestore
    await logEmailSummary({
      jobType: 'monthly_reports',
      totalClinics: eligibleClinics.length,
      successCount,
      errorCount,
      duration,
      reportMonth: `${lastMonth.getFullYear()}-${lastMonth.getMonth() + 1}`,
      completedAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ Monthly report email job failed:', error);
    throw error;
  }
}

async function getEligibleClinics(): Promise<any[]> {
  const db = admin.firestore();
  
  // Get clinics that are eligible for monthly reports
  const clinicsSnapshot = await db
    .collection('clinics')
    .where('status', '==', 'active')
    .where('package', 'in', ['basic', 'premium']) // Only paid tiers
    .get();
  
  const eligibleClinics = [];
  
  for (const doc of clinicsSnapshot.docs) {
    const clinic = { id: doc.id, slug: doc.id, ...doc.data() };
    
    // Check if clinic has admin emails
    if (!clinic.adminEmails || clinic.adminEmails.length === 0) {
      console.warn(`⚠️  Skipping ${clinic.name} - no admin emails`);
      continue;
    }
    
    // Check if clinic has sufficient activity (at least 10 actions in last month)
    const activityCount = await getClinicActivityCount(clinic.slug);
    if (activityCount < 10) {
      console.warn(`⚠️  Skipping ${clinic.name} - insufficient activity (${activityCount} actions)`);
      continue;
    }
    
    // Check if we already sent this month's report
    const currentMonth = `${new Date().getFullYear()}-${new Date().getMonth()}`;
    if (clinic.lastReportMonth === currentMonth) {
      console.log(`ℹ️  Skipping ${clinic.name} - report already sent this month`);
      continue;
    }
    
    eligibleClinics.push(clinic);
  }
  
  return eligibleClinics;
}

async function getClinicActivityCount(clinicSlug: string): Promise<number> {
  const db = admin.firestore();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  // Count various activities
  const [
    profileViews,
    callLogs,
    websiteClicks,
    leads
  ] = await Promise.all([
    db.collection('clinics').doc(clinicSlug).collection('traffic_logs')
      .where('timestamp', '>=', lastMonth)
      .get(),
    db.collection('clinics').doc(clinicSlug).collection('engagement_logs')
      .where('type', '==', 'call')
      .where('timestamp', '>=', lastMonth)
      .get(),
    db.collection('clinics').doc(clinicSlug).collection('engagement_logs')
      .where('type', '==', 'website_click')
      .where('timestamp', '>=', lastMonth)
      .get(),
    db.collection('leads')
      .where('clinicSlug', '==', clinicSlug)
      .where('createdAt', '>=', lastMonth)
      .get()
  ]);
  
  return profileViews.size + callLogs.size + websiteClicks.size + leads.size;
}

async function processClinicReport(
  clinic: any,
  startDate: Date,
  endDate: Date,
  emailProvider: EmailProvider
): Promise<void> {
  
  // Generate report data
  const reportData = await generateClinicReportData(
    clinic.slug,
    startDate,
    endDate,
    'monthly'
  );
  
  // Render PDF
  const pdfResult = await renderClinicReportPDF(reportData, {
    theme: 'light',
    format: 'A4',
    includeCharts: true,
    brandingEnabled: true
  });
  
  // Generate email content
  const emailSubject = generateEmailSubject(reportData);
  const emailHTML = generateEmailHTML(reportData, clinic);
  
  // Prepare attachment
  const attachment = {
    content: pdfResult.buffer.toString('base64'),
    filename: pdfResult.filename,
    type: 'application/pdf',
    disposition: 'attachment'
  };
  
  // Send email to all admin emails
  for (const email of clinic.adminEmails) {
    await emailProvider.sendEmail(
      email,
      emailSubject,
      emailHTML,
      [attachment]
    );
  }
}

function generateEmailSubject(reportData: any): string {
  const period = new Date(reportData.reportPeriod.endDate).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const visitorsChange = reportData.traffic.previousPeriodComparison.visitorsChange;
  const trend = visitorsChange > 0 ? '📈' : visitorsChange < 0 ? '📉' : '📊';
  
  return `${trend} ${reportData.clinicName} - ${period} Performance Report`;
}

function generateEmailHTML(reportData: any, clinic: any): string {
  const period = new Date(reportData.reportPeriod.endDate).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const visitorsChange = reportData.traffic.previousPeriodComparison.visitorsChange;
  const callsChange = reportData.engagement.previousPeriodComparison.callsChange;
  const seoChange = reportData.seoPerformance.previousPeriodComparison.scoreChange;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Report - ${reportData.clinicName}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #ff3b3b, #e53935); 
          color: white; 
          padding: 30px 20px; 
          border-radius: 8px; 
          text-align: center; 
          margin-bottom: 30px;
        }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        .metric-card { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          text-align: center; 
          border-left: 4px solid #ff3b3b;
        }
        .metric-value { font-size: 24px; font-weight: bold; color: #ff3b3b; margin-bottom: 5px; }
        .metric-label { font-size: 14px; color: #666; margin-bottom: 8px; }
        .metric-change { font-size: 12px; font-weight: bold; }
        .metric-change.positive { color: #10b981; }
        .metric-change.negative { color: #ef4444; }
        .metric-change.neutral { color: #666; }
        .highlights { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .highlights h2 { margin-top: 0; color: #ff3b3b; }
        .highlights ul { margin: 0; padding-left: 20px; }
        .highlights li { margin-bottom: 8px; }
        .cta { 
          background: #ff3b3b; 
          color: white; 
          padding: 20px; 
          border-radius: 8px; 
          text-align: center; 
          margin-bottom: 30px;
        }
        .cta h2 { margin-top: 0; }
        .cta-button { 
          display: inline-block; 
          background: white; 
          color: #ff3b3b; 
          padding: 12px 24px; 
          border-radius: 6px; 
          text-decoration: none; 
          font-weight: bold; 
          margin-top: 15px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          border-top: 1px solid #e5e7eb; 
          color: #666; 
          font-size: 14px; 
        }
        .recommendations { background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .recommendations h3 { margin-top: 0; color: #d97706; }
        .recommendation { margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px; }
        .recommendation h4 { margin: 0 0 8px 0; color: #d97706; }
        .recommendation p { margin: 0; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportData.clinicName}</h1>
        <p>${period} Performance Report</p>
      </div>
      
      <div class="summary">
        <div class="metric-card">
          <div class="metric-value">${reportData.traffic.uniqueVisitors.toLocaleString()}</div>
          <div class="metric-label">Unique Visitors</div>
          <div class="metric-change ${getChangeClass(visitorsChange)}">
            ${formatChange(visitorsChange)} vs last month
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">${reportData.engagement.totalCalls}</div>
          <div class="metric-label">Phone Calls</div>
          <div class="metric-change ${getChangeClass(callsChange)}">
            ${formatChange(callsChange)} vs last month
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">${reportData.leads.totalLeads}</div>
          <div class="metric-label">New Leads</div>
          <div class="metric-change ${getChangeClass(reportData.leads.previousPeriodComparison.leadsChange)}">
            ${formatChange(reportData.leads.previousPeriodComparison.leadsChange)} vs last month
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">${reportData.seoPerformance.currentScore}/100</div>
          <div class="metric-label">SEO Score</div>
          <div class="metric-change ${getChangeClass(seoChange)}">
            ${formatChange(seoChange)} vs last month
          </div>
        </div>
      </div>
      
      <div class="highlights">
        <h2>📊 Key Highlights</h2>
        <ul>
          <li><strong>Traffic Growth:</strong> ${visitorsChange > 0 ? `Your clinic gained ${Math.abs(visitorsChange).toFixed(1)}% more visitors` : visitorsChange < 0 ? `Traffic decreased by ${Math.abs(visitorsChange).toFixed(1)}%` : 'Traffic remained stable'}</li>
          <li><strong>Engagement:</strong> ${reportData.engagement.callConversionRate.toFixed(1)}% of profile views resulted in phone calls</li>
          <li><strong>Reviews:</strong> Collected ${reportData.leads.reviewsCollected} new reviews from ${reportData.leads.reviewInvitesSent} invites sent</li>
          <li><strong>Peak Hours:</strong> Most calls received at ${formatPeakHour(reportData.engagement.peakHours[0])}</li>
        </ul>
      </div>
      
      ${reportData.recommendations.length > 0 ? `
      <div class="recommendations">
        <h3>🎯 Recommended Actions</h3>
        ${reportData.recommendations.slice(0, 3).map(rec => `
          <div class="recommendation">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
            <small><strong>Estimated Impact:</strong> ${rec.estimatedImpact}</small>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <div class="cta">
        <h2>🚀 Ready to Grow Further?</h2>
        <p>Your detailed ${period} report is attached as a PDF. Review the full analytics and implement our recommendations to boost your clinic's visibility and patient acquisition.</p>
        <a href="https://menshealth-finder.com/admin/dashboard" class="cta-button">View Dashboard</a>
      </div>
      
      <div class="footer">
        <p>This report was automatically generated by Men's Health Finder.<br>
        Questions? Reply to this email or visit our <a href="https://menshealth-finder.com/support">support center</a>.</p>
        <p style="margin-top: 15px;">
          <a href="https://menshealth-finder.com" style="color: #ff3b3b;">Men's Health Finder</a> | 
          <a href="https://menshealth-finder.com/privacy" style="color: #666;">Privacy Policy</a> | 
          <a href="mailto:support@menshealth-finder.com" style="color: #666;">Contact Support</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

function getChangeClass(change: number): string {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

function formatChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function formatPeakHour(hourData: any): string {
  if (!hourData) return 'N/A';
  const hour = hourData.hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logEmailError(clinicSlug: string, error: any): Promise<void> {
  const db = admin.firestore();
  
  await db.collection('emailErrors').add({
    clinicSlug,
    errorType: 'monthly_report',
    error: error.toString(),
    timestamp: new Date()
  });
}

async function logEmailSummary(summary: any): Promise<void> {
  const db = admin.firestore();
  
  await db.collection('emailJobs').add(summary);
}