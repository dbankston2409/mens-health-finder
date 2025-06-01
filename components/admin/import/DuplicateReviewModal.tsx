import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Clinic } from '../../../apps/web/types';

interface DuplicateClinic {
  existingClinic: Clinic;
  newClinicData: Partial<Clinic>;
  matchReason: string;
  matchConfidence: number;
}

interface DuplicateReviewModalProps {
  duplicates: DuplicateClinic[];
  onClose: () => void;
  onApprove: (decisions: { clinicId: string; action: 'merge' | 'create' | 'skip' }[]) => void;
  isSubmitting?: boolean;
}

const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  duplicates,
  onClose,
  onApprove,
  isSubmitting = false
}) => {
  const [decisions, setDecisions] = useState<Record<string, 'merge' | 'create' | 'skip'>>(
    duplicates.reduce((acc, dup) => ({
      ...acc,
      [dup.existingClinic.id!]: 'merge' // Default to merge
    }), {})
  );

  const handleDecisionChange = (clinicId: string, action: 'merge' | 'create' | 'skip') => {
    setDecisions(prev => ({
      ...prev,
      [clinicId]: action
    }));
  };

  const handleApprove = () => {
    const decisionList = Object.entries(decisions).map(([clinicId, action]) => ({
      clinicId,
      action
    }));
    onApprove(decisionList);
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${(confidence * 100).toFixed(0)}%`;
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Review Potential Duplicates
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    We found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''}. 
                    Please review each one and decide how to proceed.
                  </p>
                </div>
                
                <div className="mt-4 overflow-auto max-h-96">
                  {duplicates.map((dup, index) => (
                    <div 
                      key={dup.existingClinic.id} 
                      className={`p-4 rounded-lg border ${
                        index < duplicates.length - 1 ? 'mb-4' : ''
                      } ${
                        decisions[dup.existingClinic.id!] === 'merge' ? 'border-blue-200 bg-blue-50' : 
                        decisions[dup.existingClinic.id!] === 'create' ? 'border-green-200 bg-green-50' : 
                        'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {dup.newClinicData.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Match reason: {dup.matchReason} (Confidence: {formatConfidence(dup.matchConfidence)})
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDecisionChange(dup.existingClinic.id!, 'merge')}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                              decisions[dup.existingClinic.id!] === 'merge'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-blue-700 border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            Merge
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecisionChange(dup.existingClinic.id!, 'create')}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                              decisions[dup.existingClinic.id!] === 'create'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-green-700 border-green-500 hover:bg-green-50'
                            }`}
                          >
                            Create New
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecisionChange(dup.existingClinic.id!, 'skip')}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
                              decisions[dup.existingClinic.id!] === 'skip'
                                ? 'bg-gray-600 text-white'
                                : 'bg-white text-gray-700 border-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                      
                      {/* Comparison table */}
                      <div className="border rounded overflow-hidden mt-2">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Field
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Existing Record
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                New Data
                              </th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Diff
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {['name', 'address', 'city', 'state', 'zip', 'phone', 'website', 'tier'].map((field) => (
                              <tr key={field}>
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                  {field.charAt(0).toUpperCase() + field.slice(1)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                  {renderFieldValue(dup.existingClinic, field)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                  {renderFieldValue(dup.newClinicData, field)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  {isFieldDifferent(dup.existingClinic, dup.newClinicData, field) ? (
                                    <span className="text-orange-500">Changed</span>
                                  ) : (
                                    <span className="text-green-500">Same</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-300 disabled:cursor-not-allowed"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Apply Decisions'}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to render field values
function renderFieldValue(clinic: Partial<Clinic>, field: string): React.ReactNode {
  const value = clinic[field as keyof Clinic];
  
  if (value === undefined || value === null) {
    return <span className="text-gray-300">—</span>;
  }
  
  if (Array.isArray(value)) {
    return value.join(', ') || <span className="text-gray-300">Empty array</span>;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return value.toString();
}

// Helper function to check if field values are different
function isFieldDifferent(clinic1: Partial<Clinic>, clinic2: Partial<Clinic>, field: string): boolean {
  const value1 = clinic1[field as keyof Clinic];
  const value2 = clinic2[field as keyof Clinic];
  
  // If both are undefined or null, they're the same
  if ((value1 === undefined || value1 === null) && (value2 === undefined || value2 === null)) {
    return false;
  }
  
  // If one is undefined/null and the other isn't, they're different
  if ((value1 === undefined || value1 === null) || (value2 === undefined || value2 === null)) {
    return true;
  }
  
  // Handle arrays (services, tags, etc.)
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return true;
    
    // Sort and stringify for comparison
    const sorted1 = [...value1].sort().join(',');
    const sorted2 = [...value2].sort().join(',');
    
    return sorted1 !== sorted2;
  }
  
  // Handle objects by comparing string representation
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    return JSON.stringify(value1) !== JSON.stringify(value2);
  }
  
  // Simple value comparison
  return value1 !== value2;
}

export default DuplicateReviewModal;