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
  tier: 'pro_band',
  planName: 'Plano Pro (Anual)',
  currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Clean initial state: null if new visitor, or restored from localStorage ONLY if logged in previously on this device
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('cifraflow_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isFirebaseConfigured);

  // Sync profile with localStorage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('cifraflow_user_profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('cifraflow_user_profile');
    }
  }, [userProfile]);

  // Handle Stripe redirect query parameters (e.g. ?payment_success=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_success') === 'true') {
        const tier = params.get('tier') || 'pro_band';
        const upgradedSubscription: UserSubscription = {
          status: 'active',
          tier: tier as any,
          planName: tier === 'pro_musician' ? 'Pro Músico Solo' : 'Plano Pro',
          currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000
        };

        setUserProfile((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            role: 'pro' as const,
            subscription: upgradedSubscription
          };
          if (currentUser && isFirebaseConfigured) {
            setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
          }
          return updated;
        });

        // Clean up URL without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [currentUser]);

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
            // Check if user is the admin / owner
            const isAdmin = firebaseUser.email === 'danilohenrique120@gmail.com';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || (isAdmin ? 'Administrador' : 'Músico'),
              photoURL: firebaseUser.photoURL,
              role: isAdmin ? 'pro' : 'free',
              instrument: 'Violão',
              avatarColor: isAdmin ? 'bg-emerald-500' : 'bg-blue-500',
              subscription: isAdmin ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
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
        setUserProfile(null);
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
      alert('Firebase não configurado localmente.');
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === 'danilohenrique120@gmail.com';

    // Se for o e-mail do Administrador, validação estrita da senha do proprietário
    if (isAdmin) {
      if (pass !== 'Auroralilo*313194') {
        throw new Error('auth/wrong-password');
      }
    }

    if (!isFirebaseConfigured) {
      setUserProfile({
        uid: 'user_' + Date.now(),
        email: cleanEmail,
        displayName: isAdmin ? 'Administrador' : cleanEmail.split('@')[0],
        photoURL: null,
        role: isAdmin ? 'pro' : 'free',
        instrument: 'Violão',
        avatarColor: isAdmin ? 'bg-emerald-500' : 'bg-blue-500',
        subscription: isAdmin ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      // Se a conta de admin ainda não estiver criada no Firebase Auth pela primeira vez, cria com a senha oficial
      if (isAdmin && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        if (pass === 'Auroralilo*313194') {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          await updateProfile(cred.user, { displayName: 'Administrador' });
          const newProfile: UserProfile = {
            uid: cred.user.uid,
            email: cleanEmail,
            displayName: 'Administrador',
            photoURL: null,
            role: 'pro',
            instrument: 'Violão',
            avatarColor: 'bg-emerald-500',
            subscription: DEFAULT_PRO_SUBSCRIPTION,
            createdAt: Date.now(),
            lastLoginAt: Date.now()
          };
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
          setUserProfile(newProfile);
          return;
        }
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, instrument = 'Violão') => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === 'danilohenrique120@gmail.com';

    // Se tentar cadastrar o email oficial já existente sem ser o dono
    if (isAdmin) {
      if (pass !== 'Auroralilo*313194') {
        throw new Error('auth/email-already-in-use');
      }
    }

    if (!isFirebaseConfigured) {
      setUserProfile({
        uid: 'user_' + Date.now(),
        email: cleanEmail,
        displayName: name,
        photoURL: null,
        role: isAdmin ? 'pro' : 'free',
        instrument,
        avatarColor: isAdmin ? 'bg-emerald-500' : 'bg-blue-500',
        subscription: isAdmin ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    await updateProfile(cred.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cleanEmail,
      displayName: name,
      photoURL: null,
      role: isAdmin ? 'pro' : 'free',
      instrument,
      avatarColor: isAdmin ? 'bg-emerald-500' : 'bg-blue-500',
      subscription: isAdmin ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
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
