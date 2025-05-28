import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ClinicSuggestion, runSingleClinicAudit } from './stubs/tagAnalysis';

export interface UseTagSuggestionsResult {
  tags: string[];
  suggestions: ClinicSuggestion[];
  seoScore: number;
  loading: boolean;
  error: string | null;
  refetchTags: () => Promise<void>;
  dismissSuggestion: (suggestionId: string) => Promise<void>;
  acceptSuggestion: (suggestionId: string) => Promise<void>;
  addComment: (suggestionId: string, comment: string) => Promise<void>;
}

/**
 * React hook for managing clinic tags and suggestions
 */
export function useTagSuggestions(clinicId: string): UseTagSuggestionsResult {
  const [tags, setTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ClinicSuggestion[]>([]);
  const [seoScore, setSeoScore] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for clinic data
  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const clinicRef = doc(db, 'clinics', clinicId);
    
    const unsubscribe = onSnapshot(
      clinicRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTags(data.tags || []);
          setSuggestions(data.suggestions || []);
          setSeoScore(data.seoMeta?.seoScore || 100);
          setError(null);
        } else {
          setError('Clinic not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to clinic data:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  /**
   * Re-run tag analysis for this clinic
   */
  const refetchTags = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Refetching tags for clinic ${clinicId}`);
      await runSingleClinicAudit(clinicId);
      
      console.log('✅ Tags refetched successfully');
    } catch (err) {
      console.error('Failed to refetch tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch tags');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Dismiss a suggestion (remove it from the list)
   */
  const dismissSuggestion = async (suggestionId: string): Promise<void> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      const targetSuggestion = suggestions.find(s => s.id === suggestionId);
      
      if (targetSuggestion) {
        await updateDoc(clinicRef, {
          suggestions: arrayRemove(targetSuggestion)
        });
        
        console.log(`✅ Dismissed suggestion ${suggestionId}`);
      }
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to dismiss suggestion');
    }
  };

  /**
   * Accept a suggestion and trigger the related action
   */
  const acceptSuggestion = async (suggestionId: string): Promise<void> => {
    try {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      console.log(`🎯 Accepting suggestion: ${suggestion.action}`);
      
      // Route to appropriate action based on suggestion type
      switch (suggestion.tagId) {
        case 'seo-incomplete':
        case 'outdated-content':
          // Trigger SEO regeneration
          await fetch('/api/regenerate-seo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              clinicId,
              reason: `Auto-fix for: ${suggestion.message}`
            })
          });
          break;
          
        case 'no-index':
          // Trigger indexing submission
          await fetch('/api/submit-indexing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clinicId })
          });
          break;
          
        default:
          console.log(`ℹ️ No automated action for tag: ${suggestion.tagId}`);
          break;
      }
      
      // Remove the suggestion after action
      await dismissSuggestion(suggestionId);
      
      // Re-run analysis to see if issue is resolved
      setTimeout(() => refetchTags(), 2000);
      
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept suggestion');
    }
  };

  /**
   * Add a comment to a suggestion (for admin notes)
   */
  const addComment = async (suggestionId: string, comment: string): Promise<void> => {
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      const updatedSuggestions = suggestions.map(s => 
        s.id === suggestionId 
          ? { 
              ...s, 
              comment, 
              commentedAt: new Date(),
              commentedBy: 'Current User' // TODO: Get from auth context
            }
          : s
      );
      
      await updateDoc(clinicRef, {
        suggestions: updatedSuggestions,
        'seoMeta.lastCommented': serverTimestamp()
      });
      
      console.log(`💬 Added comment to suggestion ${suggestionId}`);
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  return {
    tags,
    suggestions,
    seoScore,
    loading,
    error,
    refetchTags,
    dismissSuggestion,
    acceptSuggestion,
    addComment
  };
}