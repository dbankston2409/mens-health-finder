import React, { useState, useEffect } from 'react';

interface MobileMapToggleProps {
  showMap: boolean;
  onToggle: (showMap: boolean) => void;
  mapComponent: React.ReactNode;
  listComponent: React.ReactNode;
  clinicCount: number;
}

const MobileMapToggle: React.FC<MobileMapToggleProps> = ({
  showMap,
  onToggle,
  mapComponent,
  listComponent,
  clinicCount
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (!isMobile) {
    // On desktop, show both map and list
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="order-2 lg:order-1">
          {listComponent}
        </div>
        <div className="order-1 lg:order-2">
          <div className="sticky top-24">
            {mapComponent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:hidden">
      {/* Toggle Bar */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => onToggle(false)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              !showMap
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>List</span>
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {clinicCount}
            </span>
          </button>
          
          <button
            onClick={() => onToggle(true)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              showMap
                ? 'bg-primary text-white border-b-2 border-primary'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {showMap ? (
          <div className="h-screen relative">
            {/* Full screen map */}
            <div className="absolute inset-0">
              {mapComponent}
            </div>
            
            {/* Floating mini cards */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="max-h-32 overflow-y-auto">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {/* This would be populated with mini clinic cards */}
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 min-w-[200px] border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Viewing {clinicCount} clinics</p>
                    <p className="text-sm text-white">Switch to List view to see details</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to list button */}
            <button
              onClick={() => onToggle(false)}
              className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            {/* List view */}
            {listComponent}
            
            {/* Floating map button */}
            <button
              onClick={() => onToggle(true)}
              className="fixed bottom-4 right-4 bg-primary hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors z-30"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMapToggle;