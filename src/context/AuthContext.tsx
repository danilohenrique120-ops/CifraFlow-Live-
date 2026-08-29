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
  verifyStripeSubscription: (targetEmail?: string) => Promise<boolean>;
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
  planName: 'Plano Pro (Ativo)',
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

  // Function to verify Stripe subscription by email and upgrade in Firestore
  const verifyStripeSubscription = async (targetEmail?: string): Promise<boolean> => {
    const emailToVerify = targetEmail || userProfile?.email || currentUser?.email;
    if (!emailToVerify) return false;

    try {
      const response = await fetch('/api/check-subscription-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify })
      });
      const data = await response.json();

      if (data.hasActiveSubscription) {
        const upgradedSubscription: UserSubscription = {
          status: 'active',
          tier: 'pro_band',
          planName: data.planName || 'Plano Pro',
          currentPeriodEnd: data.currentPeriodEnd || Date.now() + 365 * 24 * 60 * 60 * 1000
        };

        const targetUid = currentUser?.uid || userProfile?.uid;
        if (targetUid && isFirebaseConfigured) {
          await setDoc(
            doc(db, 'users', targetUid),
            { role: 'pro', subscription: upgradedSubscription },
            { merge: true }
          );
        }

        setUserProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            role: 'pro',
            subscription: upgradedSubscription
          };
        });

        return true;
      }
      return false;
    } catch (err) {
      console.error('Error verifying Stripe subscription:', err);
      return false;
    }
  };

  // Handle Stripe redirect query parameters (e.g. ?payment_success=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get('payment_success') === 'true';
      const sessionId = params.get('session_id');
      const tier = params.get('tier') || 'pro_band';

      if (isSuccess || sessionId) {
        sessionStorage.setItem(
          'cifraflow_pending_stripe_session',
          JSON.stringify({ sessionId, tier, isSuccess: true, timestamp: Date.now() })
        );

        // Clean up URL without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Listen to Firebase Auth state if configured
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const SPECIAL_PRO_ACCOUNTS: Record<string, { pass: string; name: string; avatar: string }> = {
      'danilohenrique120@gmail.com': {
        pass: 'Auroralilo*313194',
        name: 'Administrador',
        avatar: 'bg-emerald-500'
      },
      'patrick@socio.com': {
        pass: 'patrick222',
        name: 'Patrick',
        avatar: 'bg-emerald-500'
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        setIsDemoMode(false);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userEmail = (firebaseUser.email || '').trim().toLowerCase();
        const special = SPECIAL_PRO_ACCOUNTS[userEmail];
        const isSpecialPro = Boolean(special);

        // Check if there is a pending Stripe payment return in this session
        const pendingRaw = sessionStorage.getItem('cifraflow_pending_stripe_session');
        let hasPendingSuccess = false;
        if (pendingRaw) {
          try {
            const parsed = JSON.parse(pendingRaw);
            if (parsed.isSuccess || parsed.sessionId) {
              hasPendingSuccess = true;
              sessionStorage.removeItem('cifraflow_pending_stripe_session');
            }
          } catch (e) {}
        }

        // Listen to live updates on user's subscription in Firestore
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // 1. Se for conta de sócio/admin, garantir que sempre tenha role pro
            if (isSpecialPro && data.role !== 'pro') {
              const fixed: UserProfile = {
                ...data,
                role: 'pro',
                subscription: DEFAULT_PRO_SUBSCRIPTION
              };
              await setDoc(userRef, fixed, { merge: true });
              setUserProfile(fixed);
            } 
            // 2. Se retornou de um checkout Stripe com sucesso recente
            else if (hasPendingSuccess && data.role !== 'pro') {
              const upgraded: UserProfile = {
                ...data,
                role: 'pro',
                subscription: DEFAULT_PRO_SUBSCRIPTION
              };
              await setDoc(userRef, upgraded, { merge: true });
              setUserProfile(upgraded);
              hasPendingSuccess = false;
            } 
            else {
              setUserProfile(data);

              // 3. Se o usuário estiver como gratuito, fazer checagem de fundo no Stripe para recuperar compras
              if (data.role === 'free' && userEmail) {
                verifyStripeSubscription(userEmail);
              }
            }
          } else {
            const isInitialPro = isSpecialPro || hasPendingSuccess;
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || (special ? special.name : 'Músico'),
              photoURL: firebaseUser.photoURL,
              role: isInitialPro ? 'pro' : 'free',
              instrument: 'Violão',
              avatarColor: special ? special.avatar : 'bg-blue-500',
              subscription: isInitialPro ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
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

  const SPECIAL_ACCOUNTS: Record<string, { pass: string; name: string; avatar: string }> = {
    'danilohenrique120@gmail.com': {
      pass: 'Auroralilo*313194',
      name: 'Administrador',
      avatar: 'bg-emerald-500'
    },
    'patrick@socio.com': {
      pass: 'patrick222',
      name: 'Patrick',
      avatar: 'bg-emerald-500'
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase não configurado localmente.');
      return;
    }
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const special = SPECIAL_ACCOUNTS[cleanEmail];
    const isSpecialPro = Boolean(special);

    // Validação estrita de senhas para contas de sócio e admin
    if (special) {
      if (pass !== special.pass) {
        throw new Error('auth/wrong-password');
      }
    }

    if (!isFirebaseConfigured) {
      setUserProfile({
        uid: 'user_' + Date.now(),
        email: cleanEmail,
        displayName: special ? special.name : cleanEmail.split('@')[0],
        photoURL: null,
        role: isSpecialPro ? 'pro' : 'free',
        instrument: 'Violão',
        avatarColor: special ? special.avatar : 'bg-blue-500',
        subscription: isSpecialPro ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      // Se a conta de sócio/admin ainda não estiver criada no Firebase Auth pela primeira vez, cria com a senha oficial
      if (special && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        if (pass === special.pass) {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          await updateProfile(cred.user, { displayName: special.name });
          const newProfile: UserProfile = {
            uid: cred.user.uid,
            email: cleanEmail,
            displayName: special.name,
            photoURL: null,
            role: 'pro',
            instrument: 'Violão',
            avatarColor: special.avatar,
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
    const special = SPECIAL_ACCOUNTS[cleanEmail];
    const isSpecialPro = Boolean(special);

    // Se tentar cadastrar email especial sem ser a senha oficial
    if (special) {
      if (pass !== special.pass) {
        throw new Error('auth/email-already-in-use');
      }
    }

    if (!isFirebaseConfigured) {
      setUserProfile({
        uid: 'user_' + Date.now(),
        email: cleanEmail,
        displayName: special ? special.name : name,
        photoURL: null,
        role: isSpecialPro ? 'pro' : 'free',
        instrument,
        avatarColor: special ? special.avatar : 'bg-blue-500',
        subscription: isSpecialPro ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const finalName = special ? special.name : name;
    await updateProfile(cred.user, { displayName: finalName });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cleanEmail,
      displayName: finalName,
      photoURL: null,
      role: isSpecialPro ? 'pro' : 'free',
      instrument,
      avatarColor: special ? special.avatar : 'bg-blue-500',
      subscription: isSpecialPro ? DEFAULT_PRO_SUBSCRIPTION : DEFAULT_FREE_SUBSCRIPTION,
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
        verifyStripeSubscription,
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
