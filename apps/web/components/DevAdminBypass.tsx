import React, { useState } from 'react';
import { useRouter } from 'next/router';

// Development mode admin bypass component
// This allows admin access when Firebase is not properly connected

interface DevAdminBypassProps {
  onAdminLogin: () => void;
}

export const DevAdminBypass: React.FC<DevAdminBypassProps> = ({ onAdminLogin }) => {
  const [showBypass, setShowBypass] = useState(false);
  const router = useRouter();

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleDevAdminLogin = () => {
    // Set admin flag in localStorage for development
    localStorage.setItem('dev_admin_user', JSON.stringify({
      uid: 'dev-admin-123',
      email: 'admin@test.com',
      displayName: 'Dev Admin',
      isAdmin: true,
      accessToken: 'dev-token'
    }));
    
    // Call the callback
    onAdminLogin();
    
    // Redirect to admin dashboard
    router.push('/admin');
  };

  const handleDevUserLogin = () => {
    // Set regular user flag in localStorage for development
    localStorage.setItem('dev_admin_user', JSON.stringify({
      uid: 'dev-user-123',
      email: 'user@test.com', 
      displayName: 'Dev User',
      isAdmin: false,
      accessToken: 'dev-token'
    }));
    
    onAdminLogin();
    router.push('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('dev_admin_user');
    onAdminLogin(); // Refresh auth state
    router.push('/');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!showBypass ? (
        <button
          onClick={() => setShowBypass(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg hover:bg-purple-700"
        >
          Dev Mode
        </button>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Development Mode</h3>
            <button
              onClick={() => setShowBypass(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleDevAdminLogin}
              className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
            >
              Login as Admin
            </button>
            
            <button
              onClick={handleDevUserLogin}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
            >
              Login as User
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            <p>Firebase not connected.</p>
            <p>Using mock authentication.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook to get current dev user
export const useDevAuth = () => {
  const [devUser, setDevUser] = useState<any>(null);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('dev_admin_user');
      if (storedUser) {
        try {
          setDevUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing dev user:', e);
        }
      }
    }
  }, []);
  
  return devUser;
};

// Helper to check if current user is dev admin
export const isDevAdmin = (): boolean => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  try {
    const storedUser = localStorage.getItem('dev_admin_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.isAdmin === true;
    }
  } catch (e) {
    console.error('Error checking dev admin status:', e);
  }
  
  return false;
};