import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  HomeIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  ClipboardDocumentListIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface ClinicTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const ClinicTabs: React.FC<ClinicTabsProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCardIcon className="w-5 h-5" /> },
    { id: 'traffic', label: 'Traffic', icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'reviews', label: 'Reviews', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> },
    { id: 'content', label: 'Content', icon: <DocumentTextIcon className="w-5 h-5" /> },
    { id: 'comms', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
    { id: 'logs', label: 'Logs', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
  ];

  const getActiveTabLabel = () => {
    const tab = tabs.find(tab => tab.id === activeTab);
    return tab ? tab.label : 'Overview';
  };

  return (
    <div className={`mb-6 ${className}`}>
      {/* Mobile dropdown for small screens */}
      <div className="md:hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex items-center">
            {tabs.find(tab => tab.id === activeTab)?.icon}
            <span className="ml-2 text-gray-700 dark:text-gray-200">{getActiveTabLabel()}</span>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${
            isDropdownOpen ? 'transform rotate-180' : ''
          }`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Horizontal tabs for medium and larger screens */}
      <div className="hidden md:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ClinicTabs;