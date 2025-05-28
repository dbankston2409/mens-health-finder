import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface LeadCaptureFormProps {
  clinicSlug: string;
  clinicName: string;
  source?: 'profile-cta' | 'directory-landing' | 'search-results' | 'emergency-banner';
  variant?: 'compact' | 'full' | 'sidebar';
  showMessage?: boolean;
  onSuccess?: (leadId: string) => void;
  className?: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function LeadCaptureForm({ 
  clinicSlug, 
  clinicName,
  source = 'profile-cta',
  variant = 'full',
  showMessage = true,
  onSuccess,
  className = ''
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create lead document
      const leadData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        clinicSlug,
        clinicName,
        source,
        createdAt: serverTimestamp(),
        status: 'new',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      };
      
      const leadsRef = collection(db, 'leads');
      const docRef = await addDoc(leadsRef, leadData);
      
      // Track analytics event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'lead_submit', {
          clinic_slug: clinicSlug,
          source: source,
          value: 1
        });
      }
      
      // Track lead session event
      await trackLeadEvent('form-submitted', {
        leadId: docRef.id,
        clinicSlug,
        source
      });
      
      setSubmitted(true);
      
      if (onSuccess) {
        onSuccess(docRef.id);
      }
      
      // Reset form after delay
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', message: '' });
        setSubmitted(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'max-w-md mx-auto';
      case 'sidebar':
        return 'max-w-sm';
      default:
        return 'max-w-lg mx-auto';
    }
  };

  const getFieldStyles = () => {
    const base = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    return variant === 'compact' ? `${base} text-sm` : base;
  };

  if (submitted) {
    return (
      <div className={`${getVariantStyles()} ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-2xl mb-2">✓</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Thank you!
          </h3>
          <p className="text-green-700 mb-4">
            Your message has been sent to {clinicName}. 
            They'll contact you within 24 hours.
          </p>
          <div className="text-sm text-green-600">
            <p>✓ Lead submitted successfully</p>
            <p>✓ Clinic notified</p>
            <p>✓ You'll receive a confirmation email</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className={`font-semibold text-gray-900 ${variant === 'compact' ? 'text-lg' : 'text-xl'}`}>
            Contact {clinicName}
          </h3>
          <p className={`text-gray-600 ${variant === 'compact' ? 'text-sm' : 'text-base'}`}>
            Get a quick response from this clinic
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={getFieldStyles()}
              placeholder="Your full name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={getFieldStyles()}
              placeholder="your.email@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={getFieldStyles()}
              placeholder="(555) 123-4567"
              required
            />
          </div>
          
          {showMessage && (
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message {variant !== 'compact' && '(Optional)'}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={variant === 'compact' ? 2 : 3}
                className={getFieldStyles()}
                placeholder="Tell them about your needs, questions, or preferred contact time..."
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              variant === 'compact' ? 'text-sm py-2' : 'text-base py-3'
            }`}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Your information is secure and will only be shared with {clinicName}</p>
            {variant !== 'compact' && (
              <p className="mt-1">
                By submitting, you agree to receive follow-up communication from this clinic
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function trackLeadEvent(action: string, data: any): Promise<void> {
  try {
    // Import and use lead session tracking
    const { trackSessionEvent } = await import('../utils/hooks/AnonymousLeadSession');
    await trackSessionEvent(action, data);
  } catch (error) {
    console.error('Error tracking lead event:', error);
  }
}