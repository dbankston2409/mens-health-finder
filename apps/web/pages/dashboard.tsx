import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../lib/contexts/authContext';
import { collection, query, where, getDocs, orderBy, limit, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockClinics } from '../lib/mockData';

// Type for clinic data
interface Clinic {
  id: number;
  name: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  tier: 'free' | 'low' | 'high';
  services: string[];
  address?: string;
  phone?: string;
}

// Type for saved provider data
interface SavedProvider {
  id: string;
  clinicId: number;
  userId: string;
  createdAt: Date;
  clinic?: Clinic;
}

// Type for user review data
interface UserReview {
  id: string;
  clinicId: number;
  userId: string;
  rating: number;
  text: string;
  createdAt: Date;
  clinic?: Clinic;
}

const UserDashboard = () => {
  const { userData, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [localClinics, setLocalClinics] = useState<Clinic[]>([]);
  const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([]);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Development mode fallback data
  const devMockUserData = {
    uid: 'dev-user',
    name: 'Development User',
    email: 'dev@test.com',
    authProvider: 'email',
    createdAt: new Date(),
    savedProviders: [],
    reviewsCount: 0,
    zipCode: '90210'
  } as const;

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser || !userData) return;
      
      setIsLoading(true);
      
      try {
        // Using mock data in development to bypass Firebase permission issues
        if (process.env.NODE_ENV === 'development') {
          // Create sample saved providers
          const savedProvidersData = [1, 4, 7].map((clinicId, index) => ({
            id: `mock-saved-${index}`,
            userId: currentUser.uid,
            clinicId,
            createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)),
            clinic: mockClinics.find(clinic => clinic.id === clinicId)
          })) as SavedProvider[];
          
          setSavedProviders(savedProvidersData);
          
          // Create sample user reviews
          const reviewsData = [2, 5, 8].map((clinicId, index) => ({
            id: `mock-review-${index}`,
            userId: currentUser.uid,
            clinicId,
            rating: 4 + (index % 2),
            text: `This is a sample review ${index + 1} for testing purposes. The staff was great and the facility was clean.`,
            createdAt: new Date(Date.now() - (index * 15 * 24 * 60 * 60 * 1000)),
            clinic: mockClinics.find(clinic => clinic.id === clinicId)
          })) as UserReview[];
          
          setUserReviews(reviewsData);
          
          // Filter local clinics by zip code and sort by tier
          const sortedClinics = [...mockClinics].sort((a, b) => {
            const tierOrder = { 'high': 0, 'low': 1, 'free': 2 };
            return tierOrder[a.tier] - tierOrder[b.tier];
          });
          
          setLocalClinics(sortedClinics);
          
          setIsLoading(false);
          return;
        }
        
        // Real Firebase queries for production
        // Fetch saved providers
        const savedProvidersRef = collection(db, 'savedProviders');
        const savedProvidersQuery = query(
          savedProvidersRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const savedProvidersSnapshot = await getDocs(savedProvidersQuery);
        const savedProvidersData = savedProvidersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          // Add clinic details by matching with mockClinics
          clinic: mockClinics.find(clinic => clinic.id === doc.data().clinicId)
        })) as SavedProvider[];
        
        setSavedProviders(savedProvidersData);
        
        // Fetch user reviews
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(
          reviewsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          // Add clinic details by matching with mockClinics
          clinic: mockClinics.find(clinic => clinic.id === doc.data().clinicId)
        })) as UserReview[];
        
        setUserReviews(reviewsData);
        
        // Filter local clinics by zip code and sort by tier
        if (userData.zipCode) {
          // In a real implementation, we would filter based on proximity to zipCode
          // For now, we'll just sort the mockClinics by tier
          const sortedClinics = [...mockClinics].sort((a, b) => {
            const tierOrder = { 'high': 0, 'low': 1, 'free': 2 };
            return tierOrder[a.tier] - tierOrder[b.tier];
          });
          
          setLocalClinics(sortedClinics);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser, userData]);

  const handleSaveProvider = async (clinicId: number) => {
    if (!currentUser) return;
    
    try {
      // Check if already saved
      const existingSaved = savedProviders.find(p => p.clinicId === clinicId);
      
      // Use mock data in development
      if (process.env.NODE_ENV === 'development') {
        if (existingSaved) {
          // Remove from saved providers
          setSavedProviders(prev => prev.filter(p => p.id !== existingSaved.id));
        } else {
          // Add to saved providers
          const clinic = mockClinics.find(c => c.id === clinicId);
          if (clinic) {
            const newSavedProvider = {
              id: `mock-saved-${Date.now()}`,
              userId: currentUser.uid,
              clinicId,
              createdAt: new Date(),
              clinic
            };
            setSavedProviders(prev => [newSavedProvider, ...prev]);
          }
        }
        return;
      }
      
      // Real Firebase operations for production
      if (existingSaved) {
        // Remove from saved providers
        await deleteDoc(doc(db, 'savedProviders', existingSaved.id));
        
        // Update local state
        setSavedProviders(prev => prev.filter(p => p.id !== existingSaved.id));
      } else {
        // Add to saved providers
        const newSavedRef = await addDoc(collection(db, 'savedProviders'), {
          userId: currentUser.uid,
          clinicId,
          createdAt: new Date()
        });
        
        // Update local state
        const clinic = mockClinics.find(c => c.id === clinicId);
        if (clinic) {
          setSavedProviders(prev => [
            {
              id: newSavedRef.id,
              userId: currentUser.uid,
              clinicId,
              createdAt: new Date(),
              clinic
            },
            ...prev
          ]);
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving provider:', error);
    }
  };

  // Use development fallback if userData is missing in development mode
  const effectiveUserData = userData || (process.env.NODE_ENV === 'development' ? devMockUserData : null);

  if (!effectiveUserData) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-white">Loading your dashboard...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-2 text-sm text-gray-400">Debug: userData is null, currentUser: {currentUser ? 'exists' : 'null'}</p>
          )}
        </div>
      </div>
    );
  }

  // Function to get the first name
  const getFirstName = () => {
    return effectiveUserData.name.split(' ')[0];
  };

  // Function to check if a clinic is saved
  const isClinicSaved = (clinicId: number) => {
    return savedProviders.some(p => p.clinicId === clinicId);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard | Men's Health Finder</title>
        <meta name="description" content="Your Men's Health Finder dashboard" />
      </Head>
      
      <div className="min-h-screen bg-[#000000]">
        {/* Dashboard Header */}
        <div className="bg-[#0A0A0A] border-b border-[#222222] py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {getFirstName()}</h1>
                <p className="text-[#AAAAAA] mt-1">
                  {savedProviders.length > 0 ? (
                    <>You have <span className="text-primary">{savedProviders.length}</span> saved providers and <span className="text-primary">{userReviews.length}</span> reviews</>
                  ) : (
                    <>Find and save providers to keep track of them here</>
                  )}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link 
                  href="/search" 
                  className="btn py-2 px-4 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Clinics
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Tabs */}
        <div className="border-b border-[#222222]">
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'home'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#AAAAAA] hover:text-white'
                } transition-colors`}
                onClick={() => setActiveTab('home')}
              >
                Home
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'saved'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#AAAAAA] hover:text-white'
                } transition-colors`}
                onClick={() => setActiveTab('saved')}
              >
                Saved Providers
                {savedProviders.length > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                    {savedProviders.length}
                  </span>
                )}
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#AAAAAA] hover:text-white'
                } transition-colors`}
                onClick={() => setActiveTab('reviews')}
              >
                My Reviews
                {userReviews.length > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                    {userReviews.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {/* Home Tab */}
          {!isLoading && activeTab === 'home' && (
            <div>
              {effectiveUserData.zipCode ? (
                <>
                  <h2 className="text-xl font-bold mb-6">
                    Clinics near {effectiveUserData.zipCode}
                  </h2>
                  
                  {localClinics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {localClinics.slice(0, 6).map((clinic) => (
                        <div key={clinic.id} className="card overflow-hidden">
                          <div className="h-40 bg-gradient-to-r from-[#222] to-[#111] relative">
                            {clinic.tier === 'high' && (
                              <div className="absolute top-3 right-3 bg-[#FF3B3B] text-white text-xs px-2 py-1 rounded-md">
                                PREMIUM
                              </div>
                            )}
                            {clinic.tier === 'low' && (
                              <div className="absolute top-3 right-3 bg-yellow-600 text-white text-xs px-2 py-1 rounded-md">
                                ENHANCED
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold mb-1">{clinic.name}</h3>
                            <p className="text-[#AAAAAA] text-sm mb-3">{clinic.city}, {clinic.state}</p>
                            
                            <div className="flex items-center mb-4">
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg key={star} className="w-4 h-4" fill={star <= Math.floor(clinic.rating) ? "currentColor" : "none"} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="ml-2 text-[#AAAAAA] text-sm">{clinic.rating} ({clinic.reviewCount})</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              {clinic.services.slice(0, 3).map((service) => (
                                <span key={service} className="badge">
                                  {service}
                                </span>
                              ))}
                              {clinic.services.length > 3 && (
                                <span className="badge">+{clinic.services.length - 3}</span>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Link href={`/clinic/${clinic.id}`} className="btn flex-1 py-2 px-0">
                                View Profile
                              </Link>
                              <button
                                className={`flex-none py-2 px-3 rounded-xl transition-colors ${
                                  isClinicSaved(clinic.id)
                                    ? 'bg-primary hover:bg-red-700 text-white'
                                    : 'bg-[#222222] hover:bg-[#333333] text-white'
                                }`}
                                onClick={() => handleSaveProvider(clinic.id)}
                                aria-label={isClinicSaved(clinic.id) ? "Remove from saved" : "Save provider"}
                              >
                                <svg className="w-5 h-5" fill={isClinicSaved(clinic.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#111] rounded-xl p-8 text-center">
                      <p className="text-lg mb-4">No clinics found in your area.</p>
                      <Link href="/search" className="btn py-2 px-4">
                        Search in Another Area
                      </Link>
                    </div>
                  )}
                  
                  {localClinics.length > 6 && (
                    <div className="mt-8 text-center">
                      <Link href="/search" className="btn py-2 px-8">
                        View All Clinics
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#111] rounded-xl p-8 text-center">
                  <h2 className="text-xl font-bold mb-4">Update your ZIP Code</h2>
                  <p className="text-[#AAAAAA] max-w-lg mx-auto mb-6">
                    Adding your ZIP code helps us show you the closest men's health clinics in your area.
                  </p>
                  <Link href="/profile" className="btn py-2 px-6">
                    Update Profile
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Saved Providers Tab */}
          {!isLoading && activeTab === 'saved' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                Your Saved Providers
              </h2>
              
              {savedProviders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProviders.map((savedProvider) => {
                    const clinic = savedProvider.clinic;
                    if (!clinic) return null;
                    
                    return (
                      <div key={savedProvider.id} className="card overflow-hidden">
                        <div className="h-40 bg-gradient-to-r from-[#222] to-[#111] relative">
                          {clinic.tier === 'high' && (
                            <div className="absolute top-3 right-3 bg-[#FF3B3B] text-white text-xs px-2 py-1 rounded-md">
                              PREMIUM
                            </div>
                          )}
                          {clinic.tier === 'low' && (
                            <div className="absolute top-3 right-3 bg-yellow-600 text-white text-xs px-2 py-1 rounded-md">
                              ENHANCED
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-1">{clinic.name}</h3>
                          <p className="text-[#AAAAAA] text-sm mb-3">{clinic.city}, {clinic.state}</p>
                          
                          <div className="flex items-center mb-4">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="w-4 h-4" fill={star <= Math.floor(clinic.rating) ? "currentColor" : "none"} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-2 text-[#AAAAAA] text-sm">{clinic.rating} ({clinic.reviewCount})</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {clinic.services.slice(0, 3).map((service) => (
                              <span key={service} className="badge">
                                {service}
                              </span>
                            ))}
                            {clinic.services.length > 3 && (
                              <span className="badge">+{clinic.services.length - 3}</span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Link href={`/clinic/${clinic.id}`} className="btn flex-1 py-2 px-0">
                              View Profile
                            </Link>
                            <button
                              className="bg-primary hover:bg-red-700 text-white flex-none py-2 px-3 rounded-xl transition-colors"
                              onClick={() => handleSaveProvider(clinic.id)}
                              aria-label="Remove from saved"
                            >
                              <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#111] rounded-xl p-8 text-center">
                  <p className="text-lg mb-4">You haven't saved any clinics yet.</p>
                  <Link href="/search" className="btn py-2 px-4">
                    Find Clinics
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Reviews Tab */}
          {!isLoading && activeTab === 'reviews' && (
            <div>
              <h2 className="text-xl font-bold mb-6">
                Your Reviews
              </h2>
              
              {userReviews.length > 0 ? (
                <div className="space-y-6">
                  {userReviews.map((review) => {
                    const clinic = review.clinic;
                    if (!clinic) return null;
                    
                    return (
                      <div key={review.id} className="card p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <Link href={`/clinic/${clinic.id}`} className="text-xl font-bold hover:text-primary transition-colors">
                              {clinic.name}
                            </Link>
                            <p className="text-[#AAAAAA] mb-2">{clinic.city}, {clinic.state}</p>
                            
                            <div className="flex items-center mb-4">
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg key={star} className="w-5 h-5" fill={star <= review.rating ? "currentColor" : "none"} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="ml-2 text-[#AAAAAA] text-sm">
                                Posted on {review.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-[#FFFFFF]">{review.text}</p>
                          </div>
                          
                          <div className="flex md:flex-col gap-2">
                            <Link href={`/review/edit/${review.id}`} className="btn-secondary py-2 px-4 text-sm">
                              Edit Review
                            </Link>
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this review?')) {
                                  try {
                                    if (process.env.NODE_ENV === 'development') {
                                      // Just update state in development mode
                                      setUserReviews(prev => prev.filter(r => r.id !== review.id));
                                    } else {
                                      // Real Firebase operation in production
                                      await deleteDoc(doc(db, 'reviews', review.id));
                                      setUserReviews(prev => prev.filter(r => r.id !== review.id));
                                    }
                                  } catch (error) {
                                    console.error('Error deleting review:', error);
                                  }
                                }
                              }} 
                              className="btn-secondary bg-red-900/30 hover:bg-red-900/50 py-2 px-4 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#111] rounded-xl p-8 text-center">
                  <p className="text-lg mb-4">You haven't written any reviews yet.</p>
                  <Link href="/search" className="btn py-2 px-4">
                    Find Clinics to Review
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UserDashboard;