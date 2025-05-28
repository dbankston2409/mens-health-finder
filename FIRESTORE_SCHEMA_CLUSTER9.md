# Firestore Schema - MHF Cluster 9: AI Outreach, Sales Automation & Follow-Up Tools

## New Collections

### Outreach Queue Collection
```typescript
// Collection: outreachQueue
interface OutreachMessage {
  id: string;
  clinicSlug: string;
  clinicName: string;
  type: 'email' | 'sms';
  channel: 'email' | 'sms';
  recipient: string; // email address or phone number
  subject: string;
  body: string;
  cta: string; // call-to-action text
  campaignType: 'upgrade' | 'feature_upsell' | 'retention' | 'reactivation' | 'new_feature';
  scheduledFor: Timestamp;
  status: 'pending' | 'sent' | 'failed' | 'responded';
  priority: 'normal' | 'high';
  
  // Sending details
  sentAt?: Timestamp;
  messageId?: string; // Provider message ID
  provider?: 'sendgrid' | 'twilio';
  error?: string;
  
  // Engagement tracking
  opened: boolean;
  openedAt?: Timestamp;
  clicked: boolean;
  clickedAt?: Timestamp;
  replied: boolean;
  repliedAt?: Timestamp;
  bounced: boolean;
  bouncedAt?: Timestamp;
  unsubscribed: boolean;
  unsubscribedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastEngagement?: Timestamp;
  lastEngagementType?: string;
  metadata: {
    tone: 'professional' | 'friendly' | 'urgent' | 'consultative';
    urgency: 'low' | 'medium' | 'high';
    personalizations: Record<string, string>;
  };
}
```

### Sales Leads Collection
```typescript
// Collection: salesLeads
interface SalesLead {
  id: string;
  clinicSlug: string;
  clinicName: string;
  originalMessageId?: string; // Link to outreach message
  campaignType?: string;
  incomingReply?: string;
  
  contactInfo: {
    email?: string;
    phone?: string;
    channel: 'email' | 'sms' | 'phone' | 'website';
  };
  
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'contacted' | 'qualified' | 'demo_scheduled' | 'proposal_sent' | 'closed_won' | 'closed_lost';
  source: 'outreach_auto_reply' | 'manual_entry' | 'website_form' | 'referral';
  
  assignedTo?: string;
  notes: string;
  followUpDate?: Timestamp;
  
  timeline: Array<{
    action: string;
    timestamp: Timestamp;
    by: string;
    notes?: string;
  }>;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastContactedAt?: Timestamp;
}
```

### Follow-Up Reminders Collection
```typescript
// Collection: followUpReminders
interface FollowUpReminder {
  id: string;
  clinicSlug: string;
  clinicName: string;
  type: 'manual' | 'automated' | 'sales_lead';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  title: string;
  description: string;
  dueDate: Timestamp;
  createdDate: Timestamp;
  
  assignedTo?: string;
  lastContactDate?: Timestamp;
  contactMethod?: string;
  tags: string[];
  
  isOverdue: boolean;
  daysPastDue?: number;
  
  completed: boolean;
  completedAt?: Timestamp;
  completedBy?: string;
  resolution?: string;
  
  snoozedUntil?: Timestamp;
  snoozeCount: number;
}
```

## Updated Collections

### Enhanced Clinic Document
```typescript
interface Clinic {
  // ... existing fields ...
  
  // Engagement tracking
  engagementEvents?: Array<{
    type: 'email_open' | 'email_click' | 'sms_click' | 'sms_reply' | 'unsubscribe' | 'bounce';
    messageId: string;
    timestamp: Timestamp;
    userAgent?: string;
    ipAddress?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    metadata?: Record<string, any>;
  }>;
  
  // Follow-up logs
  followUpLogs?: Array<{
    id: string;
    method: 'call' | 'email' | 'dm' | 'meeting' | 'other';
    notes: string;
    outcome: 'positive' | 'neutral' | 'negative' | 'no_response' | 'callback_requested';
    by: string;
    timestamp: Timestamp;
    resolved: boolean;
    nextAction?: string;
    reminderDate?: Timestamp;
  }>;
  
  // Outreach preferences
  outreachPreferences?: {
    emailOptOut: boolean;
    smsOptOut: boolean;
    preferredContactMethod: 'email' | 'phone' | 'none';
    lastOptOutDate?: Timestamp;
    doNotContact: boolean;
    reason?: string;
  };
  
  // Sales tracking
  sales?: {
    lastUpgradeInterest?: Timestamp;
    interestSource?: string;
    leadScore?: number; // 0-100
    salesStage?: string;
    lastSalesContact?: Timestamp;
    salesNotes?: string;
  };
}
```

### Settings Collection
```typescript
// Document: settings/outreachConfig
interface OutreachConfig {
  enabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  maxPerDay: number;
  
  sendingHours: {
    start: number; // 24-hour format
    end: number;
    timezone: string;
  };
  
  excludeWeekends: boolean;
  
  rateLimiting: {
    emailsPerHour: number;
    smsPerHour: number;
  };
  
  templates: {
    upgrade: {
      subject: string;
      enabled: boolean;
    };
    feature_upsell: {
      subject: string;
      enabled: boolean;
    };
    retention: {
      subject: string;
      enabled: boolean;
    };
    reactivation: {
      subject: string;
      enabled: boolean;
    };
    new_feature: {
      subject: string;
      enabled: boolean;
    };
  };
  
  targeting: {
    highTrafficThreshold: number;
    minEngagementScore: number;
    excludeRecentlyContacted: boolean;
    daysSinceLastContact: number;
    targetTiers: string[];
    excludeTags: string[];
  };
  
  autoReply: {
    enabled: boolean;
    escalationEnabled: boolean;
    salesNotificationEmail: string;
  };
  
  lastUpdated: Timestamp;
  updatedBy: string;
}

// Document: settings/autoReplyConfig
interface AutoReplyConfig {
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
```

## Query Patterns

### Outreach Queue Management
```typescript
// Get pending messages due for sending
const pendingMessages = await db.collection('outreachQueue')
  .where('status', '==', 'pending')
  .where('scheduledFor', '<=', new Date())
  .orderBy('priority', 'desc')
  .orderBy('scheduledFor', 'asc')
  .limit(100)
  .get();

// Get messages by campaign type
const upgradeMessages = await db.collection('outreachQueue')
  .where('campaignType', '==', 'upgrade')
  .where('sentAt', '>=', startDate)
  .get();

// Get engagement stats for a clinic
const clinicMessages = await db.collection('outreachQueue')
  .where('clinicSlug', '==', clinicSlug)
  .where('sentAt', '!=', null)
  .get();
```

### Sales Lead Management
```typescript
// Get new sales leads
const newLeads = await db.collection('salesLeads')
  .where('status', '==', 'new')
  .orderBy('priority', 'desc')
  .orderBy('createdAt', 'desc')
  .get();

// Get leads by source
const outreachLeads = await db.collection('salesLeads')
  .where('source', '==', 'outreach_auto_reply')
  .where('createdAt', '>=', startDate)
  .get();
```

### Follow-Up Reminders
```typescript
// Get overdue reminders
const overdueReminders = await db.collection('followUpReminders')
  .where('isOverdue', '==', true)
  .where('completed', '==', false)
  .orderBy('daysPastDue', 'desc')
  .get();

// Get reminders by priority
const urgentReminders = await db.collection('followUpReminders')
  .where('priority', '==', 'urgent')
  .where('completed', '==', false)
  .where('dueDate', '<=', new Date())
  .get();
```

### Engagement Analytics
```typescript
// Get email open rates by campaign
const emailStats = await db.collection('outreachQueue')
  .where('type', '==', 'email')
  .where('sentAt', '>=', startDate)
  .where('sentAt', '<=', endDate)
  .get();

// Get response rates
const responseStats = await db.collection('outreachQueue')
  .where('replied', '==', true)
  .where('sentAt', '>=', startDate)
  .get();
```

## Indexing Strategy

### Compound Indexes
```typescript
// Outreach queue management
['status', 'scheduledFor', 'priority']
['clinicSlug', 'sentAt', 'type']
['campaignType', 'sentAt', 'status']
['type', 'opened', 'sentAt']
['type', 'clicked', 'sentAt']

// Sales leads
['status', 'priority', 'createdAt']
['assignedTo', 'status', 'followUpDate']
['source', 'createdAt']
['clinicSlug', 'status']

// Follow-up reminders
['completed', 'dueDate', 'priority']
['assignedTo', 'completed', 'dueDate']
['isOverdue', 'daysPastDue']
['type', 'completed', 'dueDate']

// Engagement events
['clinicSlug', 'timestamp', 'type']
['type', 'timestamp']
```

## Webhook Endpoints

### SendGrid Event Webhook
```typescript
// POST /api/webhooks/sendgrid
// Handles: open, click, bounce, unsubscribe events
interface SendGridEvent {
  event: string;
  email: string;
  timestamp: number;
  sg_message_id: string;
  useragent?: string;
  ip?: string;
  url?: string;
  customArgs?: {
    trackingId: string;
  };
}
```

### Twilio Status Webhook
```typescript
// POST /api/webhooks/twilio
// Handles: delivered, failed, replied events
interface TwilioEvent {
  MessageSid: string;
  MessageStatus: string;
  Body?: string;
  From: string;
  To: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}
```

## Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Outreach queue - admin only
    match /outreachQueue/{messageId} {
      allow read, write: if isAdmin();
    }
    
    // Sales leads - admin/sales only
    match /salesLeads/{leadId} {
      allow read, write: if isAdmin() || isSalesUser();
    }
    
    // Follow-up reminders - admin only
    match /followUpReminders/{reminderId} {
      allow read, write: if isAdmin();
    }
    
    // Settings - admin only
    match /settings/outreachConfig {
      allow read, write: if isAdmin();
    }
    
    match /settings/autoReplyConfig {
      allow read, write: if isAdmin();
    }
  }
}
```

## Data Retention

- **Outreach Queue**: Keep sent messages for 2 years, pending messages indefinitely
- **Sales Leads**: Keep indefinitely for sales analytics and CRM
- **Follow-Up Reminders**: Archive completed reminders after 1 year
- **Engagement Events**: Keep for 2 years for analytics, then aggregate
- **Auto-Reply Logs**: Keep for 6 months for debugging and optimization

## Rate Limiting

### Email (SendGrid)
- 600 emails per minute
- 10,000 emails per hour
- Track via Redis or Firestore counters

### SMS (Twilio)
- 1 SMS per second per phone number
- 3,600 SMS per hour per account
- Implement queue-based rate limiting

## Monitoring & Alerts

### Key Metrics to Track
- Messages sent per day/hour
- Delivery rates by channel
- Open/click rates by campaign
- Response rates and sentiment
- Queue processing times
- API rate limit usage

### Alert Thresholds
- Queue backlog > 100 messages
- Delivery rate < 95%
- Response rate < 1%
- Rate limit usage > 80%
- Webhook processing failures