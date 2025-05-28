import React, { useState } from 'react';
import { useTagSuggestions } from '../../../../apps/web/utils/hooks/useTagSuggestions';
import { TagBadgeCluster } from '../../TagBadgeCluster';
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface TagSuggestionsPanelProps {
  clinicId: string;
}

/**
 * Admin panel for viewing and managing clinic tag suggestions
 */
export function TagSuggestionsPanel({ clinicId }: TagSuggestionsPanelProps) {
  const {
    tags,
    suggestions,
    seoScore,
    loading,
    error,
    refetchTags,
    dismissSuggestion,
    acceptSuggestion,
    addComment
  } = useTagSuggestions(clinicId);

  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isRefetching, setIsRefetching] = useState(false);

  const handleRefetch = async () => {
    setIsRefetching(true);
    await refetchTags();
    setIsRefetching(false);
  };

  const handleAccept = async (suggestionId: string) => {
    await acceptSuggestion(suggestionId);
  };

  const handleDismiss = async (suggestionId: string) => {
    await dismissSuggestion(suggestionId);
  };

  const handleAddComment = async (suggestionId: string) => {
    const comment = commentText[suggestionId]?.trim();
    if (comment) {
      await addComment(suggestionId, comment);
      setCommentText(prev => ({ ...prev, [suggestionId]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Tags</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tag Intelligence</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automated analysis and suggestions for this clinic
          </p>
        </div>
        <button
          onClick={handleRefetch}
          disabled={isRefetching}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
            isRefetching ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Scanning...' : 'Scan Tags'}
        </button>
      </div>

      {/* Current Tags */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Tags</h4>
        <TagBadgeCluster 
          tags={tags} 
          seoScore={seoScore} 
          maxVisible={10}
        />
      </div>

      {/* Suggestions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Suggestions ({suggestions.length})
        </h4>
        
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">All Good!</h3>
            <p className="text-sm text-gray-500">
              No outstanding suggestions for this clinic.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onDismiss={() => handleDismiss(suggestion.id)}
                onAddComment={(comment) => handleAddComment(suggestion.id)}
                commentText={commentText[suggestion.id] || ''}
                onCommentChange={(text) => 
                  setCommentText(prev => ({ ...prev, [suggestion.id]: text }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual suggestion card component
 */
interface SuggestionCardProps {
  suggestion: any;
  onAccept: () => void;
  onDismiss: () => void;
  onAddComment: (comment: string) => void;
  commentText: string;
  onCommentChange: (text: string) => void;
}

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onAddComment,
  commentText,
  onCommentChange
}: SuggestionCardProps) {
  const [showComment, setShowComment] = useState(false);
  const [processing, setProcessing] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'tip':
        return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    switch (type) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'tip':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    await onAccept();
    setProcessing(false);
  };

  const handleDismiss = async () => {
    setProcessing(true);
    await onDismiss();
    setProcessing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getTypeIcon(suggestion.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={getTypeBadge(suggestion.type)}>
              {suggestion.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              {suggestion.relatedField}
            </span>
          </div>
          
          <p className="text-sm text-gray-900 mb-2">
            {suggestion.message}
          </p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAccept}
              disabled={processing}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              {suggestion.action}
            </button>
            
            <button
              onClick={handleDismiss}
              disabled={processing}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <XMarkIcon className="h-3 w-3 mr-1" />
              Dismiss
            </button>
            
            <button
              onClick={() => setShowComment(!showComment)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChatBubbleLeftIcon className="h-3 w-3 mr-1" />
              Comment
            </button>
          </div>
          
          {/* Comment Section */}
          {showComment && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      onAddComment(commentText.trim());
                    }
                  }}
                />
                <button
                  onClick={() => onAddComment(commentText.trim())}
                  disabled={!commentText.trim()}
                  className="px-3 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              
              {suggestion.comment && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <p className="text-gray-700">{suggestion.comment}</p>
                  {suggestion.commentedBy && (
                    <p className="text-gray-500 mt-1">
                      — {suggestion.commentedBy}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}