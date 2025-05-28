import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../lib/contexts/authContext';

const CompleteProfile = () => {
  const { currentUser, userData, updateUserData, loading } = useAuth();
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect to dashboard if userData is already complete
  useEffect(() => {
    if (!loading && userData?.zipCode) {
      router.push('/dashboard');
    }
  }, [userData, loading, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await updateUserData({
        zipCode,
        phone: phoneNumber || undefined
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Head>
        <title>Complete Your Profile | Men's Health Finder</title>
        <meta name="description" content="Complete your Men's Health Finder profile" />
      </Head>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-[#AAAAAA]">
              We need a bit more information to personalize your experience
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-900/40 text-white p-4 rounded-lg mb-6">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
                ZIP Code <span className="text-primary">*</span>
              </label>
              <input
                id="zipCode"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="input w-full"
                placeholder="12345"
                required
                maxLength={5}
                pattern="[0-9]{5}"
              />
              <p className="mt-1 text-xs text-[#AAAAAA]">
                We'll use this to show you nearby clinics
              </p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">
                Phone Number <span className="text-[#AAAAAA]">(optional)</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="input w-full"
                placeholder="(555) 123-4567"
              />
              <p className="mt-1 text-xs text-[#AAAAAA]">
                Only used for important notifications
              </p>
            </div>

            <button
              type="submit"
              className="btn w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Complete Profile'
              )}
            </button>

            <p className="text-center text-xs text-[#AAAAAA] mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default CompleteProfile;