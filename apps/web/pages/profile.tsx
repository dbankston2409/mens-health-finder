import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../lib/contexts/authContext';

const Profile = () => {
  const { userData, updateUserData, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(userData?.name || '');
  const [zipCode, setZipCode] = useState(userData?.zipCode || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setIsLoading(true);

    try {
      await updateUserData({
        name,
        zipCode,
        phone: phoneNumber || undefined
      });
      
      setSuccessMessage('Profile updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
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

  if (!userData) {
    return null; // Protected route will handle redirecting
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Your Profile | Men's Health Finder</title>
        <meta name="description" content="Manage your Men's Health Finder profile" />
      </Head>
      
      <div className="min-h-screen bg-[#000000]">
        {/* Header */}
        <div className="bg-[#0A0A0A] border-b border-[#222222] py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
            <p className="text-[#AAAAAA] mt-1">Manage your account information</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-xl mx-auto">
            {successMessage && (
              <div className="bg-green-900/40 text-green-200 p-4 rounded-lg mb-6">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-900/40 text-white p-4 rounded-lg mb-6">
                {errorMessage}
              </div>
            )}
            
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Profile Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input w-full"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userData.email}
                    className="input w-full bg-[#171717] text-[#999999]"
                    readOnly
                    disabled
                  />
                  <p className="mt-1 text-xs text-[#AAAAAA]">
                    Email cannot be changed
                  </p>
                </div>
                
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className="input w-full"
                    placeholder="12345"
                    maxLength={5}
                    pattern="[0-9]{5}"
                  />
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
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="btn w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="card p-6 bg-[#111111]">
              <h2 className="text-xl font-bold mb-4">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Connected Account</h3>
                  <div className="flex items-center bg-[#171717] p-3 rounded-lg">
                    {userData.authProvider === 'google' && (
                      <>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#EA4335"
                              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.96 0 3.729.82 5.028 2.123l.003.003L20.71 3.351l-.003-.002C18.652 1.301 15.792 0 12 0 7.218 0 3.292 2.515 1.272 6.266L5.266 9.765z"
                            />
                            <path
                              fill="#34A853"
                              d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"
                            />
                            <path
                              fill="#4A90E2"
                              d="M19.834 11.277c0-.786-.07-1.557-.2-2.297H12v4.51h4.371a3.75 3.75 0 0 1-1.622 2.445l3.794 2.987c2.222-2.077 3.501-5.119 3.501-8.695z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.272 6.266A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"
                            />
                          </svg>
                        </div>
                        <span>Connected with Google</span>
                      </>
                    )}
                    
                    {userData.authProvider === 'facebook' && (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"/>
                          </svg>
                        </div>
                        <span>Connected with Facebook</span>
                      </>
                    )}
                    
                    {userData.authProvider === 'email' && (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span>Email and Password</span>
                      </>
                    )}
                  </div>
                </div>
                
                {userData.authProvider === 'email' && (
                  <div>
                    <button
                      className="text-primary hover:text-red-400 text-sm font-medium"
                      onClick={() => router.push('/reset-password')}
                    >
                      Change Password
                    </button>
                  </div>
                )}
                
                <div className="pt-4 border-t border-[#222222]">
                  <button
                    className="btn-secondary w-full text-white"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;