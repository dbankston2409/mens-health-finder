import { useEffect } from 'react';
import { useRouter } from 'next/router';

// This is a convenience redirect to the overview page
export default function AdminIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/overview');
  }, [router]);
  
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg">Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
}