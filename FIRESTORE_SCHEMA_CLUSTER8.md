# Firestore Schema - MHF Cluster 8: Lead Gen, Review Collection & Conversion Flow

## New Collections

### Leads Collection
```typescript
// Collection: leads
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  clinicSlug: string;
  clinicName: string;
  source: 'profile-cta' | 'directory-landing' | 'search-results' | 'emergency-banner';
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: Timestamp;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}
```

### Reviews Collection
```typescript
// Collection: reviews
interface Review {
  id: string;
  clinicSlug: string;
  clinicName: string;
  rating: number; // 1-5
  text: string;
  displayName: string;
  isAnonymous: boolean;
  email?: string; // For follow-up tracking
  phone?: string; // For follow-up tracking
  createdAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagReason?: string;
  moderatorNotes?: string;
  helpfulCount: number;
  reportCount: number;
  source: 'website' | 'email-invite' | 'sms-invite' | 'follow-up';
  verified: boolean;
  ipAddress: string;
  userAgent: string;
  inviteId?: string; // Link to review invite
  replies?: Array<{
    text: string;
    author: string;
    createdAt: Timestamp;
    isOfficial: boolean; // Clinic or admin reply
  }>;
}
```

### Lead Sessions Collection
```typescript
// Collection: leadSessions
interface LeadSession {
  id: string;
  sessionId: string;
  clinicSlug?: string;
  userId?: string;
  email?: string;
  phone?: string;
  path: string;
  referrer: string;
  userAgent: string;
  ipAddress: string;
  actions: Array<{
    action: string;
    timestamp: Timestamp;
    data?: Record<string, any>;
    elementId?: string;
    url?: string;
  }>;
  dwellTime: number; // seconds
  createdAt: Timestamp;
  lastActivity: Timestamp;
  converted: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserName: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}
```

### Contacts Collection
```typescript
// Collection: contacts
interface Contact {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
  clinicSlug: string;
  clinicName: string;
  firstSeen: Timestamp;
  lastInteraction: Timestamp;
  status: 'prospect' | 'active' | 'converted' | 'inactive';
  interactionCount: number;
  events: Array<{
    type: 'form_submission' | 'call_click' | 'review_submit' | 'email_open' | 'page_visit' | 'direction_click';
    timestamp: Timestamp;
    data?: Record<string, any>;
    source: string;
  }>;
  leadQuality: 'cold' | 'warm' | 'hot';
  tags: string[];
  notes?: string;
  source: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Review Invites Collection
```typescript
// Collection: reviewInvites
interface ReviewInvite {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  clinicSlug: string;
  clinicName: string;
  triggerType: 'call-click' | 'dwell-time' | 'form-submission' | 'manual';
  channel: 'email' | 'sms';
  status: 'sent' | 'clicked' | 'completed' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  clickedAt?: Timestamp;
  completedAt?: Timestamp;
  reviewId?: string; // Link to completed review
  sessionData?: Record<string, any>;
}
```

### Follow-ups Collection
```typescript
// Collection: followUps
interface FollowUp {
  id: string;
  leadId: string;
  clinicSlug: string;
  email?: string;
  phone?: string;
  name?: string;
  followUpType: 'review-request' | 'experience-check' | 'satisfaction-survey';
  channel: 'email' | 'sms';
  status: 'scheduled' | 'sent' | 'failed' | 'clicked' | 'completed';
  scheduledFor: Timestamp;
  createdAt: Timestamp;
  lastAttempt?: Timestamp;
  attempts: number;
  completed: boolean;
  clicked: boolean;
  replied: boolean;
  error?: string;
}
```

## Updated Clinic Document
```typescript
interface Clinic {
  // ... existing fields ...
  
  // Lead Analytics
  leadStats: {
    totalLeads: number;
    responseRate: number;
    reviews: number;
    avgReviewScore: number;
    lastLeadAt?: Timestamp;
    engagementScore: number; // 0-100
    lastUpdated: Timestamp;
    
    // Conversion funnel
    conversionFunnel: {
      leads: number;
      reviewInvitesSent: number;
      reviewsCompleted: number;
      contactsCreated: number;
    };
    
    // Response time metrics
    timeToResponse: {
      average: number; // hours
      median: number;
      fastest: number;
      slowest: number;
    };
    
    // Quality breakdown
    qualityMetrics: {
      hotLeads: number;
      warmLeads: number;
      coldLeads: number;
    };
    
    // Lead sources
    leadsBySource: Record<string, number>;
  };
}
```

## Query Patterns

### Lead Management
```typescript
// Get new leads for a clinic
const newLeads = await db.collection('leads')
  .where('clinicSlug', '==', clinicSlug)
  .where('status', '==', 'new')
  .orderBy('createdAt', 'desc')
  .get();

// Get leads by source
const profileLeads = await db.collection('leads')
  .where('source', '==', 'profile-cta')
  .where('createdAt', '>=', startDate)
  .get();
```

### Review Moderation
```typescript
// Get pending reviews
const pendingReviews = await db.collection('reviews')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .get();

// Get low-rated reviews
const lowRatedReviews = await db.collection('reviews')
  .where('rating', '<=', 3)
  .where('status', '==', 'approved')
  .get();
```

### Contact Tracking
```typescript
// Get hot leads for a clinic
const hotContacts = await db.collection('contacts')
  .where('clinicSlug', '==', clinicSlug)
  .where('leadQuality', '==', 'hot')
  .where('status', '==', 'active')
  .get();

// Get contacts needing follow-up
const staleContacts = await db.collection('contacts')
  .where('lastInteraction', '<', sevenDaysAgo)
  .where('status', '==', 'active')
  .get();
```

### Session Analytics
```typescript
// Get high-engagement sessions
const engagedSessions = await db.collection('leadSessions')
  .where('dwellTime', '>=', 45)
  .where('converted', '==', false)
  .get();

// Get sessions with call clicks
const callSessions = await db.collection('leadSessions')
  .where('actions', 'array-contains-any', ['clicked-call', 'phone-click'])
  .get();
```

### Follow-up Management
```typescript
// Get due follow-ups
const dueFollowUps = await db.collection('followUps')
  .where('status', '==', 'scheduled')
  .where('scheduledFor', '<=', now)
  .get();

// Get follow-up completion rate
const completedFollowUps = await db.collection('followUps')
  .where('clinicSlug', '==', clinicSlug)
  .where('completed', '==', true)
  .get();
```

## Indexing Strategy

### Compound Indexes
```typescript
// Lead management
['clinicSlug', 'status', 'createdAt']
['source', 'createdAt', 'status']

// Review moderation
['status', 'createdAt']
['rating', 'status', 'createdAt']
['clinicSlug', 'status', 'createdAt']

// Contact tracking
['clinicSlug', 'leadQuality', 'status']
['clinicSlug', 'lastInteraction', 'status']
['email', 'clinicSlug']
['phone', 'clinicSlug']

// Session analytics
['clinicSlug', 'dwellTime', 'converted']
['sessionId', 'createdAt']
['converted', 'createdAt']

// Follow-ups
['status', 'scheduledFor']
['leadId', 'createdAt']
['clinicSlug', 'completed']
```

## Data Flow

### Lead Capture Flow
1. User submits form → `leads` collection
2. Session tracking → `leadSessions` collection
3. 2+ interactions → Convert to `contacts` collection
4. Trigger review invite → `reviewInvites` collection
5. Schedule follow-up → `followUps` collection

### Review Collection Flow
1. Review invite sent → `reviewInvites` status: 'sent'
2. User clicks link → `reviewInvites` status: 'clicked'
3. Review submitted → `reviews` collection, `reviewInvites` status: 'completed'
4. Admin moderation → `reviews` status: 'approved/rejected'

### Analytics Aggregation
1. Worker processes new leads/reviews/sessions
2. Calculates metrics via `generateLeadInsights`
3. Updates `clinic.leadStats` with aggregated data
4. Provides real-time dashboard data

## Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leads - public write for forms, admin read
    match /leads/{leadId} {
      allow create: if true; // Public form submission
      allow read, update, delete: if isAdmin();
    }
    
    // Reviews - public write, moderated visibility
    match /reviews/{reviewId} {
      allow create: if true; // Public review submission
      allow read: if resource.data.status == 'approved';
      allow update, delete: if isAdmin();
    }
    
    // Lead sessions - public write for tracking
    match /leadSessions/{sessionId} {
      allow create, update: if true; // Session tracking
      allow read, delete: if isAdmin();
    }
    
    // Admin-only collections
    match /contacts/{contactId} {
      allow read, write: if isAdmin();
    }
    
    match /reviewInvites/{inviteId} {
      allow read, write: if isAdmin();
    }
    
    match /followUps/{followUpId} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Data Retention

- **Leads**: Keep indefinitely for business intelligence
- **Reviews**: Keep approved reviews indefinitely, archive rejected after 1 year
- **Lead Sessions**: Archive after 6 months, keep aggregated metrics
- **Contacts**: Keep active contacts indefinitely, archive inactive after 2 years
- **Review Invites**: Archive after 30 days if not completed
- **Follow-ups**: Archive after completion or 90 days