import React from 'react';
import { DetailedClinic } from '../../../../utils/admin/useClinicData';
import TierEditor from './TierEditor';
import { convertToStandardTier } from '@/utils/tierUtils';

interface ClinicInfoSectionProps {
  clinic: DetailedClinic;
}

const ClinicInfoSection: React.FC<ClinicInfoSectionProps> = ({ clinic }) => {
  // Determine the standardized tier
  const standardTier = clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Name</div>
              <div className="col-span-2">{clinic.name}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Address</div>
              <div className="col-span-2">{clinic.address}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Phone</div>
              <div className="col-span-2">{clinic.phone}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Email</div>
              <div className="col-span-2">{clinic.email}</div>
            </div>
            
            {clinic.website && (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 text-gray-400">Website</div>
                <div className="col-span-2">
                  <a 
                    href={clinic.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light"
                  >
                    {clinic.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Account Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Standardized Tier</div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(standardTier)}`}>
                  {standardTier.charAt(0).toUpperCase() + standardTier.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Legacy Package</div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getPackageColor(clinic.package)}`}>
                  {clinic.package}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Status</div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(clinic.status)}`}>
                  {clinic.status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Join Date</div>
              <div className="col-span-2">{new Date(clinic.joinDate).toLocaleDateString()}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Last Contact</div>
              <div className="col-span-2">{clinic.lastContact ? new Date(clinic.lastContact).toLocaleDateString() : 'N/A'}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-gray-400">Sales Rep</div>
              <div className="col-span-2">{clinic.salesRep || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Services</h3>
          
          <div className="flex flex-wrap gap-2">
            {clinic.services.map((service, index) => (
              <span 
                key={index} 
                className="px-3 py-1 rounded-full bg-gray-800 text-sm"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Tier Editor */}
        <TierEditor clinic={clinic} />

        {/* Tags & Notes */}
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Tags</h3>
            
            <div className="flex flex-wrap gap-2">
              {clinic.tags && clinic.tags.length > 0 ? (
                clinic.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full bg-primary bg-opacity-20 text-primary text-sm"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No tags added</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Notes</h3>
            
            <div className="space-y-2">
              {clinic.notes && clinic.notes.length > 0 ? (
                clinic.notes.map((note, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-md bg-gray-800"
                  >
                    {note}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No notes added</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for status and package colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-900 text-green-300';
    case 'Trial':
      return 'bg-blue-900 text-blue-300';
    case 'Paused':
      return 'bg-yellow-900 text-yellow-300';
    case 'Canceled':
      return 'bg-red-900 text-red-300';
    default:
      return 'bg-gray-800 text-gray-300';
  }
};

const getPackageColor = (packageType: string) => {
  switch (packageType) {
    case 'Premium':
      return 'bg-purple-900 text-purple-300';
    case 'Basic':
      return 'bg-blue-900 text-blue-300';
    case 'Free':
      return 'bg-gray-800 text-gray-300';
    default:
      return 'bg-gray-800 text-gray-300';
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'advanced':
      return 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black';
    case 'standard':
      return 'bg-green-600 text-white';
    case 'free':
      return 'bg-gray-600 text-white';
    default:
      return 'bg-gray-800 text-gray-300';
  }
};

export default ClinicInfoSection;