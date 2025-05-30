import React, { useState } from 'react';
import { AffiliateType, PayoutTier } from '../../../lib/models/affiliate';

interface AffiliateFormProps {
  initialData?: {
    name: string;
    email: string;
    code: string;
    website?: string;
    phone?: string;
    type: AffiliateType;
    payoutTier: PayoutTier;
    isActive: boolean;
    notes?: string;
  };
  onSubmit: (data: {
    name: string;
    email: string;
    code: string;
    website?: string;
    phone?: string;
    type: AffiliateType;
    payoutTier: PayoutTier;
    isActive: boolean;
    notes?: string;
  }) => void;
  isSubmitting?: boolean;
}

const AffiliateForm: React.FC<AffiliateFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    code: initialData?.code || '',
    website: initialData?.website || '',
    phone: initialData?.phone || '',
    type: initialData?.type || 'influencer' as AffiliateType,
    payoutTier: initialData?.payoutTier || 'standard' as PayoutTier,
    isActive: initialData?.isActive ?? true,
    notes: initialData?.notes || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Affiliate code is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only letters, numbers, underscores, and hyphens';
    }
    
    // Optional fields with validation
    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.website)) {
      newErrors.website = 'Website URL is invalid';
    }
    
    if (formData.phone && !/^\+?[0-9()-\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Name */}
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Affiliate Name *
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.name ? 'border-red-300' : ''
              }`}
              placeholder="John Smith"
              disabled={isSubmitting}
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        {/* Email */}
        <div className="sm:col-span-3">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="mt-1">
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.email ? 'border-red-300' : ''
              }`}
              placeholder="john@example.com"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        {/* Affiliate Code */}
        <div className="sm:col-span-3">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Affiliate Code *
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="code"
              id="code"
              value={formData.code}
              onChange={handleChange}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.code ? 'border-red-300' : ''
              }`}
              placeholder="johnsmith"
              disabled={isSubmitting}
            />
          </div>
          {errors.code && (
            <p className="mt-2 text-sm text-red-600">{errors.code}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Used in links as ?ref={code}. Use only letters, numbers, underscores, and hyphens.
          </p>
        </div>
        
        {/* Type */}
        <div className="sm:col-span-3">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Affiliate Type *
          </label>
          <div className="mt-1">
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              <option value="influencer">Influencer</option>
              <option value="media">Media</option>
              <option value="clinic">Clinic</option>
              <option value="partner">Partner</option>
              <option value="employee">Employee</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        {/* Website */}
        <div className="sm:col-span-3">
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <div className="mt-1">
            <input
              type="url"
              name="website"
              id="website"
              value={formData.website}
              onChange={handleChange}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.website ? 'border-red-300' : ''
              }`}
              placeholder="https://example.com"
              disabled={isSubmitting}
            />
          </div>
          {errors.website && (
            <p className="mt-2 text-sm text-red-600">{errors.website}</p>
          )}
        </div>
        
        {/* Phone */}
        <div className="sm:col-span-3">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <div className="mt-1">
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.phone ? 'border-red-300' : ''
              }`}
              placeholder="(123) 456-7890"
              disabled={isSubmitting}
            />
          </div>
          {errors.phone && (
            <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
        
        {/* Payout Tier */}
        <div className="sm:col-span-3">
          <label htmlFor="payoutTier" className="block text-sm font-medium text-gray-700">
            Payout Tier *
          </label>
          <div className="mt-1">
            <select
              id="payoutTier"
              name="payoutTier"
              value={formData.payoutTier}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="elite">Elite</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        
        {/* Status */}
        <div className="sm:col-span-3">
          <div className="flex items-center h-5 mt-6">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
          <p className="mt-0 text-xs text-gray-500">
            Inactive affiliates cannot generate new referrals.
          </p>
        </div>
        
        {/* Notes */}
        <div className="sm:col-span-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Additional notes about this affiliate partner..."
              disabled={isSubmitting}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Internal notes visible only to administrators.
          </p>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Affiliate' : 'Create Affiliate'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AffiliateForm;