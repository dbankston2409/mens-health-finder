import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { VariantTest } from './conversionModels';

export interface VariantAssignment {
  testId: string;
  variantId: string;
  testType: string;
  content: string;
}

export class VariantSplitManager {
  private static instance: VariantSplitManager;
  private userVariants: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private activeTests: Map<string, VariantTest> = new Map(); // clinicSlug -> tests

  static getInstance(): VariantSplitManager {
    if (!VariantSplitManager.instance) {
      VariantSplitManager.instance = new VariantSplitManager();
    }
    return VariantSplitManager.instance;
  }

  async getVariantForUser({
    userId,
    clinicSlug,
    testType
  }: {
    userId: string;
    clinicSlug: string;
    testType?: string;
  }): Promise<VariantAssignment[]> {
    try {
      // Get active tests for this clinic
      const activeTests = await this.getActiveTests(clinicSlug, testType);
      
      const assignments: VariantAssignment[] = [];
      
      for (const test of activeTests) {
        let variantId = await this.getExistingAssignment(userId, test.id);
        
        if (!variantId) {
          // New user - assign to a variant
          variantId = this.assignUserToVariant(userId, test);
          await this.saveAssignment(test.id, userId, variantId);
        }
        
        const variant = test.variants.find(v => v.id === variantId);
        if (variant) {
          assignments.push({
            testId: test.id,
            variantId: variant.id,
            testType: test.type,
            content: variant.content
          });
        }
      }
      
      return assignments;
    } catch (error) {
      console.error('Error getting variant for user:', error);
      return [];
    }
  }

  async getVariantContent({
    userId,
    clinicSlug,
    testType,
    defaultContent
  }: {
    userId: string;
    clinicSlug: string;
    testType: string;
    defaultContent: string;
  }): Promise<string> {
    try {
      const assignments = await this.getVariantForUser({ userId, clinicSlug, testType });
      const assignment = assignments.find(a => a.testType === testType);
      
      return assignment ? assignment.content : defaultContent;
    } catch (error) {
      console.error('Error getting variant content:', error);
      return defaultContent;
    }
  }

  private async getActiveTests(clinicSlug: string, testType?: string): Promise<VariantTest[]> {
    try {
      let testsQuery = query(
        collection(db, 'variantTests'),
        where('clinicSlug', '==', clinicSlug),
        where('status', '==', 'running')
      );
      
      if (testType) {
        testsQuery = query(testsQuery, where('type', '==', testType));
      }
      
      const testsSnapshot = await getDocs(testsQuery);
      return testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VariantTest));
    } catch (error) {
      console.error('Error getting active tests:', error);
      return [];
    }
  }

  private async getExistingAssignment(userId: string, testId: string): Promise<string | null> {
    try {
      // Check local cache first
      const userAssignments = this.userVariants.get(userId);
      if (userAssignments && userAssignments.has(testId)) {
        return userAssignments.get(testId) || null;
      }
      
      // Check localStorage for persistence
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`mhf_variant_${testId}`);
        if (stored) {
          // Update cache
          if (!this.userVariants.has(userId)) {
            this.userVariants.set(userId, new Map());
          }
          this.userVariants.get(userId)!.set(testId, stored);
          return stored;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting existing assignment:', error);
      return null;
    }
  }

  private assignUserToVariant(userId: string, test: VariantTest): string {
    // Check if user should be included in this test based on traffic allocation
    const hash = this.hashUserId(userId + test.id);
    const userTrafficBucket = hash % 100;
    
    if (userTrafficBucket >= test.trafficAllocation) {
      // User is not in the test - return control
      return test.variants.find(v => v.isControl)?.id || test.variants[0].id;
    }
    
    // Assign user to a variant based on weights
    const random = Math.random() * 100;
    let cumulativeWeight = 0;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant.id;
      }
    }
    
    // Fallback to first variant
    return test.variants[0].id;
  }

  private async saveAssignment(testId: string, userId: string, variantId: string): Promise<void> {
    try {
      // Update local cache
      if (!this.userVariants.has(userId)) {
        this.userVariants.set(userId, new Map());
      }
      this.userVariants.get(userId)!.set(testId, variantId);
      
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mhf_variant_${testId}`, variantId);
      }
      
      // Update test assignment record in Firestore
      const testRef = doc(db, 'variantTests', testId);
      await updateDoc(testRef, {
        [`assignedVisitors.${userId}`]: variantId
      });
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Utility functions for React components
  async trackVariantView(testId: string, variantId: string, userId: string): Promise<void> {
    try {
      // This would typically update analytics/metrics
      console.log(`Variant view tracked: ${testId}/${variantId} for user ${userId}`);
      
      // In a real implementation, you might:
      // - Increment view count for this variant
      // - Log the event for analysis
      // - Update real-time metrics
    } catch (error) {
      console.error('Error tracking variant view:', error);
    }
  }

  getUserId(): string {
    if (typeof window === 'undefined') return `user_${Date.now()}`;
    
    let userId = localStorage.getItem('mhf_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('mhf_user_id', userId);
    }
    return userId;
  }

  clearUserAssignments(userId?: string): void {
    const targetUserId = userId || this.getUserId();
    
    // Clear from memory
    this.userVariants.delete(targetUserId);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('mhf_variant_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

import React from 'react';

export const variantSplitManager = VariantSplitManager.getInstance();

// React Hook for easy usage
export function useVariantContent({
  clinicSlug,
  testType,
  defaultContent
}: {
  clinicSlug: string;
  testType: string;
  defaultContent: string;
}) {
  const [content, setContent] = React.useState(defaultContent);
  const [loading, setLoading] = React.useState(true);
  const [variantId, setVariantId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    async function loadVariant() {
      try {
        const userId = variantSplitManager.getUserId();
        const assignments = await variantSplitManager.getVariantForUser({
          userId,
          clinicSlug,
          testType
        });
        
        const assignment = assignments.find(a => a.testType === testType);
        if (assignment) {
          setContent(assignment.content);
          setVariantId(assignment.variantId);
          
          // Track the view
          await variantSplitManager.trackVariantView(
            assignment.testId,
            assignment.variantId,
            userId
          );
        }
      } catch (error) {
        console.error('Error loading variant:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVariant();
  }, [clinicSlug, testType, defaultContent]);
  
  return { content, loading, variantId };
}

// For backward compatibility
export async function runVariantSplitLogic({
  userId,
  clinicSlug,
  testType
}: {
  userId: string;
  clinicSlug: string;
  testType?: string;
}): Promise<VariantAssignment[]> {
  return variantSplitManager.getVariantForUser({ userId, clinicSlug, testType });
}