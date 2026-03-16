import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { ensureStudio } from '../lib/supabaseDashboard';
import { clearAllInkflowStorage } from '../lib/clearAuthStorage';
import { LANDING_URL } from '../lib/urls';
import { useSupabaseEnabled } from '../hooks/useSupabaseEnabled';
import { DEMO_ACCOUNT_EMAIL } from '../data/demoData';

function appUserFromSupabase(sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  const email = sessionUser.email ?? '';
  const meta = sessionUser.user_metadata ?? {};
  const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('inkflow_avatar') : null;
  return {
    id: sessionUser.id,
    email,
    name: (meta.name as string) || email?.split('@')[0] || 'User',
    studioName: (meta.studio_name as string) || 'Mon studio',
    role: 'studio_owner',
    avatar: savedAvatar || undefined
  };
}

/** Parse utilisateur depuis localStorage de façon sécurisée (évite crash si données corrompues). */
function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('inkflow_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'id' in parsed && 'email' in parsed) {
      return parsed as User;
    }
  } catch {
    localStorage.removeItem('inkflow_user');
  }
  return null;
}

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string, studioName: string, referralCode?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isGoogleAuthEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Clé sessionStorage pour la redirection après login (AuthGuard / LoginPage). */
export const REDIRECT_AFTER_LOGIN_KEY = 'redirectAfterLogin';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isSupabaseAuthEnabled = useSupabaseEnabled();

  useEffect(() => {
    if (!isSupabaseAuthEnabled) {
      setUser(getStoredUser());
      setAuthLoading(false);
      return;
    }
    setUser(getStoredUser());
    setAuthLoading(true);
    const AUTH_SESSION_TIMEOUT_MS = 8000;
    const timeoutId = setTimeout(() => {
      setAuthLoading(false);
    }, AUTH_SESSION_TIMEOUT_MS);
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession().catch(() => ({ data: { session } }));
          const u = refreshed?.user ?? session.user;
          const appUser = appUserFromSupabase(u);
          setUser(appUser);
          localStorage.setItem('inkflow_user', JSON.stringify(appUser));
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setAuthLoading(false);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const appUser = appUserFromSupabase(session.user);
        setUser(appUser);
        localStorage.setItem('inkflow_user', JSON.stringify(appUser));
      } else {
        setUser(null);
        localStorage.removeItem('inkflow_user');
      }
    });

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.auth.refreshSession().then(({ data: { session: refreshed } }) => {
              const u = refreshed?.user ?? session.user;
              const appUser = appUserFromSupabase(u);
              setUser(appUser);
              localStorage.setItem('inkflow_user', JSON.stringify(appUser));
            }).catch(() => {});
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseAuthEnabled) return;
    const redirectTo = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  }, [isSupabaseAuthEnabled]);

  const login = useCallback(async (email: string, password: string) => {
    // Compte démo : connexion immédiate sans Supabase, avec fausses données pour captures d'écran
    if (email.toLowerCase().trim() === DEMO_ACCOUNT_EMAIL) {
      const demoUser: User = {
        id: 'demo-user-1',
        email: DEMO_ACCOUNT_EMAIL,
        name: 'Demo Artist',
        studioName: 'Studio Demo',
        role: 'studio_owner',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      };
      setUser(demoUser);
      localStorage.setItem('inkflow_user', JSON.stringify(demoUser));
      return;
    }
    if (isSupabaseAuthEnabled) {
      const LOGIN_TIMEOUT_MS = 15000;
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connexion expirée. Vérifiez votre réseau.')), LOGIN_TIMEOUT_MS)
      );
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
      if (error) throw new Error(error.message);
      if (data?.user) {
        const appUser = appUserFromSupabase(data.user);
        setUser(appUser);
        localStorage.setItem('inkflow_user', JSON.stringify(appUser));
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const savedAvatar = localStorage.getItem('inkflow_avatar');
    const mockUser: User = {
      id: '1',
      email,
      name: 'Alexandre Martin',
      studioName: 'Ink & Art Studio',
      role: 'studio_owner',
      avatar: savedAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    };
    setUser(mockUser);
    localStorage.setItem('inkflow_user', JSON.stringify(mockUser));
  }, [isSupabaseAuthEnabled]);

  const signup = useCallback(async (email: string, password: string, name: string, studioName: string, referralCode?: string): Promise<{ needsEmailConfirmation: boolean }> => {
    if (isSupabaseAuthEnabled) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, studio_name: studioName, referral_code: referralCode || null } }
      });
      if (!error && data?.user) {
        const needsEmailConfirmation = !data.session;
        if (needsEmailConfirmation) {
          // Confirmation email requise : la session du parrain (ou autre) peut encore être active.
          // On se déconnecte pour éviter d'afficher le dashboard du mauvais utilisateur.
          await supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem('inkflow_user');
          // Le studio sera créé à la première connexion (AuthCallbackPage) avec le referral_code dans user_metadata
        } else {
          const appUser = appUserFromSupabase(data.user);
          setUser(appUser);
          localStorage.setItem('inkflow_user', JSON.stringify(appUser));
          try {
            await ensureStudio(email, appUser.name, studioName || appUser.studioName, referralCode);
          } catch {
            // Ne pas bloquer l'inscription si le studio échoue (ex. table pas encore migrée)
          }
        }
        return { needsEmailConfirmation };
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      studioName,
      role: 'studio_owner'
    };
    setUser(newUser);
    localStorage.setItem('inkflow_user', JSON.stringify(newUser));
    return { needsEmailConfirmation: false };
  }, [isSupabaseAuthEnabled]);

  const logout = useCallback(() => {
    setUser(null);
    clearAllInkflowStorage();
    if (isSupabaseAuthEnabled) supabase.auth.signOut();
    if (typeof window !== 'undefined') window.location.href = LANDING_URL;
  }, [isSupabaseAuthEnabled]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('inkflow_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      authLoading,
      login,
      loginWithGoogle,
      signup,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isGoogleAuthEnabled: isSupabaseAuthEnabled,
    }),
    [user, authLoading, login, loginWithGoogle, signup, logout, updateUser, isSupabaseAuthEnabled]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
