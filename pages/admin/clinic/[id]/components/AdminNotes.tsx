import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, LightBulbIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useSeoMeta } from '../../../../../apps/web/utils/hooks/useSeoMeta';
import { useClinicTrafficReport } from '../../../../../utils/hooks/useClinicTrafficReport';

interface AdminNotesProps {
  clinicId: string;
  clinicData?: any;
}

interface SeoFlag {
  id: string;
  type: 'warning' | 'suggestion' | 'action' | 'info';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  automated?: boolean;
}

export function AdminNotes({ clinicId, clinicData }: AdminNotesProps) {
  const { seoMeta, loading: seoLoading } = useSeoMeta(clinicId);
  const { data: trafficData, loading: trafficLoading } = useClinicTrafficReport(clinicId);
  const [notes, setNotes] = useState<string>('');
  const [seoFlags, setSeoFlags] = useState<SeoFlag[]>([]);
  const [showFlags, setShowFlags] = useState(true);

  useEffect(() => {
    if (seoMeta && trafficData && clinicData) {
      const flags = generateSeoFlags(seoMeta, trafficData, clinicData);
      setSeoFlags(flags);
    }
  }, [seoMeta, trafficData, clinicData]);

  const generateSeoFlags = (seoMeta: any, trafficData: any, clinicData: any): SeoFlag[] => {
    const flags: SeoFlag[] = [];

    // Check if page is not indexed
    if (!seoMeta?.indexed) {
      flags.push({
        id: 'not-indexed',
        type: 'warning',
        title: 'Page not indexed',
        description: 'This clinic page is not appearing in Google search results.',
        action: 'Trigger SEO regeneration',
        priority: 'high',
        automated: true
      });
    }

    // Check for missing meta description
    if (!seoMeta?.description || seoMeta.description.length < 50) {
      flags.push({
        id: 'missing-description',
        type: 'warning',
        title: 'Missing or short meta description',
        description: 'Meta description is missing or too short (should be 150-160 characters).',
        action: 'Generate new meta description',
        priority: 'medium',
        automated: true
      });
    }

    // Check for missing content
    if (!seoMeta?.content || seoMeta.content.length < 300) {
      flags.push({
        id: 'missing-content',
        type: 'suggestion',
        title: 'Insufficient SEO content',
        description: 'Page needs more comprehensive content for better search rankings.',
        action: 'Generate rich SEO content',
        priority: 'medium',
        automated: true
      });
    }

    // Check for no traffic in last 30 days
    if (trafficData && trafficData.totalClicks < 5) {
      flags.push({
        id: 'no-traffic',
        type: 'warning',
        title: 'No traffic last 30d',
        description: `Only ${trafficData.totalClicks} clicks in the past 30 days.`,
        action: 'Review and optimize SEO strategy',
        priority: 'high'
      });
    }

    // Check for low call conversion
    if (trafficData && trafficData.totalClicks > 20 && trafficData.callClicks < 3) {
      flags.push({
        id: 'low-calls',
        type: 'suggestion',
        title: 'Low call conversion rate',
        description: 'Getting traffic but few phone calls. Call-to-action may need improvement.',
        action: 'Add prominent call buttons and phone number',
        priority: 'medium'
      });
    }

    // Check for basic tier limitations
    if (clinicData?.tier === 'basic') {
      flags.push({
        id: 'basic-tier',
        type: 'info',
        title: 'Basic tier limitations',
        description: 'Clinic is on basic tier with limited features and tracking.',
        action: 'Upgrade listing to unlock tracking and enhanced features',
        priority: 'low'
      });
    }

    // Check for missing photos (mock check)
    const hasPhotos = Math.random() > 0.3; // 70% chance of having photos
    if (!hasPhotos) {
      flags.push({
        id: 'missing-photos',
        type: 'suggestion',
        title: 'Missing clinic photos',
        description: 'Photos can improve click-through rates by up to 40%.',
        action: 'Add photo to improve CTR',
        priority: 'medium'
      });
    }

    // Check for old content
    if (seoMeta?.lastGenerated) {
      const lastUpdated = new Date(seoMeta.lastGenerated.seconds * 1000);
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 90) {
        flags.push({
          id: 'old-content',
          type: 'action',
          title: 'Content needs refresh',
          description: `SEO content was last updated ${daysSinceUpdate} days ago.`,
          action: 'Refresh SEO content for better rankings',
          priority: 'medium',
          automated: true
        });
      }
    }

    return flags.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'suggestion':
        return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
      case 'action':
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getColorForPriority = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleTriggerAction = async (flagId: string, action: string) => {
    console.log(`Triggering action for ${flagId}: ${action}`);
    // Here you would implement the actual action triggers
    // For example, calling APIs to regenerate SEO content, update metadata, etc.
  };

  const handleSaveNotes = async () => {
    console.log('Saving admin notes:', notes);
    // Implement save functionality
  };

  if (seoLoading || trafficLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Admin Notes & SEO Flags</h3>
        <button
          onClick={() => setShowFlags(!showFlags)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showFlags ? 'Hide' : 'Show'} SEO Flags ({seoFlags.length})
        </button>
      </div>

      {/* SEO Flags Section */}
      {showFlags && seoFlags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">SEO Issues & Suggestions</h4>
          <div className="space-y-3">
            {seoFlags.map((flag) => (
              <div key={flag.id} className={`border rounded-lg p-4 ${getColorForPriority(flag.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getIconForType(flag.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{flag.title}</h5>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          flag.priority === 'high' ? 'bg-red-100 text-red-800' :
                          flag.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {flag.priority}
                        </span>
                        {flag.automated && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Auto-fix available
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTriggerAction(flag.id, flag.action)}
                    className={`ml-4 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      flag.automated 
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    {flag.automated ? 'Auto-Fix' : 'Manual Action'}
                  </button>
                </div>
                <div className="mt-3 ml-8">
                  <div className="text-sm font-medium text-gray-700">
                    Suggested Action: <span className="text-blue-600">{flag.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Notes Section */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Manual Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes about this clinic..."
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <button
            onClick={handleSaveNotes}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Save Notes
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Regenerate SEO Content
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Check Index Status
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Update Metadata
          </button>
          <button className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
}