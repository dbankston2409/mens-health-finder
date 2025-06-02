import { Timestamp } from '../lib/firebase-compat';

export interface TagRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'seo' | 'traffic' | 'completeness' | 'engagement' | 'technical';
  evaluator: (clinic: any, metrics: any) => boolean;
  suggestion: {
    message: string;
    action: string;
    relatedField: string;
  };
}

export interface ClinicMetrics {
  clicksLast30: number;
  impressionsLast30: number;
  callsLast30: number;
  trafficLast90: number;
  engagementRate: number;
  lastActivity?: Date;
}

// Core tagging rules for clinic analysis
export const TAG_RULES: TagRule[] = [
  {
    id: 'no-index',
    name: 'Not Indexed',
    description: 'Clinic is not indexed by search engines',
    severity: 'critical',
    category: 'seo',
    evaluator: (clinic) => {
      return !clinic.seoMeta?.indexed;
    },
    suggestion: {
      message: 'This clinic is not indexed by search engines.',
      action: 'Submit to Google Search Console',
      relatedField: 'seoMeta.indexed'
    }
  },
  {
    id: 'seo-incomplete',
    name: 'SEO Incomplete',
    description: 'Missing critical SEO metadata',
    severity: 'high',
    category: 'seo',
    evaluator: (clinic) => {
      const seo = clinic.seoMeta;
      return !seo?.title || !seo?.description || !clinic.seoContent || 
             seo.title.length < 10 || seo.description.length < 50;
    },
    suggestion: {
      message: 'This clinic has incomplete SEO metadata.',
      action: 'Regenerate SEO now',
      relatedField: 'seoMeta'
    }
  },
  {
    id: 'traffic-dead',
    name: 'Traffic Dead',
    description: 'Has impressions but no clicks',
    severity: 'high',
    category: 'traffic',
    evaluator: (clinic, metrics) => {
      return metrics.clicksLast30 === 0 && metrics.impressionsLast30 > 10;
    },
    suggestion: {
      message: 'This clinic gets impressions but no clicks.',
      action: 'Review content strategy or promote listing',
      relatedField: 'seoContent'
    }
  },
  {
    id: 'no-call-action',
    name: 'No Call Action',
    description: 'Missing phone number or call tracking',
    severity: 'medium',
    category: 'engagement',
    evaluator: (clinic) => {
      return !clinic.phone && !clinic.callTrackingNumber;
    },
    suggestion: {
      message: 'This clinic has no call-to-action setup.',
      action: 'Add call-to-action to boost leads',
      relatedField: 'phone'
    }
  },
  {
    id: 'missing-address',
    name: 'Missing Address',
    description: 'Incomplete location information',
    severity: 'medium',
    category: 'completeness',
    evaluator: (clinic) => {
      return !clinic.address || !clinic.city || !clinic.state || !clinic.zipCode;
    },
    suggestion: {
      message: 'This clinic has incomplete address information.',
      action: 'Complete address details',
      relatedField: 'address'
    }
  },
  {
    id: 'ghost-clinic',
    name: 'Ghost Clinic',
    description: 'Active but no activity in 90 days',
    severity: 'critical',
    category: 'engagement',
    evaluator: (clinic, metrics) => {
      return clinic.status === 'active' && 
             metrics.trafficLast90 === 0 && 
             metrics.callsLast30 === 0 && 
             (!metrics.lastActivity || 
              (new Date().getTime() - metrics.lastActivity.getTime()) > 90 * 24 * 60 * 60 * 1000);
    },
    suggestion: {
      message: 'This clinic shows no activity in 90+ days.',
      action: 'Consider marking as paused or deleting',
      relatedField: 'status'
    }
  },
  {
    id: 'low-engagement',
    name: 'Low Engagement',
    description: 'Poor click-through or conversion rates',
    severity: 'medium',
    category: 'engagement',
    evaluator: (clinic, metrics) => {
      return metrics.engagementRate < 0.02 && metrics.impressionsLast30 > 50;
    },
    suggestion: {
      message: 'This clinic has low engagement rates.',
      action: 'Optimize title and description',
      relatedField: 'seoMeta.description'
    }
  },
  {
    id: 'duplicate-content',
    name: 'Duplicate Content',
    description: 'SEO content appears to be duplicated',
    severity: 'medium',
    category: 'seo',
    evaluator: (clinic) => {
      // Simple check for generic content patterns
      const content = clinic.seoContent?.toLowerCase() || '';
      const genericPhrases = [
        'mens health clinic',
        'testosterone replacement therapy',
        'we offer comprehensive'
      ];
      return genericPhrases.some(phrase => 
        content.includes(phrase) && content.length < 500
      );
    },
    suggestion: {
      message: 'This clinic may have duplicate or generic content.',
      action: 'Review and customize content',
      relatedField: 'seoContent'
    }
  },
  {
    id: 'missing-package',
    name: 'Missing Package',
    description: 'No billing package assigned',
    severity: 'low',
    category: 'completeness',
    evaluator: (clinic) => {
      return !clinic.package || clinic.package === 'free';
    },
    suggestion: {
      message: 'This clinic has no paid package assigned.',
      action: 'Upgrade clinic for call tracking',
      relatedField: 'package'
    }
  },
  {
    id: 'outdated-content',
    name: 'Outdated Content',
    description: 'SEO content not updated in 6+ months',
    severity: 'low',
    category: 'seo',
    evaluator: (clinic) => {
      const lastGenerated = clinic.seoMeta?.lastGenerated;
      if (!lastGenerated) return true;
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      return lastGenerated.toDate() < sixMonthsAgo;
    },
    suggestion: {
      message: 'This clinic\'s SEO content is outdated.',
      action: 'Refresh SEO content',
      relatedField: 'seoMeta.lastGenerated'
    }
  }
];

// Helper function to get rules by category
export function getRulesByCategory(category: TagRule['category']): TagRule[] {
  return TAG_RULES.filter(rule => rule.category === category);
}

// Helper function to get rules by severity
export function getRulesBySeverity(severity: TagRule['severity']): TagRule[] {
  return TAG_RULES.filter(rule => rule.severity === severity);
}

// Calculate severity score (0-100)
export function calculateSeverityScore(tags: string[]): number {
  let score = 100;
  
  tags.forEach(tagId => {
    const rule = TAG_RULES.find(r => r.id === tagId);
    if (rule) {
      switch (rule.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
  });
  
  return Math.max(0, score);
}