import React, { useState } from 'react';
import { ImportLog } from '../../../lib/firestoreClient';

interface ImportErrorDetailsProps {
  log: ImportLog;
  onClose: () => void;
}

const ImportErrorDetails: React.FC<ImportErrorDetailsProps> = ({ log, onClose }) => {
  const [selectedErrorIndex, setSelectedErrorIndex] = useState<number | null>(null);
  
  if (!log.errors || log.errors.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  No Errors
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    This import job doesn&apos;t have any detailed errors to display.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Import Errors for {log.fileName}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {log.errors.length} errors occurred during this import. Select an error to view details.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 overflow-y-auto border-r pr-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Error List</h4>
                <div className="space-y-2">
                  {log.errors.map((error, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedErrorIndex(index)}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-md ${
                        selectedErrorIndex === index
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium truncate">Error #{index + 1}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {error.error.substring(0, 40)}...
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                {selectedErrorIndex !== null && log.errors[selectedErrorIndex] ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Error Details</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-3">
                        <span className="font-semibold text-red-600">Error Message:</span>
                        <div className="mt-1 text-sm text-gray-800">
                          {log.errors[selectedErrorIndex].error}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-gray-600">Record Data:</span>
                        <pre className="mt-1 text-xs overflow-x-auto bg-gray-100 p-2 rounded">
                          {JSON.stringify(log.errors[selectedErrorIndex].record, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Select an error to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportErrorDetails;