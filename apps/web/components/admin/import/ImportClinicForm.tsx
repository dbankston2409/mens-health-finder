import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon, ExclamationTriangleIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

import { ImportOptions } from '../../../utils/hooks/useClinicImport';

interface ImportClinicFormProps {
  onImportComplete?: (file: File, options: ImportOptions) => Promise<void>;
}

const ImportClinicForm: React.FC<ImportClinicFormProps> = ({ onImportComplete }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [importOptions, setImportOptions] = useState({
    mergeWithExisting: true,
    checkForDuplicates: true,
    backfillMissingData: false,
    importSource: 'admin-ui'
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importId?: string;
    message?: string;
    error?: string;
  } | null>(null);

  // Update import options
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setImportOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setImportResult(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      return;
    }
    
    const file = fileInputRef.current.files[0];
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Start the simulated progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 15);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Call the onImportComplete callback with file and options
      if (onImportComplete) {
        await onImportComplete(file, importOptions);
      }
      
      // Clear the progress interval
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setImportResult({
        success: true,
        message: 'Import started successfully. Processing is continuing in the background.'
      });
    } catch (error) {
      console.error('Error during import:', error);
      
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during import'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Import Clinics</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV or JSON file to import clinic data
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* File input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinic Data File
          </label>
          
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                stroke="currentColor" 
                fill="none" 
                viewBox="0 0 48 48" 
                aria-hidden="true"
              >
                <path 
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                  strokeWidth={2}
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
              
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only"
                    accept=".csv,.json"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                CSV or JSON up to 10MB
              </p>
              
              {fileName && (
                <p className="text-sm text-indigo-600 mt-2">
                  Selected: {fileName}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Basic import options */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-medium text-gray-900">Import Options</h4>
            <button
              type="button"
              className="text-sm text-indigo-600 hover:text-indigo-700 focus:outline-none flex items-center"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
              <ChevronUpDownIcon className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Merge option */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="mergeWithExisting"
                  name="mergeWithExisting"
                  type="checkbox"
                  checked={importOptions.mergeWithExisting}
                  onChange={handleOptionChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="mergeWithExisting" className="font-medium text-gray-700">
                  Merge with existing records
                </label>
                <p className="text-gray-500">
                  When a duplicate is found, merge the new data with the existing record instead of skipping it
                </p>
              </div>
            </div>
            
            {/* Check duplicates option */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="checkForDuplicates"
                  name="checkForDuplicates"
                  type="checkbox"
                  checked={importOptions.checkForDuplicates}
                  onChange={handleOptionChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="checkForDuplicates" className="font-medium text-gray-700">
                  Check for duplicates
                </label>
                <p className="text-gray-500">
                  Look for existing clinics with same name, address, or phone to prevent duplicates
                </p>
              </div>
            </div>
            
            {/* Advanced options */}
            {showAdvancedOptions && (
              <>
                {/* Backfill missing data */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="backfillMissingData"
                      name="backfillMissingData"
                      type="checkbox"
                      checked={importOptions.backfillMissingData}
                      onChange={handleOptionChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="backfillMissingData" className="font-medium text-gray-700">
                      Backfill missing data
                    </label>
                    <p className="text-gray-500">
                      Attempt to fill in missing information using geocoding and web scraping
                    </p>
                  </div>
                </div>
                
                {/* Import source */}
                <div>
                  <label htmlFor="importSource" className="block text-sm font-medium text-gray-700">
                    Import Source
                  </label>
                  <select
                    id="importSource"
                    name="importSource"
                    value={importOptions.importSource}
                    onChange={handleOptionChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="admin-ui">Admin UI</option>
                    <option value="csv-import">CSV Import</option>
                    <option value="api">API</option>
                    <option value="migration">Data Migration</option>
                    <option value="web-scraper">Web Scraper</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Upload progress */}
        {isUploading && (
          <div className="mb-6">
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Progress: {uploadProgress}%
            </label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Result message */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-md ${
            importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {importResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {importResult.success ? 'Import Successful' : 'Import Failed'}
                </h3>
                <div className="mt-2 text-sm">
                  <p>
                    {importResult.message || importResult.error || 'Unknown error occurred'}
                  </p>
                  {importResult.importId && (
                    <p className="mt-1">
                      Import ID: <span className="font-mono">{importResult.importId}</span>
                    </p>
                  )}
                </div>
                {importResult.success && importResult.importId && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/admin/import-logs')}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View Import Logs →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => router.push('/admin/import-logs')}
            className="mr-4 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!fileName || isUploading}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Start Import'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportClinicForm;