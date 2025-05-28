import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useRouter } from 'next/router';

// Define the shape of our user data stored in Firestore
export interface MHFUser {
  uid: string;
  name: string;
  email: string;
  zipCode?: string;
  phone?: string;
  authProvider: string;
  createdAt: Date;
  photoUrl?: string;
  savedProviders?: string[];
  reviewsCount?: number;
  isAdmin?: boolean;
  role?: string;
}

// Define the shape of our auth context
interface AuthContextType {
  currentUser: User | null;
  userData: MHFUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithFacebook: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: Partial<MHFUser>) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider for the auth context
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<MHFUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        // Get user data from Firestore
        try {
          console.log('Fetching user data from Firestore for:', user.uid);
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            console.log('User data found in Firestore');
            const userData = docSnap.data() as MHFUser;
            setUserData(userData);
          } else {
            console.log('User not found in Firestore, redirecting to complete profile');
            // If user exists in Auth but not in Firestore,
            // Redirect to complete profile
            router.push('/complete-profile');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          
          // In development mode, provide fallback mock data to prevent blank screen
          if (process.env.NODE_ENV === 'development') {
            console.log('Using fallback data in development mode');
            const fallbackUserData = {
              uid: user.uid,
              name: user.displayName || 'Test User',
              email: user.email || 'test@example.com',
              authProvider: 'email',
              createdAt: new Date(),
              savedProviders: [],
              reviewsCount: 0,
              zipCode: '90210'
            } as MHFUser;
            setUserData(fallbackUserData);
          }
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [router]);

  // Sign up function
  const signUp = async (email: string, password: string, name: string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name,
      email,
      authProvider: 'email',
      createdAt: serverTimestamp(),
      savedProviders: [],
      reviewsCount: 0
    });
    
    return userCredential;
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google sign in
  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create user document in Firestore if it doesn't exist
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        photoUrl: userCredential.user.photoURL,
        authProvider: 'google',
        createdAt: serverTimestamp(),
        savedProviders: [],
        reviewsCount: 0
      });
    }
    
    return userCredential;
  };

  // Facebook sign in
  const signInWithFacebook = async (): Promise<UserCredential> => {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create user document in Firestore if it doesn't exist
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        photoUrl: userCredential.user.photoURL,
        authProvider: 'facebook',
        createdAt: serverTimestamp(),
        savedProviders: [],
        reviewsCount: 0
      });
    }
    
    return userCredential;
  };

  // Sign out function
  const logout = (): Promise<void> => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update user data in Firestore
  const updateUserData = async (data: Partial<MHFUser>): Promise<void> => {
    if (!currentUser) return;
    
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, data, { merge: true });
    
    // Update local state
    setUserData(curr => curr ? { ...curr, ...data } : null);
  };

  const value = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    resetPassword,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}