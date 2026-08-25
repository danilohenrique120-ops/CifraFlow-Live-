import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../firebase';
import { UserProfile, UserSubscription } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isPro: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, instrument?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserInstrument: (instrument: string) => Promise<void>;
  activateDemoPro: () => void;
  activateDemoFree: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_FREE_SUBSCRIPTION: UserSubscription = {
  status: 'none',
  tier: 'free',
  planName: 'Plano Gratuito',
  currentPeriodEnd: 0
};

const DEFAULT_PRO_SUBSCRIPTION: UserSubscription = {
  status: 'active',
  tier: 'pro_ministry',
  planName: 'Plano Ministério Pro (Anual)',
  currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('cifraflow_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default initial profile for guest / demo
    return {
      uid: 'guest_' + Math.random().toString(36).substring(2, 8),
      email: 'musico@cifraflow.com',
      displayName: 'Danilo (Regente)',
      photoURL: null,
      role: 'pro', // Start as Pro by default for seamless developer / evaluation testing!
      instrument: 'Violão',
      avatarColor: 'bg-emerald-500',
      subscription: DEFAULT_PRO_SUBSCRIPTION,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isFirebaseConfigured);

  // Sync profile with localStorage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('cifraflow_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Listen to Firebase Auth state if configured
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        setIsDemoMode(false);
        const userRef = doc(db, 'users', firebaseUser.uid);

        // Listen to live updates on user's subscription in Firestore
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Create default profile in Firestore
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Músico',
              photoURL: firebaseUser.photoURL,
              role: 'free',
              instrument: 'Violão',
              avatarColor: 'bg-emerald-500',
              subscription: DEFAULT_FREE_SUBSCRIPTION,
              createdAt: Date.now(),
              lastLoginAt: Date.now()
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
          setIsLoading(false);
        }, (error) => {
          console.warn('Firestore profile sync note:', error.message);
          setIsLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      activateDemoPro();
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) {
      setUserProfile(prev => prev ? { ...prev, email, displayName: email.split('@')[0] } : null);
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, instrument = 'Violão') => {
    if (!isFirebaseConfigured) {
      setUserProfile({
        uid: 'user_' + Date.now(),
        email,
        displayName: name,
        photoURL: null,
        role: 'free',
        instrument,
        avatarColor: 'bg-emerald-500',
        subscription: DEFAULT_FREE_SUBSCRIPTION,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      photoURL: null,
      role: 'free',
      instrument,
      avatarColor: 'bg-emerald-500',
      subscription: DEFAULT_FREE_SUBSCRIPTION,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setUserProfile(newProfile);
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('cifraflow_user_profile');
  };

  const updateUserInstrument = async (instrument: string) => {
    if (userProfile) {
      const updated = { ...userProfile, instrument };
      setUserProfile(updated);
      if (isFirebaseConfigured && currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), { instrument }, { merge: true });
      }
    }
  };

  const activateDemoPro = () => {
    setUserProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        role: 'pro',
        subscription: DEFAULT_PRO_SUBSCRIPTION
      };
    });
  };

  const activateDemoFree = () => {
    setUserProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        role: 'free',
        subscription: DEFAULT_FREE_SUBSCRIPTION
      };
    });
  };

  const isPro = userProfile?.role === 'pro' && (userProfile?.subscription?.status === 'active' || userProfile?.subscription?.status === 'trialing');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        isPro: Boolean(isPro),
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        updateUserInstrument,
        activateDemoPro,
        activateDemoFree,
        isDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
