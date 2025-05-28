import React, { useState } from 'react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';
import { Clinic } from '../../../../utils/hooks/useValidationQueue';
import EditFieldInline from './EditFieldInline';
import TagManager from './TagManager';

interface ValidationSidebarProps {
  clinic: Clinic | null;
  onClose: () => void;
  onUpdateField: (field: string, value: any) => Promise<void>;
  onUpdateTags: (tagsToAdd: string[], tagsToRemove: string[]) => Promise<void>;
  onValidate: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onSkip: () => void;
  onCheckWebsite: () => Promise<'up' | 'down'>;
  isOpen: boolean;
}

const ValidationSidebar: React.FC<ValidationSidebarProps> = ({
  clinic,
  onClose,
  onUpdateField,
  onUpdateTags,
  onValidate,
  onReject,
  onSkip,
  onCheckWebsite,
  isOpen
}) => {
  const [isCheckingWebsite, setIsCheckingWebsite] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  if (!isOpen || !clinic) return null;

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddTag = async (tag: string) => {
    await onUpdateTags([tag], []);
  };

  const handleRemoveTag = async (tag: string) => {
    await onUpdateTags([], [tag]);
  };

  const handleCheckWebsite = async () => {
    setIsCheckingWebsite(true);
    try {
      await onCheckWebsite();
    } finally {
      setIsCheckingWebsite(false);
    }
  };

  const handleReject = async () => {
    if (!showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    
    if (!rejectionReason) return;
    
    await onReject(rejectionReason);
    setRejectionReason('');
    setShowRejectForm(false);
  };

  const getWebsiteStatusIndicator = () => {
    if (isCheckingWebsite) {
      return (
        <div className="inline-flex items-center text-gray-600 dark:text-gray-400">
          <div className="animate-pulse flex space-x-2 items-center">
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            <span className="ml-1 text-xs">Checking...</span>
          </div>
        </div>
      );
    }

    if (clinic.websiteStatus === 'up') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Up
        </span>
      );
    } else if (clinic.websiteStatus === 'down') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Down
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Unknown
      </span>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 z-40 overflow-hidden transform transition-transform ease-in-out duration-300 bg-white dark:bg-gray-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
          {clinic.name}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-full pb-28">
        <div className="p-4 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Basic Information
            </h3>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <EditFieldInline
                label="Name"
                value={clinic.name}
                onChange={(value) => onUpdateField('name', value)}
              />
              
              <EditFieldInline
                label="Phone"
                value={clinic.phone}
                onChange={(value) => onUpdateField('phone', value)}
                type="tel"
                placeholder="Enter phone number"
              />
              
              <div className="flex items-start space-x-2">
                <div className="flex-grow">
                  <EditFieldInline
                    label="Website"
                    value={clinic.website}
                    onChange={(value) => onUpdateField('website', value)}
                    type="url"
                    placeholder="Enter website URL"
                  />
                </div>
                <div className="pt-6">
                  {getWebsiteStatusIndicator()}
                </div>
              </div>
              
              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleCheckWebsite}
                  disabled={!clinic.website || isCheckingWebsite}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GlobeAltIcon className="h-3 w-3 mr-1" />
                  Check Website
                </button>
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Address
            </h3>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <EditFieldInline
                label="Street Address"
                value={clinic.address}
                onChange={(value) => onUpdateField('address', value)}
                placeholder="Enter street address"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <EditFieldInline
                  label="City"
                  value={clinic.city}
                  onChange={(value) => onUpdateField('city', value)}
                  placeholder="Enter city"
                />
                
                <EditFieldInline
                  label="State"
                  value={clinic.state}
                  onChange={(value) => onUpdateField('state', value)}
                  placeholder="Enter state"
                />
              </div>
              
              <EditFieldInline
                label="ZIP Code"
                value={clinic.zip}
                onChange={(value) => onUpdateField('zip', value)}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>
          
          {/* Status and Package */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Status & Package
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={clinic.status}
                  onChange={(e) => onUpdateField('status', e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="basic">Basic</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Package
                </label>
                <select
                  value={clinic.packageTier}
                  onChange={(e) => onUpdateField('packageTier', e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Services
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <textarea
                value={clinic.services?.join(', ') || ''}
                onChange={(e) => {
                  const servicesString = e.target.value;
                  const services = servicesString.split(',').map(s => s.trim()).filter(Boolean);
                  onUpdateField('services', services);
                }}
                placeholder="Enter services (comma separated)"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                rows={3}
              />
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tags
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <TagManager
                tags={clinic.tags || []}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </div>
          </div>
          
          {/* Metadata */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Metadata
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg space-y-2">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Import Source:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 ml-2">
                  {clinic.importSource || 'Manual Entry'}
                </span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Created:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 ml-2">
                  {formatDate(clinic.createdAt)}
                </span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Last Updated:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 ml-2">
                  {formatDate(clinic.updatedAt)}
                </span>
              </div>
              
              {clinic.lastPinged && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Last Website Check:</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 ml-2">
                    {formatDate(clinic.lastPinged)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md">
        {showRejectForm ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rejection Reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Select reason...</option>
                <option value="duplicate">Duplicate Clinic</option>
                <option value="incomplete">Incomplete Information</option>
                <option value="spam">Spam or Fake Listing</option>
                <option value="not-a-clinic">Not a Men's Health Clinic</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              
              <button
                onClick={handleReject}
                disabled={!rejectionReason}
                className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleReject}
              className="inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XCircleIcon className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Reject</span>
            </button>
            
            <button
              onClick={onSkip}
              className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowRightIcon className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Skip</span>
            </button>
            
            <button
              onClick={onValidate}
              className="inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Validate</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationSidebar;