import React, { useState } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import ClientQuickActions from './ClientQuickActions';
import LoadingSkeletons from './LoadingSkeletons';

import { Clinic } from '../../../types';

type SortField = 'name' | 'location' | 'packageTier' | 'status' | 'engagementScore' | 'signUpDate' | 'lastContacted';
type SortDirection = 'asc' | 'desc';

interface ClientTableProps {
  clinics: Clinic[];
  loading: boolean;
  onEditClinic: (clinic: Clinic) => void;
  onMessageClinic: (clinic: Clinic) => void;
  onStatusChange: (clinic: Clinic, newStatus: 'active' | 'paused' | 'trial' | 'canceled') => void;
  onTagsChange: (clinic: Clinic, newTags: string[]) => void;
  availableTags: string[];
  refreshData: () => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clinics,
  loading,
  onEditClinic,
  onMessageClinic,
  onStatusChange,
  onTagsChange,
  availableTags,
  refreshData
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showEngagementTooltip, setShowEngagementTooltip] = useState(false);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedClinics = [...clinics].sort((a, b) => {
    let compareA, compareB;

    switch (sortField) {
      case 'name':
        compareA = a.name.toLowerCase();
        compareB = b.name.toLowerCase();
        break;
      case 'location':
        compareA = `${a.state}, ${a.city}`.toLowerCase();
        compareB = `${b.state}, ${b.city}`.toLowerCase();
        break;
      case 'packageTier':
        compareA = (a.packageTier || a.package || a.tier || '').toLowerCase();
        compareB = (b.packageTier || b.package || b.tier || '').toLowerCase();
        break;
      case 'status':
        compareA = (a.status || '').toLowerCase();
        compareB = (b.status || '').toLowerCase();
        break;
      case 'engagementScore':
        compareA = a.engagementScore;
        compareB = b.engagementScore;
        break;
      case 'signUpDate':
        compareA = a.signUpDate ? new Date(a.signUpDate).getTime() : 0;
        compareB = b.signUpDate ? new Date(b.signUpDate).getTime() : 0;
        break;
      case 'lastContacted':
        compareA = a.lastContacted ? new Date(a.lastContacted).getTime() : 0;
        compareB = b.lastContacted ? new Date(b.lastContacted).getTime() : 0;
        break;
      default:
        return 0;
    }

    const comparison = typeof compareA === 'string'
      ? compareA.localeCompare(compareB as string)
      : (compareA as number) - (compareB as number);

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEngagementScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingSkeletons rowCount={10} columnCount={7} />;
  }

  if (clinics.length === 0) {
    return (
      <div className="py-12 text-center bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Clinics Found</h3>
        <p className="text-gray-500 mb-4">
          No clinics match your current filters. Try adjusting your search criteria.
        </p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span>Clinic Name</span>
                {sortField === 'name' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('location')}
            >
              <div className="flex items-center space-x-1">
                <span>City/State</span>
                {sortField === 'location' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('packageTier')}
            >
              <div className="flex items-center space-x-1">
                <span>Package</span>
                {sortField === 'packageTier' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center space-x-1">
                <span>Status</span>
                {sortField === 'status' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('engagementScore')}
            >
              <div className="flex items-center space-x-1">
                <span>Engagement</span>
                {sortField === 'engagementScore' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
                <div className="relative">
                  <InformationCircleIcon 
                    className="w-4 h-4 text-gray-400 cursor-help"
                    onMouseEnter={() => setShowEngagementTooltip(true)}
                    onMouseLeave={() => setShowEngagementTooltip(false)}
                  />
                  {showEngagementTooltip && (
                    <div className="absolute z-10 w-64 px-3 py-2 text-xs text-left text-white bg-gray-800 rounded-lg shadow-lg -left-32 bottom-8">
                      <p className="font-normal">
                        Engagement score is calculated based on profile views, clicks, and search appearances in the last 30 days.
                      </p>
                      <div className="absolute inset-x-0 bottom-0 flex justify-center">
                        <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('signUpDate')}
            >
              <div className="flex items-center space-x-1">
                <span>Sign-Up Date</span>
                {sortField === 'signUpDate' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('lastContacted')}
            >
              <div className="flex items-center space-x-1">
                <span>Last Contacted</span>
                {sortField === 'lastContacted' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedClinics.map((clinic) => (
            <tr 
              key={clinic.id} 
              className={`hover:bg-gray-50 ${clinic.engagementScore === 0 ? 'bg-red-50' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => onEditClinic(clinic)}>
                  {clinic.name}
                </div>
                {clinic.tags && clinic.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clinic.tags.slice(0, 2).map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {clinic.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{clinic.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{clinic.city}, {clinic.state}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{clinic.packageTier}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeClass(clinic.status || '')}`}>
                  {(clinic.status || '').charAt(0).toUpperCase() + (clinic.status || '').slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`text-sm font-medium ${getEngagementScoreColor(clinic.engagementScore ?? 0)}`}>
                  {clinic.engagementScore ?? 0}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(clinic.signUpDate || null)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(clinic.lastContacted || null)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <ClientQuickActions
                  clinic={clinic}
                  onEdit={onEditClinic}
                  onMessage={onMessageClinic}
                  onStatusChange={onStatusChange}
                  onTagsChange={onTagsChange}
                  availableTags={availableTags}
                  refreshData={refreshData}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;