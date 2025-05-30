import React, { useState } from 'react';
import { Affiliate, COMMISSION_RATES } from '../../../lib/models/affiliate';
import { updateAffiliate } from '../../../lib/api/affiliateService';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AffiliateInfoSectionProps {
  affiliate: Affiliate;
}

const AffiliateInfoSection: React.FC<AffiliateInfoSectionProps> = ({ affiliate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    website: affiliate.website || '',
    phone: affiliate.phone || '',
    paymentMethod: affiliate.paymentMethod || 'paypal',
    paymentDetails: affiliate.paymentDetails?.accountId || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save changes
  const handleSave = async () => {
    if (!affiliate.id) return;
    
    try {
      setIsSaving(true);
      
      // Format payment details
      const paymentDetails: Record<string, any> = {};
      
      if (editData.paymentMethod === 'paypal') {
        paymentDetails.accountId = editData.paymentDetails;
      } else if (editData.paymentMethod === 'ach') {
        paymentDetails.accountNumber = editData.paymentDetails;
      } else {
        paymentDetails.details = editData.paymentDetails;
      }
      
      // Update in Firestore
      await updateAffiliate(affiliate.id, {
        website: editData.website,
        phone: editData.phone,
        paymentMethod: editData.paymentMethod as 'paypal' | 'ach' | 'check' | 'other',
        paymentDetails
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating affiliate:', error);
      alert('Failed to update affiliate information.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    // Reset form data to original
    setEditData({
      website: affiliate.website || '',
      phone: affiliate.phone || '',
      paymentMethod: affiliate.paymentMethod || 'paypal',
      paymentDetails: affiliate.paymentDetails?.accountId || ''
    });
    
    setIsEditing(false);
  };
  
  // Get commission rates for the tier
  const commissionRates = COMMISSION_RATES[affiliate.payoutTier] || COMMISSION_RATES.standard;
  
  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Affiliate Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Contact details and account information.
            </p>
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* Name */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {affiliate.name}
              </dd>
            </div>
            
            {/* Email */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {affiliate.email}
              </dd>
            </div>
            
            {/* Website */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={editData.website}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://example.com"
                    disabled={isSaving}
                  />
                ) : affiliate.website ? (
                  <a 
                    href={affiliate.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {affiliate.website}
                  </a>
                ) : (
                  <span className="text-gray-500">Not provided</span>
                )}
              </dd>
            </div>
            
            {/* Phone */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="(123) 456-7890"
                    disabled={isSaving}
                  />
                ) : affiliate.phone || (
                  <span className="text-gray-500">Not provided</span>
                )}
              </dd>
            </div>
            
            {/* Affiliate Code */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Affiliate Code</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="font-mono">{affiliate.code}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Example link: https://menshealthfinder.com/?ref={affiliate.code}
                </div>
              </dd>
            </div>
            
            {/* Payment Method */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <div className="space-y-3">
                    <select
                      name="paymentMethod"
                      value={editData.paymentMethod}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      disabled={isSaving}
                    >
                      <option value="paypal">PayPal</option>
                      <option value="ach">Bank Transfer (ACH)</option>
                      <option value="check">Check</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      name="paymentDetails"
                      value={editData.paymentDetails}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder={
                        editData.paymentMethod === 'paypal' ? 'PayPal email or ID' :
                        editData.paymentMethod === 'ach' ? 'Account details' :
                        'Payment details'
                      }
                      disabled={isSaving}
                    />
                  </div>
                ) : affiliate.paymentMethod ? (
                  <>
                    <div className="font-medium capitalize">{affiliate.paymentMethod}</div>
                    <div className="text-gray-500 text-sm">
                      {affiliate.paymentMethod === 'paypal' && affiliate.paymentDetails?.accountId && (
                        <span>PayPal ID: {affiliate.paymentDetails.accountId}</span>
                      )}
                      {affiliate.paymentMethod === 'ach' && affiliate.paymentDetails?.accountNumber && (
                        <span>Account: {affiliate.paymentDetails.accountNumber}</span>
                      )}
                      {affiliate.paymentMethod === 'check' && (
                        <span>Payment by check</span>
                      )}
                      {affiliate.paymentMethod === 'other' && affiliate.paymentDetails?.details && (
                        <span>{affiliate.paymentDetails.details}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </dd>
            </div>
            
            {/* Join Date */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Join Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(affiliate.createdAt)}
              </dd>
            </div>
            
            {/* Last Updated */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {affiliate.lastUpdated ? formatDate(affiliate.lastUpdated) : 'Never'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Commission Rates */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Commission Rates
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Current commission structure for this affiliate.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Commission
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Profile View
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${commissionRates.view.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Per unique profile view
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Phone Call
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${commissionRates.call.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Per tracked phone call
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Clinic Signup
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${commissionRates.signup.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Per new clinic signup
                </td>
              </tr>
              {affiliate.payoutTier === 'custom' && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-500 italic">
                    This affiliate has custom rates. Edit in the affiliate settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AffiliateInfoSection;