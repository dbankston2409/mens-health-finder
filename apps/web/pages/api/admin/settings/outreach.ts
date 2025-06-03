import type { NextApiRequest, NextApiResponse } from 'next';

// Mock outreach configuration
const defaultConfig = {
  enabled: false,
  emailEnabled: true,
  smsEnabled: false,
  maxPerDay: 100,
  sendingHours: {
    start: 9,
    end: 17,
    timezone: 'America/New_York'
  },
  excludeWeekends: true,
  rateLimiting: {
    emailsPerHour: 50,
    smsPerHour: 20
  },
  templates: {
    upgrade: {
      subject: '{clinic_name} - Unlock Premium Features & Boost Your Visibility',
      enabled: true
    },
    feature_upsell: {
      subject: 'New: Advanced Analytics for {clinic_name}',
      enabled: true
    },
    retention: {
      subject: '{clinic_name} - Your Monthly Performance Report',
      enabled: true
    },
    reactivation: {
      subject: 'We miss you at Men\'s Health Finder, {clinic_name}',
      enabled: false
    },
    new_feature: {
      subject: 'New Feature Alert for {clinic_name}',
      enabled: true
    }
  },
  targeting: {
    highTrafficThreshold: 100,
    minEngagementScore: 20,
    excludeRecentlyContacted: true,
    daysSinceLastContact: 30,
    targetTiers: ['free', 'basic'],
    excludeTags: ['do-not-contact', 'competitor']
  },
  autoReply: {
    enabled: true,
    escalationEnabled: true,
    salesNotificationEmail: 'sales@menshealthfinder.com'
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Simple authentication check (in production, verify admin status)
  // For now, we'll allow all requests in development

  if (req.method === 'GET') {
    // Return the configuration
    return res.status(200).json({
      success: true,
      config: defaultConfig
    });
  }

  if (req.method === 'POST') {
    // In a real implementation, this would save to Firestore
    const updatedConfig = req.body;
    
    console.log('Outreach settings updated:', updatedConfig);
    
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Settings saved successfully',
      config: updatedConfig
    });
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
}