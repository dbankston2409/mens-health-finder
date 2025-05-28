import React from 'react';

interface LoadingSkeletonsProps {
  rowCount?: number;
  columnCount?: number;
}

const LoadingSkeletons: React.FC<LoadingSkeletonsProps> = ({
  rowCount = 5,
  columnCount = 7,
}) => {
  // Generate an array of rows
  const rows = Array.from({ length: rowCount });
  
  return (
    <div className="animate-pulse">
      {/* Table Header Skeleton */}
      <div className="border-b pb-4 grid grid-cols-7 gap-4 mb-2">
        {Array.from({ length: columnCount }).map((_, idx) => (
          <div 
            key={`header-${idx}`} 
            className="h-5 bg-gray-200 rounded"
          ></div>
        ))}
      </div>

      {/* Table Rows Skeletons */}
      {rows.map((_, rowIdx) => (
        <div 
          key={`row-${rowIdx}`}
          className="grid grid-cols-7 gap-4 py-3 border-b"
        >
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <div 
              key={`cell-${rowIdx}-${colIdx}`}
              className={`h-5 bg-gray-200 rounded ${
                colIdx === 0 ? 'w-3/4' : 'w-full'
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeletons: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={`card-${idx}`} className="bg-white p-4 rounded-xl shadow-md">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <div className="h-8 bg-gray-200 rounded-full w-8"></div>
            <div className="h-8 bg-gray-200 rounded-full w-8"></div>
            <div className="h-8 bg-gray-200 rounded-full w-8"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FilterSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md animate-pulse mb-4">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`filter-${idx}`} className="h-8 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-2">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
};

export default LoadingSkeletons;