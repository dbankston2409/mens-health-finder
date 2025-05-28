import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';
import { Clinic } from '../../../../utils/hooks/useValidationQueue';

interface ValidationQueueTableProps {
  clinics: Clinic[];
  selectedClinicId: string | null;
  onSelectClinic: (clinicId: string) => void;
  onCheckWebsite: (clinicId: string, website: string) => Promise<'up' | 'down'>;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  onSelectForBulk: (clinicIds: string[]) => void;
}

const ValidationQueueTable: React.FC<ValidationQueueTableProps> = ({
  clinics,
  selectedClinicId,
  onSelectClinic,
  onCheckWebsite,
  onLoadMore,
  hasMore,
  loading,
  onSelectForBulk
}) => {
  const [checkingWebsiteIds, setCheckingWebsiteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement>(null);

  // Setup infinite scrolling with Intersection Observer
  useEffect(() => {
    if (loading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadingIndicatorRef.current) {
      observerRef.current.observe(loadingIndicatorRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, onLoadMore]);

  // Handler for website status check
  const handleCheckWebsite = async (clinicId: string, website: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!website || checkingWebsiteIds.includes(clinicId)) return;
    
    setCheckingWebsiteIds((prev) => [...prev, clinicId]);
    
    try {
      await onCheckWebsite(clinicId, website);
    } finally {
      setCheckingWebsiteIds((prev) => prev.filter((id) => id !== clinicId));
    }
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Get website status indicator
  const getWebsiteStatusIndicator = (clinic: Clinic) => {
    const isChecking = checkingWebsiteIds.includes(clinic.id);
    
    if (isChecking) {
      return (
        <div className="inline-flex items-center text-gray-600 animate-pulse">
          <GlobeAltIcon className="h-5 w-5" />
        </div>
      );
    }

    if (!clinic.website) {
      return (
        <span className="text-gray-400 italic text-xs">No website</span>
      );
    }

    if (clinic.websiteStatus === 'up') {
      return (
        <div className="inline-flex items-center text-green-600 dark:text-green-400">
          <CheckIcon className="h-5 w-5" />
        </div>
      );
    } else if (clinic.websiteStatus === 'down') {
      return (
        <div className="inline-flex items-center text-red-600 dark:text-red-400">
          <XMarkIcon className="h-5 w-5" />
        </div>
      );
    }

    return (
      <button
        onClick={(e) => handleCheckWebsite(clinic.id, clinic.website, e)}
        className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        title="Check website status"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </button>
    );
  };

  // Get tag pills
  const getTagPills = (tags: string[]) => {
    // Only show validation tags
    const validationTags = tags.filter(tag => 
      ['needs-review', 'website-down', 'geo-mismatch', 'incomplete-profile', 'manual-check'].includes(tag)
    );
    
    if (validationTags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1">
        {validationTags.map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Handle row selection for bulk actions
  const handleRowSelect = (clinicId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    const checked = e.target.checked;
    
    if (checked) {
      setSelectedIds((prev) => [...prev, clinicId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== clinicId));
    }
  };

  // Handle select all toggle
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      setSelectedIds(clinics.map((clinic) => clinic.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Update bulk selection when selectedIds changes
  useEffect(() => {
    onSelectForBulk(selectedIds);
  }, [selectedIds, onSelectForBulk]);

  // Reset select all when clinics change
  useEffect(() => {
    setSelectAll(false);
    setSelectedIds([]);
  }, [clinics]);

  return (
    <div ref={tableRef} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Clinic Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              City, State
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tags
            </th>
            <th scope="col" className="px-3 py-3.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Website
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {clinics.map((clinic) => (
            <tr
              key={clinic.id}
              onClick={() => onSelectClinic(clinic.id)}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                selectedClinicId === clinic.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : ''
              }`}
            >
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(clinic.id)}
                    onChange={(e) => handleRowSelect(clinic.id, e)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {clinic.name}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {clinic.city}, {clinic.state}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {getTagPills(clinic.tags || [])}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-center">
                {getWebsiteStatusIndicator(clinic)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(clinic.updatedAt)}
                </div>
              </td>
            </tr>
          ))}

          {/* Loading indicator for infinite scroll */}
          {hasMore && (
            <tr>
              <td colSpan={6} className="px-3 py-4 text-center">
                <div ref={loadingIndicatorRef} className="flex justify-center items-center py-2">
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Scroll for more
                    </span>
                  )}
                </div>
              </td>
            </tr>
          )}

          {/* Empty state */}
          {clinics.length === 0 && !loading && (
            <tr>
              <td colSpan={6} className="px-3 py-12 text-center">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium mb-1">No clinics in validation queue</p>
                  <p className="text-sm">All clinics have been reviewed or no clinics match your filters.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ValidationQueueTable;