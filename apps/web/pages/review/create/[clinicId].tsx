import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ReviewForm from '../../../components/ReviewForm';
import { useAuth } from '../../../lib/contexts/authContext';
import { mockClinics } from '../../../lib/mockData';

const CreateReview = () => {
  const router = useRouter();
  const { clinicId } = router.query;
  const { currentUser } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clinicId) {
      // In a real app, fetch the clinic data from Firestore
      // For now, we'll use our mock data
      const foundClinic = mockClinics.find(c => c.id === Number(clinicId));
      
      if (foundClinic) {
        setClinic(foundClinic);
      } else {
        // Clinic not found, redirect to dashboard
        router.push('/dashboard');
      }
      
      setIsLoading(false);
    }
  }, [clinicId, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return null; // Will redirect to dashboard
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Write a Review | Men's Health Finder</title>
        <meta name="description" content="Share your experience with this clinic" />
      </Head>
      
      <div className="min-h-screen bg-[#000000]">
        {/* Header */}
        <div className="bg-[#0A0A0A] border-b border-[#222222] py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold">Write a Review</h1>
            <p className="text-[#AAAAAA] mt-1">
              Share your experience at {clinic.name}
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Clinic Summary */}
            <div className="card p-6 mb-6 flex items-center">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-[#222] to-[#111] flex-shrink-0 mr-4"></div>
              <div>
                <h2 className="text-xl font-bold">{clinic.name}</h2>
                <p className="text-[#AAAAAA]">{clinic.city}, {clinic.state}</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4" fill={star <= Math.floor(clinic.rating) ? "currentColor" : "none"} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-[#AAAAAA] text-sm">{clinic.rating} ({clinic.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            
            {/* Review Form */}
            <ReviewForm clinicId={Number(clinicId)} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreateReview;