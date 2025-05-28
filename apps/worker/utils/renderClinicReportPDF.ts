import puppeteer from 'puppeteer';
import { ClinicReportData } from './generateClinicReportData';

interface PDFOptions {
  theme?: 'light' | 'dark';
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  includeCharts?: boolean;
  brandingEnabled?: boolean;
}

interface PDFResult {
  buffer: Buffer;
  filename: string;
  size: number;
}

export async function renderClinicReportPDF(
  reportData: ClinicReportData,
  options: PDFOptions = {}
): Promise<PDFResult> {
  console.log(`📄 Rendering PDF report for ${reportData.clinicName}`);
  
  const {
    theme = 'light',
    format = 'A4',
    orientation = 'portrait',
    includeCharts = true,
    brandingEnabled = true
  } = options;
  
  try {
    // Generate HTML content
    const htmlContent = generateReportHTML(reportData, theme, includeCharts, brandingEnabled);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for any dynamic content to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: format as any,
      landscape: orientation === 'landscape',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: generateHeaderTemplate(reportData, brandingEnabled),
      footerTemplate: generateFooterTemplate(reportData, brandingEnabled)
    });
    
    await browser.close();
    
    const filename = generateFilename(reportData);
    
    console.log(`✅ PDF generated successfully: ${filename} (${pdfBuffer.length} bytes)`);
    
    return {
      buffer: pdfBuffer,
      filename,
      size: pdfBuffer.length
    };
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
}

function generateReportHTML(
  reportData: ClinicReportData,
  theme: string,
  includeCharts: boolean,
  brandingEnabled: boolean
): string {
  const themeColors = getThemeColors(theme);
  const period = formatPeriod(reportData.reportPeriod);
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${reportData.clinicName} - ${period} Report</title>
      <style>
        ${getReportCSS(themeColors)}
      </style>
      ${includeCharts ? getChartLibraryScript() : ''}
    </head>
    <body>
      <div class="report-container">
        <!-- Header Section -->
        <header class="report-header">
          ${brandingEnabled ? getBrandingSection() : ''}
          <div class="clinic-info">
            <h1>${reportData.clinicName}</h1>
            <h2>${period} Performance Report</h2>
            <p class="report-date">Generated on ${formatDate(reportData.generatedAt)}</p>
          </div>
        </header>
        
        <!-- Executive Summary -->
        <section class="executive-summary">
          <h2>Executive Summary</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Traffic</h3>
              <div class="metric-value">${reportData.traffic.uniqueVisitors.toLocaleString()}</div>
              <div class="metric-label">Unique Visitors</div>
              <div class="metric-change ${getChangeClass(reportData.traffic.previousPeriodComparison.visitorsChange)}">
                ${formatChange(reportData.traffic.previousPeriodComparison.visitorsChange)}
              </div>
            </div>
            
            <div class="summary-card">
              <h3>Engagement</h3>
              <div class="metric-value">${reportData.engagement.totalCalls}</div>
              <div class="metric-label">Total Calls</div>
              <div class="metric-change ${getChangeClass(reportData.engagement.previousPeriodComparison.callsChange)}">
                ${formatChange(reportData.engagement.previousPeriodComparison.callsChange)}
              </div>
            </div>
            
            <div class="summary-card">
              <h3>Leads</h3>
              <div class="metric-value">${reportData.leads.totalLeads}</div>
              <div class="metric-label">New Leads</div>
              <div class="metric-change ${getChangeClass(reportData.leads.previousPeriodComparison.leadsChange)}">
                ${formatChange(reportData.leads.previousPeriodComparison.leadsChange)}
              </div>
            </div>
            
            <div class="summary-card">
              <h3>SEO Score</h3>
              <div class="metric-value">${reportData.seoPerformance.currentScore}/100</div>
              <div class="metric-label">Current Score</div>
              <div class="metric-change ${getChangeClass(reportData.seoPerformance.previousPeriodComparison.scoreChange)}">
                ${formatChange(reportData.seoPerformance.previousPeriodComparison.scoreChange)}
              </div>
            </div>
          </div>
        </section>
        
        <!-- Traffic Analysis -->
        <section class="traffic-section">
          <h2>Website Traffic Analysis</h2>
          <div class="section-grid">
            <div class="metric-details">
              <h3>Traffic Overview</h3>
              <table class="data-table">
                <tr>
                  <td>Page Views</td>
                  <td>${reportData.traffic.pageViews.toLocaleString()}</td>
                  <td class="${getChangeClass(reportData.traffic.previousPeriodComparison.pageViewsChange)}">
                    ${formatChange(reportData.traffic.previousPeriodComparison.pageViewsChange)}
                  </td>
                </tr>
                <tr>
                  <td>Avg. Session Duration</td>
                  <td>${formatDuration(reportData.traffic.avgSessionDuration)}</td>
                  <td class="${getChangeClass(reportData.traffic.previousPeriodComparison.durationChange)}">
                    ${formatChange(reportData.traffic.previousPeriodComparison.durationChange)}
                  </td>
                </tr>
                <tr>
                  <td>Bounce Rate</td>
                  <td>${reportData.traffic.bounceRate.toFixed(1)}%</td>
                  <td>-</td>
                </tr>
              </table>
            </div>
            
            <div class="chart-container">
              <h3>Top Pages</h3>
              <div class="top-pages">
                ${reportData.traffic.topPages.map(page => `
                  <div class="page-row">
                    <span class="page-path">${page.path}</span>
                    <span class="page-views">${page.views} views</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
        
        <!-- Engagement Section -->
        <section class="engagement-section">
          <h2>User Engagement</h2>
          <div class="section-grid">
            <div class="metric-details">
              <h3>Contact Actions</h3>
              <table class="data-table">
                <tr>
                  <td>Phone Calls</td>
                  <td>${reportData.engagement.totalCalls}</td>
                  <td class="${getChangeClass(reportData.engagement.previousPeriodComparison.callsChange)}">
                    ${formatChange(reportData.engagement.previousPeriodComparison.callsChange)}
                  </td>
                </tr>
                <tr>
                  <td>Website Clicks</td>
                  <td>${reportData.engagement.websiteClicks}</td>
                  <td class="${getChangeClass(reportData.engagement.previousPeriodComparison.clicksChange)}">
                    ${formatChange(reportData.engagement.previousPeriodComparison.clicksChange)}
                  </td>
                </tr>
                <tr>
                  <td>Call Conversion Rate</td>
                  <td>${reportData.engagement.callConversionRate.toFixed(1)}%</td>
                  <td>-</td>
                </tr>
              </table>
            </div>
            
            <div class="chart-container">
              <h3>Peak Call Hours</h3>
              <div class="peak-hours">
                ${reportData.engagement.peakHours.map(hour => `
                  <div class="hour-row">
                    <span class="hour-time">${formatHour(hour.hour)}</span>
                    <span class="hour-calls">${hour.calls} calls</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
        
        <!-- Leads and Reviews -->
        <section class="leads-section">
          <h2>Lead Generation & Reviews</h2>
          <div class="section-grid">
            <div class="metric-details">
              <h3>Lead Metrics</h3>
              <table class="data-table">
                <tr>
                  <td>Total Leads</td>
                  <td>${reportData.leads.totalLeads}</td>
                  <td class="${getChangeClass(reportData.leads.previousPeriodComparison.leadsChange)}">
                    ${formatChange(reportData.leads.previousPeriodComparison.leadsChange)}
                  </td>
                </tr>
                <tr>
                  <td>Review Invites Sent</td>
                  <td>${reportData.leads.reviewInvitesSent}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Reviews Collected</td>
                  <td>${reportData.leads.reviewsCollected}</td>
                  <td class="${getChangeClass(reportData.leads.previousPeriodComparison.reviewsChange)}">
                    ${formatChange(reportData.leads.previousPeriodComparison.reviewsChange)}
                  </td>
                </tr>
              </table>
            </div>
            
            <div class="chart-container">
              <h3>Conversion Funnel</h3>
              <div class="funnel">
                <div class="funnel-step">
                  <span class="funnel-label">Visits</span>
                  <span class="funnel-value">${reportData.leads.conversionFunnel.visits.toLocaleString()}</span>
                </div>
                <div class="funnel-step">
                  <span class="funnel-label">Profile Views</span>
                  <span class="funnel-value">${reportData.leads.conversionFunnel.profileViews.toLocaleString()}</span>
                </div>
                <div class="funnel-step">
                  <span class="funnel-label">Contact Actions</span>
                  <span class="funnel-value">${reportData.leads.conversionFunnel.contactActions.toLocaleString()}</span>
                </div>
                <div class="funnel-step">
                  <span class="funnel-label">Leads</span>
                  <span class="funnel-value">${reportData.leads.conversionFunnel.leads.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- SEO Performance -->
        <section class="seo-section">
          <h2>SEO Performance</h2>
          <div class="section-grid">
            <div class="metric-details">
              <h3>SEO Metrics</h3>
              <table class="data-table">
                <tr>
                  <td>SEO Score</td>
                  <td>${reportData.seoPerformance.currentScore}/100</td>
                  <td class="${getChangeClass(reportData.seoPerformance.previousPeriodComparison.scoreChange)}">
                    ${formatChange(reportData.seoPerformance.previousPeriodComparison.scoreChange)}
                  </td>
                </tr>
                <tr>
                  <td>Indexed Pages</td>
                  <td>${reportData.seoPerformance.indexedPages}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Search Visibility</td>
                  <td>${reportData.seoPerformance.searchVisibility.toFixed(1)}%</td>
                  <td>-</td>
                </tr>
              </table>
            </div>
            
            <div class="chart-container">
              <h3>Keyword Rankings</h3>
              <div class="keywords">
                ${reportData.seoPerformance.keywordRankings.map(keyword => `
                  <div class="keyword-row">
                    <span class="keyword-term">${keyword.keyword}</span>
                    <span class="keyword-position">#${keyword.position}</span>
                    <span class="keyword-change ${getChangeClass(keyword.change * -1)}">
                      ${keyword.change > 0 ? '+' : ''}${keyword.change}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
        
        <!-- Business Metrics -->
        <section class="business-section">
          <h2>Business Health</h2>
          <div class="business-grid">
            <div class="business-card">
              <h3>Account Tier</h3>
              <div class="tier-badge tier-${reportData.businessMetrics.tier}">
                ${reportData.businessMetrics.tier.toUpperCase()}
              </div>
            </div>
            
            <div class="business-card">
              <h3>Account Health</h3>
              <div class="health-indicator health-${reportData.businessMetrics.accountHealth}">
                ${reportData.businessMetrics.accountHealth.replace('-', ' ').toUpperCase()}
              </div>
            </div>
            
            <div class="business-card">
              <h3>Profile Completion</h3>
              <div class="completion-score">
                ${reportData.businessMetrics.completionScore}%
              </div>
            </div>
            
            <div class="business-card">
              <h3>Achievements</h3>
              <div class="badges">
                ${reportData.businessMetrics.badges.length > 0 
                  ? reportData.businessMetrics.badges.map(badge => `<span class="badge">${badge.name}</span>`).join('')
                  : '<span class="no-badges">No badges earned yet</span>'
                }
              </div>
            </div>
          </div>
        </section>
        
        <!-- Recommendations -->
        <section class="recommendations-section">
          <h2>Recommended Actions</h2>
          <div class="recommendations">
            ${reportData.recommendations.map(rec => `
              <div class="recommendation-card priority-${rec.priority}">
                <div class="rec-header">
                  <h3>${rec.title}</h3>
                  <span class="rec-priority">${rec.priority.toUpperCase()} PRIORITY</span>
                </div>
                <p class="rec-description">${rec.description}</p>
                <div class="rec-impact">
                  <strong>Estimated Impact:</strong> ${rec.estimatedImpact}
                </div>
              </div>
            `).join('')}
          </div>
        </section>
        
        <!-- Footer -->
        <footer class="report-footer">
          <p>This report was generated automatically by Men's Health Finder on ${formatDate(reportData.generatedAt)}.</p>
          ${brandingEnabled ? '<p>For questions about your data or to upgrade your plan, visit <strong>menshealth-finder.com</strong></p>' : ''}
        </footer>
      </div>
    </body>
    </html>
  `;
}

function getThemeColors(theme: string) {
  return theme === 'dark' ? {
    background: '#1a1a1a',
    cardBackground: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#404040',
    primary: '#ff3b3b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  } : {
    background: '#ffffff',
    cardBackground: '#f8f9fa',
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    primary: '#ff3b3b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };
}

function getReportCSS(colors: any): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${colors.background};
      color: ${colors.text};
      line-height: 1.6;
      font-size: 14px;
    }
    
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .report-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${colors.border};
    }
    
    .clinic-info h1 {
      font-size: 28px;
      color: ${colors.primary};
      margin-bottom: 8px;
    }
    
    .clinic-info h2 {
      font-size: 20px;
      color: ${colors.textSecondary};
      margin-bottom: 8px;
    }
    
    .report-date {
      color: ${colors.textSecondary};
      font-size: 12px;
    }
    
    section {
      margin-bottom: 40px;
      background: ${colors.cardBackground};
      padding: 20px;
      border-radius: 8px;
      border: 1px solid ${colors.border};
    }
    
    section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: ${colors.primary};
      border-bottom: 1px solid ${colors.border};
      padding-bottom: 8px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
    }
    
    .summary-card {
      background: ${colors.background};
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid ${colors.border};
    }
    
    .summary-card h3 {
      font-size: 14px;
      color: ${colors.textSecondary};
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: ${colors.text};
      margin-bottom: 4px;
    }
    
    .metric-label {
      font-size: 12px;
      color: ${colors.textSecondary};
      margin-bottom: 8px;
    }
    
    .metric-change {
      font-size: 12px;
      font-weight: bold;
    }
    
    .metric-change.positive {
      color: ${colors.success};
    }
    
    .metric-change.negative {
      color: ${colors.danger};
    }
    
    .metric-change.neutral {
      color: ${colors.textSecondary};
    }
    
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table td {
      padding: 12px 8px;
      border-bottom: 1px solid ${colors.border};
    }
    
    .data-table td:first-child {
      color: ${colors.textSecondary};
    }
    
    .data-table td:nth-child(2) {
      font-weight: bold;
      text-align: right;
    }
    
    .data-table td:last-child {
      text-align: right;
      font-weight: bold;
      font-size: 12px;
    }
    
    .chart-container h3 {
      margin-bottom: 16px;
      font-size: 16px;
    }
    
    .top-pages, .peak-hours, .keywords {
      space-y: 8px;
    }
    
    .page-row, .hour-row, .keyword-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid ${colors.border};
    }
    
    .funnel {
      space-y: 12px;
    }
    
    .funnel-step {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: ${colors.background};
      border-radius: 4px;
      border: 1px solid ${colors.border};
    }
    
    .business-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }
    
    .business-card {
      background: ${colors.background};
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid ${colors.border};
    }
    
    .tier-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12px;
    }
    
    .tier-premium {
      background: ${colors.primary};
      color: white;
    }
    
    .tier-basic {
      background: ${colors.warning};
      color: white;
    }
    
    .tier-free {
      background: ${colors.textSecondary};
      color: white;
    }
    
    .health-excellent {
      color: ${colors.success};
    }
    
    .health-good {
      color: ${colors.primary};
    }
    
    .health-needs-attention {
      color: ${colors.warning};
    }
    
    .health-at-risk {
      color: ${colors.danger};
    }
    
    .completion-score {
      font-size: 24px;
      font-weight: bold;
      color: ${colors.primary};
    }
    
    .badge {
      display: inline-block;
      background: ${colors.primary};
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      margin: 2px;
    }
    
    .recommendation-card {
      background: ${colors.background};
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 4px solid ${colors.primary};
    }
    
    .rec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .rec-priority {
      font-size: 10px;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      background: ${colors.textSecondary};
      color: white;
    }
    
    .priority-high .rec-priority {
      background: ${colors.danger};
    }
    
    .priority-medium .rec-priority {
      background: ${colors.warning};
    }
    
    .rec-description {
      margin-bottom: 12px;
      color: ${colors.textSecondary};
    }
    
    .rec-impact {
      font-size: 12px;
      color: ${colors.primary};
    }
    
    .report-footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid ${colors.border};
      color: ${colors.textSecondary};
      font-size: 12px;
    }
    
    @media print {
      body {
        font-size: 12px;
      }
      
      .report-container {
        max-width: 100%;
      }
      
      section {
        break-inside: avoid;
      }
    }
  `;
}

function getBrandingSection(): string {
  return `
    <div class="branding">
      <div style="font-size: 18px; font-weight: bold; color: #ff3b3b; margin-bottom: 8px;">
        Men's Health Finder
      </div>
      <div style="font-size: 12px; color: #666;">
        Performance Analytics Report
      </div>
    </div>
  `;
}

function getChartLibraryScript(): string {
  // In production, you might include Chart.js or similar
  return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  `;
}

function generateHeaderTemplate(reportData: ClinicReportData, brandingEnabled: boolean): string {
  return `
    <div style="font-size: 10px; color: #666; text-align: center; margin: 0 20px;">
      ${brandingEnabled ? 'Men\'s Health Finder - ' : ''}${reportData.clinicName} Report
    </div>
  `;
}

function generateFooterTemplate(reportData: ClinicReportData, brandingEnabled: boolean): string {
  return `
    <div style="font-size: 10px; color: #666; text-align: center; margin: 0 20px;">
      <span style="float: left;">Generated ${formatDate(reportData.generatedAt)}</span>
      <span style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      ${brandingEnabled ? '<div style="clear: both; margin-top: 4px;">menshealth-finder.com</div>' : ''}
    </div>
  `;
}

function generateFilename(reportData: ClinicReportData): string {
  const date = new Date(reportData.reportPeriod.endDate);
  const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const clinicSlug = reportData.clinicSlug.replace(/[^a-z0-9]/gi, '-');
  
  return `${clinicSlug}-${reportData.reportPeriod.type}-report-${monthYear}.pdf`;
}

function formatPeriod(period: any): string {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  
  if (period.type === 'monthly') {
    return `${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  }
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
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