import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/contexts/authContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      await resetPassword(email);
      setMessage({
        type: 'success',
        text: 'Password reset email sent. Check your inbox for further instructions.'
      });
      setEmail(''); // Clear email field after successful request
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setMessage({
          type: 'error',
          text: 'No account found with this email address.'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'An error occurred. Please try again later.'
        });
        console.error('Reset password error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | Men's Health Finder</title>
        <meta name="description" content="Reset your Men's Health Finder password" />
      </Head>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-[#AAAAAA]">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {message.text && (
            <div 
              className={`${
                message.type === 'success' ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-white'
              } p-4 rounded-lg mb-6`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
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
                  Sending...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-primary hover:text-red-400 text-sm font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;