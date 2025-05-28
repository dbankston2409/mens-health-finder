import React, { useState, useEffect } from 'react';
import { ClockIcon, UserIcon, SparklesIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getSeoAuditTrail, formatAuditEntry } from '../../../../../worker/utils/seoAuditLogger';

interface SeoEditHistoryProps {
  clinicId: string;
}

interface AuditEntry {
  timestamp: Date;
  editedBy: string;
  changeType: 'manual' | 'regenerated' | 'imported' | 'bulk_update';
  fieldsChanged: string[];
  details?: {
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    batchId?: string;
  };
}

export function SeoEditHistory({ clinicId }: SeoEditHistoryProps) {
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getSeoAuditTrail(clinicId);
        
        if (result.error) {
          setError(result.error);
        } else {
          setAuditTrail(result.auditTrail);
        }
      } catch (err) {
        console.error('Error fetching audit trail:', err);
        setError('Failed to load edit history');
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchAuditTrail();
    }
  }, [clinicId]);

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'manual':
        return <PencilIcon className="h-4 w-4 text-blue-600" />;
      case 'regenerated':
        return <SparklesIcon className="h-4 w-4 text-purple-600" />;
      case 'imported':
        return <ArrowPathIcon className="h-4 w-4 text-green-600" />;
      case 'bulk_update':
        return <ArrowPathIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'manual':
        return 'bg-blue-100 text-blue-800';
      case 'regenerated':
        return 'bg-purple-100 text-purple-800';
      case 'imported':
        return 'bg-green-100 text-green-800';
      case 'bulk_update':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeDescription = (entry: AuditEntry) => {
    const fieldsText = entry.fieldsChanged.length === 1 
      ? entry.fieldsChanged[0]
      : `${entry.fieldsChanged.length} fields`;
    
    switch (entry.changeType) {
      case 'manual':
        return `Manually edited ${fieldsText}`;
      case 'regenerated':
        return `Regenerated SEO content`;
      case 'imported':
        return `Imported ${fieldsText}`;
      case 'bulk_update':
        return `Bulk updated ${fieldsText}`;
      default:
        return `Updated ${fieldsText}`;
    }
  };

  if (loading) {
    return (
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Edit History</h4>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Edit History</h4>
        <div className="text-red-600 text-sm">
          Error loading edit history: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <ClockIcon className="h-5 w-5 mr-2" />
        Edit History ({auditTrail.length} entries)
      </h4>
      
      {auditTrail.length === 0 ? (
        <div className="text-gray-500 text-sm py-8 text-center">
          No edit history available
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {auditTrail.map((entry, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getChangeTypeIcon(entry.changeType)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {getChangeDescription(entry)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getChangeTypeColor(entry.changeType)}`}>
                          {entry.changeType}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {entry.editedBy}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDateTime(entry.timestamp)}
                        </div>
                      </div>
                      
                      {entry.fieldsChanged.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Changed fields:</div>
                          <div className="flex flex-wrap gap-1">
                            {entry.fieldsChanged.map((field, fieldIndex) => (
                              <span key={fieldIndex} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {entry.details && (
                    <button
                      onClick={() => setExpandedEntry(expandedEntry === index ? null : index)}
                      className="text-sm text-blue-600 hover:text-blue-800 ml-4"
                    >
                      {expandedEntry === index ? 'Hide Details' : 'Show Details'}
                    </button>
                  )}
                </div>
                
                {/* Expanded Details */}
                {expandedEntry === index && entry.details && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm space-y-2">
                      {entry.details.reason && (
                        <div>
                          <span className="font-medium text-gray-700">Reason: </span>
                          <span className="text-gray-600">{entry.details.reason}</span>
                        </div>
                      )}
                      
                      {entry.details.batchId && (
                        <div>
                          <span className="font-medium text-gray-700">Batch ID: </span>
                          <span className="text-gray-600 font-mono text-xs">{entry.details.batchId}</span>
                        </div>
                      )}
                      
                      {entry.details.previousValues && (
                        <div>
                          <span className="font-medium text-gray-700">Previous Values: </span>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(entry.details.previousValues, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {entry.details.newValues && (
                        <div>
                          <span className="font-medium text-gray-700">New Values: </span>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(entry.details.newValues, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {auditTrail.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {auditTrail.length} most recent entries
        </div>
      )}
    </div>
  );
}