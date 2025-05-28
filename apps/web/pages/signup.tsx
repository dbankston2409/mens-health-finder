import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/contexts/authContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithFacebook, updateUserData } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Create user account
      await signUp(email, password, name);
      
      // Update additional user data (zipCode, phone)
      if (zipCode || phoneNumber) {
        await updateUserData({
          zipCode: zipCode || undefined,
          phone: phoneNumber || undefined
        });
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Email already in use. Please try another email or sign in.');
      } else {
        setErrorMessage('An error occurred during sign up. Please try again.');
      }
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      router.push('/complete-profile');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no error needed
      } else {
        setErrorMessage('Failed to sign up with Google. Please try again.');
        console.error('Google signup error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      await signInWithFacebook();
      router.push('/complete-profile');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no error needed
      } else {
        setErrorMessage('Failed to sign up with Facebook. Please try again.');
        console.error('Facebook signup error:', error);
      }
    } finally {
      setIsLoading(false);
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

  return (
    <>
      <Head>
        <title>Sign Up | Men's Health Finder</title>
        <meta name="description" content="Create your Men's Health Finder account" />
      </Head>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create an Account</h1>
            <p className="text-[#AAAAAA]">Join Men's Health Finder to save clinics and more</p>
          </div>

          {errorMessage && (
            <div className="bg-red-900/40 text-white p-4 rounded-lg mb-6">
              {errorMessage}
            </div>
          )}

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
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-[#AAAAAA]">
                Password must be at least 6 characters
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#111111] text-[#AAAAAA]">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleSignup}
              className="btn-secondary flex items-center justify-center py-2"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
              Google
            </button>
            <button
              onClick={handleFacebookSignup}
              className="btn-secondary flex items-center justify-center py-2"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#AAAAAA]">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-red-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;