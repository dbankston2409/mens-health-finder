import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthUser extends User {
  isAdmin?: boolean;
  accessToken?: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Get access token for API calls
          const accessToken = await firebaseUser.getIdToken();
          
          const authUser: AuthUser = {
            ...firebaseUser,
            isAdmin: userData.role === 'admin' || userData.isAdmin || false,
            accessToken,
            displayName: firebaseUser.displayName || userData.name || userData.email
          };
          
          setUser(authUser);
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(firebaseUser as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}