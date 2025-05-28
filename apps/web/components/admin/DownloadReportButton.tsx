import React, { useState } from 'react';

interface DownloadReportButtonProps {
  clinicSlug: string;
  reportType?: 'weekly' | 'monthly' | 'quarterly';
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface ReportOptions {
  reportType: 'weekly' | 'monthly' | 'quarterly';
  theme: 'light' | 'dark';
  format: 'A4' | 'Letter';
  includeCharts: boolean;
}

const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
  clinicSlug,
  reportType = 'monthly',
  variant = 'primary',
  size = 'md',
  className = '',
  onSuccess,
  onError
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    reportType,
    theme: 'light',
    format: 'A4',
    includeCharts: true
  });

  const handleDownload = async (customOptions?: Partial<ReportOptions>) => {
    const finalOptions = { ...options, ...customOptions };
    
    setIsGenerating(true);
    
    try {
      console.log(`📊 Generating ${finalOptions.reportType} report for ${clinicSlug}`);
      
      // Calculate date range based on report type
      const endDate = new Date();
      const startDate = new Date();
      
      switch (finalOptions.reportType) {
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'quarterly':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'monthly':
        default:
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }
      
      // Call API to generate report
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicSlug,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reportType: finalOptions.reportType,
          options: {
            theme: finalOptions.theme,
            format: finalOptions.format,
            includeCharts: finalOptions.includeCharts
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${clinicSlug}-${finalOptions.reportType}-report.pdf`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Report downloaded: ${filename}`);
      
      // Track download event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'report_download', {
          event_category: 'engagement',
          event_label: finalOptions.reportType,
          clinic_slug: clinicSlug
        });
      }
      
      onSuccess?.();
      
    } catch (error) {
      console.error('❌ Report generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
      setShowOptions(false);
    }
  };

  const handleQuickDownload = () => {
    handleDownload();
  };

  const handleOptionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDownload(options);
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const variantClasses = {
      primary: 'bg-primary hover:bg-red-600 text-white focus:ring-primary',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
      icon: 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const renderButtonContent = () => {
    if (isGenerating) {
      return (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Generating...</span>
        </>
      );
    }

    if (variant === 'icon') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    return (
      <>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Download {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</span>
      </>
    );
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <div className="flex">
        <button
          onClick={handleQuickDownload}
          disabled={isGenerating}
          className={getButtonClasses()}
          title={variant === 'icon' ? `Download ${reportType} report` : undefined}
        >
          {renderButtonContent()}
        </button>
        
        {variant !== 'icon' && (
          <button
            onClick={() => setShowOptions(!showOptions)}
            disabled={isGenerating}
            className={`${getButtonClasses()} ml-1 px-2 border-l border-white/20`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Options Dropdown */}
      {showOptions && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          <form onSubmit={handleOptionsSubmit} className="p-4 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Report Options</h3>
            
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Period
              </label>
              <select
                value={options.reportType}
                onChange={(e) => setOptions(prev => ({ ...prev, reportType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="weekly">Weekly (Last 7 days)</option>
                <option value="monthly">Monthly (Last 30 days)</option>
                <option value="quarterly">Quarterly (Last 90 days)</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Theme
              </label>
              <div className="flex space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="light"
                    checked={options.theme === 'light'}
                    onChange={(e) => setOptions(prev => ({ ...prev, theme: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Light</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="dark"
                    checked={options.theme === 'dark'}
                    onChange={(e) => setOptions(prev => ({ ...prev, theme: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dark</span>
                </label>
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Format
              </label>
              <div className="flex space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="A4"
                    checked={options.format === 'A4'}
                    onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">A4</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Letter"
                    checked={options.format === 'Letter'}
                    onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Letter</span>
                </label>
              </div>
            </div>

            {/* Include Charts */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include charts and visualizations</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setShowOptions(false)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-primary hover:bg-red-600 text-white text-sm rounded-md disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Download Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DownloadReportButton;