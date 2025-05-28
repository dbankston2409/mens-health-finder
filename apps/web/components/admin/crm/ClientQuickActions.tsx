import React, { useState } from 'react';

interface ClientQuickActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
}

const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({ 
  selectedCount, 
  onAction 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-[#111111] border-t border-[#222222] animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">{selectedCount}</span> clients selected
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md flex items-center"
            >
              <span>Bulk Actions</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => {
                      onAction('email');
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                    role="menuitem"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => {
                      onAction('export');
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                    role="menuitem"
                  >
                    Export Selected
                  </button>
                  <button
                    onClick={() => {
                      onAction('tag');
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                    role="menuitem"
                  >
                    Add Tag
                  </button>
                  <button
                    onClick={() => {
                      onAction('status');
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                    role="menuitem"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => {
                      onAction('salesRep');
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                    role="menuitem"
                  >
                    Assign Sales Rep
                  </button>
                  <div className="border-t border-gray-700"></div>
                  <button
                    onClick={() => {
                      onAction('delete');
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                    role="menuitem"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => onAction('email')}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={() => onAction('export')}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientQuickActions;