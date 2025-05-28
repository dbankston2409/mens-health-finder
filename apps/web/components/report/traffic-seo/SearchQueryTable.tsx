import React, { useState } from 'react';
import { SearchQueryData } from '../../../utils/hooks/useClinicTrafficReport';
import { 
  ArrowSmallUpIcon, 
  ArrowSmallDownIcon,
  ArrowDownTrayIcon,
  TagIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface SearchQueryTableProps {
  data: SearchQueryData[];
}

type SortField = 'term' | 'clicks' | 'firstSeen' | 'lastSeen';
type SortDirection = 'asc' | 'desc';

const SearchQueryTable: React.FC<SearchQueryTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('clicks');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [taggedTerms, setTaggedTerms] = useState<string[]>([]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for clicks, ascending for others
      setSortField(field);
      setSortDirection(field === 'clicks' ? 'desc' : 'asc');
    }
  };
  
  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'term':
        comparison = a.term.localeCompare(b.term);
        break;
      case 'clicks':
        comparison = a.clicks - b.clicks;
        break;
      case 'firstSeen':
        comparison = a.firstSeen.getTime() - b.firstSeen.getTime();
        break;
      case 'lastSeen':
        comparison = a.lastSeen.getTime() - b.lastSeen.getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Handle tagging a term
  const handleTagTerm = (term: string) => {
    setTaggedTerms(prev => {
      if (prev.includes(term)) {
        return prev.filter(t => t !== term);
      } else {
        return [...prev, term];
      }
    });
  };
  
  // Handle export to CSV
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Search Term', 'Clicks', 'First Seen', 'Last Seen'];
    const rows = sortedData.map(item => [
      `"${item.term}"`,
      item.clicks.toString(),
      formatDate(item.firstSeen),
      formatDate(item.lastSeen)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `search-queries-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowSmallUpIcon className="h-4 w-4 ml-1" />
      : <ArrowSmallDownIcon className="h-4 w-4 ml-1" />;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h3 className="text-lg font-medium">Search Queries</h3>
        
        <div className="mt-3 md:mt-0 flex items-center space-x-2">
          <button
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md flex items-center text-sm"
            onClick={handleExportCSV}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No search query data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('term')}
                >
                  <div className="flex items-center">
                    Search Term
                    {getSortIcon('term')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('clicks')}
                >
                  <div className="flex items-center">
                    Clicks
                    {getSortIcon('clicks')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('firstSeen')}
                >
                  <div className="flex items-center">
                    First Seen
                    {getSortIcon('firstSeen')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastSeen')}
                >
                  <div className="flex items-center">
                    Last Seen
                    {getSortIcon('lastSeen')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.term}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.clicks}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.firstSeen)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.lastSeen)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleTagTerm(item.term)}
                      className={`inline-flex items-center px-2 py-1 rounded ${
                        taggedTerms.includes(item.term)
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {taggedTerms.includes(item.term) ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Tagged
                        </>
                      ) : (
                        <>
                          <TagIcon className="h-4 w-4 mr-1" />
                          Tag
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
        * Data shown for last 30 days. Tag terms to track them separately.
      </div>
    </div>
  );
};

export default SearchQueryTable;