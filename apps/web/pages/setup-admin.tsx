import { useState } from 'react';
import { useAuth } from '../lib/contexts/authContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';

const SetupAdmin = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const makeAdmin = async () => {
    if (!currentUser || !userData) {
      setMessage('Please log in first');
      return;
    }

    if (currentUser.email !== 'don@dadtriibe.com') {
      setMessage('This setup is only for don@dadtriibe.com');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin',
        isAdmin: true,
        updatedAt: new Date()
      });
      
      setMessage('✅ Admin privileges granted! You can now access /admin/overview');
      
      // Refresh the page after 2 seconds to reload user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error making admin:', error);
      setMessage('❌ Error granting admin privileges. Please use Firebase Console method.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Setup Admin | Men's Health Finder</title>
      </Head>
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="bg-[#111] rounded-xl p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Setup</h1>
          
          {currentUser ? (
            <div className="space-y-4">
              <p className="text-[#AAAAAA]">
                Logged in as: <span className="text-white">{currentUser.email}</span>
              </p>
              
              {userData?.isAdmin ? (
                <div className="bg-green-900/30 text-green-400 p-4 rounded-lg">
                  ✅ You already have admin privileges!
                  <br />
                  <a href="/admin/overview" className="text-primary hover:underline">
                    Go to Admin Dashboard
                  </a>
                </div>
              ) : (
                <>
                  <button
                    onClick={makeAdmin}
                    disabled={loading}
                    className="btn w-full"
                  >
                    {loading ? 'Setting up admin...' : 'Grant Admin Privileges'}
                  </button>
                  
                  {message && (
                    <div className={`p-4 rounded-lg ${
                      message.includes('✅') 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {message}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#AAAAAA] mb-4">Please log in first</p>
              <a href="/login" className="btn">
                Go to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SetupAdmin;