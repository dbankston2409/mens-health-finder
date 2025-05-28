import React, { useState, useRef } from 'react';
import { 
  CheckIcon, 
  TagIcon, 
  DocumentArrowDownIcon,
  EllipsisHorizontalIcon 
} from '@heroicons/react/24/solid';
import { ALL_TAGS } from '../../../../utils/hooks/useValidationQueue';

interface BulkValidationControlsProps {
  selectedCount: number;
  onBulkValidate: () => void;
  onBulkAddTag: (tag: string) => void;
  onBulkRemoveTag: (tag: string) => void;
  onExportCsv: () => void;
  disabled?: boolean;
}

const BulkValidationControls: React.FC<BulkValidationControlsProps> = ({
  selectedCount,
  onBulkValidate,
  onBulkAddTag,
  onBulkRemoveTag,
  onExportCsv,
  disabled = false
}) => {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menus
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm text-gray-600 dark:text-gray-300 mr-2">
        <span className={selectedCount > 0 ? 'font-medium text-blue-600 dark:text-blue-400' : ''}>
          {selectedCount}
        </span>{' '}
        selected
      </div>

      {/* Validate Button */}
      <button
        onClick={onBulkValidate}
        disabled={selectedCount === 0 || disabled}
        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        <CheckIcon className="h-4 w-4 mr-1.5" />
        Validate All
      </button>

      {/* Tags Menu */}
      <div className="relative" ref={tagMenuRef}>
        <button
          onClick={() => setShowTagMenu(!showTagMenu)}
          disabled={selectedCount === 0 || disabled}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        >
          <TagIcon className="h-4 w-4 mr-1.5" />
          Manage Tags
        </button>

        {showTagMenu && (
          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Add Tag
              </div>
              <div className="max-h-60 overflow-y-auto">
                {ALL_TAGS.map(tag => (
                  <button
                    key={`add-${tag}`}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      onBulkAddTag(tag);
                      setShowTagMenu(false);
                    }}
                  >
                    <span className="flex-grow">{tag}</span>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  Remove Tag
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {ALL_TAGS.map(tag => (
                    <button
                      key={`remove-${tag}`}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        onBulkRemoveTag(tag);
                        setShowTagMenu(false);
                      }}
                    >
                      <span className="flex-grow">{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* More Menu */}
      <div className="relative" ref={moreMenuRef}>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          disabled={selectedCount === 0 || disabled}
          className="inline-flex items-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>

        {showMoreMenu && (
          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <button
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  onExportCsv();
                  setShowMoreMenu(false);
                }}
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export as CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkValidationControls;