# Firestore Schema - MHF Cluster 7: SEO Performance & Sales Triggers

## Updated Clinic Document Structure

```typescript
interface Clinic {
  // ... existing fields ...
  
  // SEO Performance Tracking
  seoMeta: {
    score: number;           // 0-100 SEO score
    lastScored: Timestamp;   // When score was calculated
    indexed: boolean;        // Google indexing status
    components: {
      metaCompleteness: number;  // 0-30 points
      indexingStatus: number;    // 0-25 points  
      keywordDiversity: number;  // 0-25 points
      ctr: number;              // 0-20 points
    };
    recommendations: string[]; // SEO improvement suggestions
  };
  
  // Revenue Leakage Tracking
  revenueLeaks: Array<{
    type: 'missed-call-leads' | 'unindexed-premium' | 'traffic-loss' | 'upgrade-missed' | 'seo-gaps';
    estimate: number;        // Monthly loss estimate
    detectedAt: Timestamp;   // When leakage was detected
    monthlyImpact: number;   // Financial impact per month
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  
  // Revenue Analysis
  revenue: {
    leakageAnalysis: {
      totalMonthlyLoss: number;     // Total estimated monthly loss
      lastAnalyzed: Timestamp;      // When analysis was performed
      recommendations: string[];     // Action recommendations
    };
  };
  
  // System Alerts
  alerts: Array<{
    id: string;
    type: string;            // Alert type identifier
    severity: 'info' | 'warn' | 'critical';
    title: string;           // Human-readable title
    message: string;         // Alert description
    data?: Record<string, any>; // Additional alert data
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    actionRequired?: boolean;
  }>;
  
  // Sales & Communication Tracking
  sales: {
    lastUpgradeEmailSent?: Timestamp;
    upgradeEmailCount: number;
    upgradeOpportunityScore: number; // 0-100
  };
  
  communications: {
    emails: Array<{
      type: 'upgrade_offer' | 'alert_notification' | 'revenue_report';
      sentAt: Timestamp;
      emailId: string;         // Provider email ID
      recipient: string;       // Email address
      template: string;        // Template used
      data: Record<string, any>; // Email data
    }>;
  };
  
  // Opportunity Management
  opportunities: {
    suggestions: Array<{
      type: 'seo' | 'upgrade' | 'engagement' | 'traffic';
      action: string;          // Recommended action
      value: number;           // Estimated value
      priority: 'low' | 'medium' | 'high' | 'critical';
      createdAt: Timestamp;
    }>;
    lastAnalyzed: Timestamp;
    totalValue: number;        // Total opportunity value
    resolutions: Array<{
      type: string;
      resolution: 'upgraded' | 'fixed' | 'implemented' | 'dismissed';
      resolvedAt: Timestamp;
      resolvedBy: string;
      notes?: string;
      newTier?: string;
    }>;
  };
}
```

## Global Admin Collections

### Admin Alerts Collection
```typescript
// Document: admin/alerts
interface AdminAlerts {
  active: Record<string, SystemAlert>;    // Active alerts by ID
  resolved: Record<string, {              // Resolved alerts
    resolvedAt: Timestamp;
    reason: string;
    clinicSlug?: string;
  }>;
  lastUpdated: Timestamp;
}

interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  message: string;
  clinicSlug?: string;
  data?: Record<string, any>;
  createdAt: Timestamp;
  actionRequired?: boolean;
}
```

### Sales Performance Collection
```typescript
// Document: admin/sales-performance  
interface SalesPerformance {
  opportunities: {
    total: number;
    byTier: Record<string, number>;
    byState: Record<string, number>;
    totalValue: number;
    lastUpdated: Timestamp;
  };
  
  emails: {
    sent30d: number;
    upgradeOffers: number;
    conversionRate: number;
    lastUpdated: Timestamp;
  };
  
  revenue: {
    totalLeakage: number;
    byCategory: Record<string, number>;
    topOpportunities: Array<{
      clinicSlug: string;
      value: number;
      type: string;
    }>;
    lastUpdated: Timestamp;
  };
}
```

## Query Patterns

### High-Value SEO Opportunities
```typescript
// Find clinics with low SEO scores and high traffic
const seoOpportunities = await db.collection('clinics')
  .where('seoMeta.score', '<', 60)
  .where('traffic.clicks30d', '>=', 50)
  .where('status', '==', 'active')
  .get();
```

### Sales Upgrade Candidates
```typescript
// Find high-engagement free/basic clinics
const upgradeTargets = await db.collection('clinics')
  .where('package', 'in', ['free', 'basic'])
  .where('engagement.level', '==', 'engaged')
  .where('traffic.clicks30d', '>=', 30)
  .get();
```

### Critical Alerts
```typescript
// Get all critical alerts requiring action
const criticalAlerts = await db.doc('admin/alerts')
  .get()
  .then(doc => {
    const data = doc.data();
    return Object.values(data.active || {})
      .filter(alert => alert.severity === 'critical');
  });
```

### Revenue Leakage Analysis
```typescript
// Get clinics with significant revenue leakage
const revenueLeaks = await db.collection('clinics')
  .where('revenue.leakageAnalysis.totalMonthlyLoss', '>=', 1000)
  .where('status', '==', 'active')
  .get();
```

## Indexing Strategy

### Compound Indexes
```typescript
// SEO + Traffic analysis
['seoMeta.score', 'traffic.clicks30d', 'status']

// Upgrade opportunities
['package', 'engagement.level', 'traffic.clicks30d']

// Alert management
['alerts.severity', 'alerts.createdAt', 'status']

// Revenue analysis
['revenue.leakageAnalysis.totalMonthlyLoss', 'package', 'status']

// Opportunity tracking
['opportunities.totalValue', 'opportunities.lastAnalyzed', 'status']
```

## Data Retention

- **Alerts**: Keep active alerts indefinitely, archive resolved alerts after 90 days
- **Revenue Leaks**: Keep current analysis, archive historical data after 6 months  
- **Opportunities**: Keep resolutions for 1 year, suggestions for 3 months
- **Communications**: Keep email logs for 2 years for compliance
- **SEO Scores**: Keep historical scores for trending analysis (1 year)