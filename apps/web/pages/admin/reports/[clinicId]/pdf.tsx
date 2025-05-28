import React, { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { useAuth } from '../../../../lib/contexts/authContext';
import PrintableSEOReport from '../../../../components/report/traffic-seo/PrintableSEOReport';
import { 
  ArrowDownTrayIcon, 
  DocumentTextIcon, 
  EnvelopeIcon, 
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Dynamically import the PDF generation utility to avoid SSR issues
const DynamicPDFGenerator = dynamic(
  () => import('../../../../utils/generateClinicReportPDF').then(mod => mod.default),
  { ssr: false }
);

const ClinicReportPDFPage: React.FC = () => {
  const router = useRouter();
  const { clinicId } = router.query;
  const { userData } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Handle PDF download
  const handleDownload = async () => {
    if (!clinicId || isGenerating) return;
    
    setIsGenerating(true);
    try {
      await DynamicPDFGenerator(clinicId as string, 'download', userData?.name);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle PDF preview in new tab
  const handlePreview = async () => {
    if (!clinicId || isGenerating) return;
    
    setIsGenerating(true);
    try {
      await DynamicPDFGenerator(clinicId as string, 'preview', userData?.name);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('There was an error generating the PDF preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle sending PDF via email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || isGenerating || !emailRecipient) return;
    
    setIsGenerating(true);
    try {
      // In a real implementation, this would:
      // 1. Generate the PDF as a blob
      // 2. Upload it to storage or send directly via API
      // 3. Send an email with the PDF attached or with a download link
      
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setShowEmailForm(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending PDF via email:', error);
      alert('There was an error sending the email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <AdminLayout title="Clinic Performance Report">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to clinic
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Client-Facing Performance Report</h2>
            <p className="text-gray-500">
              A professional report to share with clinic owners and managers
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download PDF
            </button>
            
            <button
              onClick={handlePreview}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Preview
            </button>
            
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Email Report
            </button>
          </div>
        </div>
        
        {/* Email Form */}
        {showEmailForm && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium mb-3">Send Report via Email</h3>
            
            {emailSent ? (
              <div className="bg-green-900 bg-opacity-20 border border-green-700 text-green-300 px-4 py-3 rounded-md">
                <p>Email sent successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="flex gap-3">
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="Recipient Email"
                  required
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !emailRecipient}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Sending...' : 'Send'}
                </button>
              </form>
            )}
          </div>
        )}
        
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6 overflow-hidden">
          {/* PDF Report */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {clinicId ? (
              <PrintableSEOReport 
                clinicId={clinicId as string} 
                adminName={userData?.name}
              />
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-600">Loading report...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-center text-gray-500 text-sm">
          <DocumentTextIcon className="h-4 w-4 mr-1" />
          <span>
            This report is designed to be shared with clinic owners and managers to demonstrate 
            the value of Men's Health Finder in driving patient acquisition.
          </span>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClinicReportPDFPage;