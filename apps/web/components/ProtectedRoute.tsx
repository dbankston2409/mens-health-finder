import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/contexts/authContext';
import { isDevAdmin } from './DevAdminBypass';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [hasDevAdmin, setHasDevAdmin] = useState(false);

  useEffect(() => {
    // Check dev admin status on component mount and when localStorage changes
    setHasDevAdmin(isDevAdmin());
    
    const handleStorageChange = () => {
      setHasDevAdmin(isDevAdmin());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!loading) {
      // In development mode, allow dev admin bypass
      if (process.env.NODE_ENV === 'development' && hasDevAdmin && adminOnly) {
        console.log('Dev admin access granted');
        return; // Allow access
      }
      
      // Check if user is not authenticated
      if (!currentUser) {
        router.push('/login');
      } 
      // Check if admin-only route and user is not an admin
      else if (adminOnly && userData && !userData.isAdmin && userData.role !== 'admin') {
        console.log('Access denied: Admin access required');
        router.push('/dashboard');
      }
    }
  }, [currentUser, userData, loading, adminOnly, router, hasDevAdmin]);

  // Allow dev admin access in development mode
  if (process.env.NODE_ENV === 'development' && hasDevAdmin && adminOnly) {
    return <>{children}</>;
  }

  // Show loading or nothing while checking auth state
  if (loading || !currentUser || (adminOnly && userData && !userData.isAdmin && userData.role !== 'admin')) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;