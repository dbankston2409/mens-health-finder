import React from 'react';
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  CheckBadgeIcon, 
  ClockIcon,
  CalendarIcon,
  IdentificationIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { Clinic } from '../../../../utils/hooks/useClinic';

interface ClinicInfoSectionProps {
  clinic: Clinic;
}

const ClinicInfoSection: React.FC<ClinicInfoSectionProps> = ({ clinic }) => {
  if (!clinic) return null;

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    let dateObj;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'object' && date.seconds !== undefined) {
      // Handle Firestore Timestamp
      dateObj = new Date(date.seconds * 1000);
    } else {
      return 'Unknown date format';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWebsiteStatusIcon = () => {
    if (!clinic.websiteStatus || clinic.websiteStatus === 'unknown') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" title="Website status unknown" />;
    }
    return clinic.websiteStatus === 'up' 
      ? <CheckCircleIcon className="h-5 w-5 text-green-500" title="Website is up" />
      : <ExclamationTriangleIcon className="h-5 w-5 text-red-500" title="Website is down" />;
  };

  const getVerificationStatusBadge = () => {
    if (!clinic.verificationStatus || clinic.verificationStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending
        </span>
      );
    }
    return clinic.verificationStatus === 'verified'
      ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Verified
        </span>
      )
      : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Failed
        </span>
      );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Clinic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Address */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Address
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-800 dark:text-gray-200">
                {clinic.address}<br />
                {clinic.city}, {clinic.state} {clinic.zip}
              </p>
              {clinic.lat && clinic.lng && (
                <a 
                  href={`https://maps.google.com/?q=${clinic.lat},${clinic.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2 inline-block"
                >
                  View on Map
                </a>
              )}
            </div>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              {clinic.phone && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Phone:</span>
                  <a 
                    href={`tel:${clinic.phone}`}
                    className="block text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {clinic.phone}
                  </a>
                </div>
              )}
              
              {clinic.email && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Email:</span>
                  <a 
                    href={`mailto:${clinic.email}`}
                    className="block text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {clinic.email}
                  </a>
                </div>
              )}
              
              {clinic.website && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Website:</span>
                  <div className="flex items-center">
                    <a 
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline mr-2"
                    >
                      {clinic.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                    {getWebsiteStatusIcon()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Services */}
          {clinic.services && clinic.services.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                Services Offered
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {clinic.services.map(service => (
                    <span 
                      key={service}
                      className="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {/* Verification Status */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
              <CheckBadgeIcon className="h-5 w-5 mr-2" />
              Verification Status
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400 mr-2">Status:</span>
                {getVerificationStatusBadge()}
              </div>
              
              {clinic.verificationMethod && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Method:</span>
                  <span className="block text-gray-800 dark:text-gray-200">
                    {clinic.verificationMethod}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Import Source */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
              <IdentificationIcon className="h-5 w-5 mr-2" />
              Data Source
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Import Source:</span>
                <span className="block text-gray-800 dark:text-gray-200">
                  {clinic.importSource || 'Manual Entry'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Timestamps */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
              <ClockIcon className="h-5 w-5 mr-2" />
              Timestamps
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Created:</span>
                </div>
                <span className="block text-gray-800 dark:text-gray-200">
                  {formatDate(clinic.createdAt)}
                </span>
              </div>
              
              <div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Last Updated:</span>
                </div>
                <span className="block text-gray-800 dark:text-gray-200">
                  {formatDate(clinic.updatedAt)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Tags */}
          {clinic.tags && clinic.tags.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center mb-2">
                <TagIcon className="h-5 w-5 mr-2" />
                Tags
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {clinic.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicInfoSection;