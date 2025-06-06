import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AuthService, 
  AuthUser, 
  AuthCredential, 
  createAuthService 
} from '@reachspark/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Create auth service
const authService = createAuthService(firebaseConfig);

// Context types
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthCredential>;
  signIn: (email: string, password: string) => Promise<AuthCredential>;
  signInWithGoogle: () => Promise<AuthCredential>;
  signInWithGithub: () => Promise<AuthCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.onUserChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await authService.signUp(email, password, displayName);
      return credential;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await authService.signIn(email, password);
      return credential;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const credential = await authService.signInWithGoogle();
      return credential;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    setLoading(true);
    setError(null);
    try {
      const credential = await authService.signInWithGithub();
      return credential;
    } catch (err: any) {
      setError(err.message || 'An error occurred during GitHub sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
    } catch (err: any) {
      setError(err.message || 'An error occurred during logout');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email);
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (displayName?: string, photoURL?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      await authService.updateUserProfile(user, { displayName, photoURL });
    } catch (err: any) {
      setError(err.message || 'An error occurred during profile update');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    logout,
    resetPassword,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
