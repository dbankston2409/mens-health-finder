import React, { useState } from 'react';
import { useSeoEditor } from '../../../../utils/hooks/useSeoEditor';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { SeoEditHistory } from './SeoEditHistory';

interface SeoEditorPanelProps {
  clinicId: string;
}

interface SeoValidationBadgeProps {
  title: string;
  description: string;
  keywords: string[];
  seoContent: string;
}

function SeoValidationBadge({ title, description, keywords, seoContent }: SeoValidationBadgeProps) {
  const hasTitle = title.length > 0;
  const hasDescription = description.length > 0 && description.length <= 160;
  const hasKeywords = keywords.length > 0;
  const hasContent = seoContent.length > 300;
  
  const completionScore = [hasTitle, hasDescription, hasKeywords, hasContent].filter(Boolean).length;
  
  if (completionScore === 4) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        SEO Complete
      </div>
    );
  } else if (completionScore >= 2) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
        Needs Fix ({completionScore}/4)
      </div>
    );
  } else {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <XCircleIcon className="h-4 w-4 mr-1" />
        SEO Incomplete
      </div>
    );
  }
}

export function SeoEditorPanel({ clinicId }: SeoEditorPanelProps) {
  const {
    data,
    editData,
    loading,
    error,
    isDirty,
    isValid,
    save,
    regenerate,
    reset,
    updateField
  } = useSeoEditor(clinicId);
  
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    const success = await save();
    
    if (success) {
      setToast({ message: 'SEO data saved successfully!', type: 'success' });
    } else {
      setToast({ message: 'Failed to save SEO data', type: 'error' });
    }
    
    setSaving(false);
    
    // Clear toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const success = await regenerate();
    
    if (success) {
      setToast({ message: 'SEO content regenerated successfully!', type: 'success' });
    } else {
      setToast({ message: 'Failed to regenerate SEO content', type: 'error' });
    }
    
    setRegenerating(false);
    
    // Clear toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
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
          <h3 className="text-lg font-medium mb-2">Error Loading SEO Data</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SEO Editor</h3>
          <div className="flex items-center space-x-4 mt-2">
            <SeoValidationBadge {...editData} />
            {data && (
              <div className="text-sm text-gray-600">
                {data.lastGenerated && (
                  <span>Last generated {formatTimeAgo(data.lastGenerated)}</span>
                )}
                {data.lastEdited && data.lastGenerated && <span> | </span>}
                {data.lastEdited && (
                  <span>Last edited {formatTimeAgo(data.lastEdited)}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          {showHistory ? 'Hide' : 'View'} History
        </button>
      </div>

      {/* SEO Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title Tag
            <span className="text-gray-500 ml-1">({editData.title.length}/60)</span>
          </label>
          <input
            type="text"
            value={editData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter SEO title..."
            maxLength={60}
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              editData.title.length > 60 ? 'border-red-300' : ''
            }`}
          />
          {editData.title.length > 55 && (
            <p className="text-sm text-amber-600 mt-1">
              Title is getting long. Consider keeping it under 60 characters.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
            <span className="text-gray-500 ml-1">({editData.description.length}/160)</span>
          </label>
          <textarea
            value={editData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Enter meta description..."
            rows={3}
            maxLength={160}
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              editData.description.length > 160 ? 'border-red-300' : ''
            }`}
          />
          {editData.description.length > 150 && (
            <p className="text-sm text-amber-600 mt-1">
              Description is getting long. Consider keeping it under 160 characters.
            </p>
          )}
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
            <span className="text-gray-500 ml-1">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={editData.keywords.join(', ')}
            onChange={(e) => updateField('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
            placeholder="testosterone therapy, mens health, low t treatment..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {editData.keywords.map((keyword, index) => (
              <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* SEO Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Content
            <span className="text-gray-500 ml-1">({editData.seoContent.length} chars)</span>
          </label>
          <textarea
            value={editData.seoContent}
            onChange={(e) => updateField('seoContent', e.target.value)}
            placeholder="Enter rich SEO content..."
            rows={8}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
          />
          {editData.seoContent.length < 300 && (
            <p className="text-sm text-amber-600 mt-1">
              Content is short. Consider adding more comprehensive information for better SEO.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={!isDirty || !isValid || saving}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              !isDirty || !isValid || saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              regenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            {regenerating ? 'Regenerating...' : 'Regenerate SEO'}
          </button>
        </div>
        
        {isDirty && (
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Reset Changes
          </button>
        )}
      </div>

      {/* Validation Warnings */}
      {!isValid && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Validation Issues</h4>
              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                {editData.title.length === 0 && <li>Title is required</li>}
                {editData.description.length === 0 && <li>Description is required</li>}
                {editData.description.length > 160 && <li>Description is too long (max 160 characters)</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit History */}
      {showHistory && (
        <div className="mt-6">
          <SeoEditHistory clinicId={clinicId} />
        </div>
      )}
    </div>
  );
}