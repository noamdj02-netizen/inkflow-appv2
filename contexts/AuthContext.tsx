import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { DEMO_ACCOUNT_EMAIL } from '../data/demoData';

const useSupabaseAuth = () =>
  !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && (import.meta.env.VITE_SUPABASE_URL as string).length > 10);

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

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string, studioName: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('inkflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!useSupabaseAuth()) {
      setAuthLoading(false);
      return;
    }
    setAuthLoading(true);
    const AUTH_SESSION_TIMEOUT_MS = 8000;
    const timeoutId = setTimeout(() => {
      setAuthLoading(false);
    }, AUTH_SESSION_TIMEOUT_MS);
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          const appUser = appUserFromSupabase(session.user);
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
    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!useSupabaseAuth()) return;
    const redirectTo = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  };

  const login = async (email: string, password: string) => {
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
    if (useSupabaseAuth()) {
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
  };

  const signup = async (email: string, password: string, name: string, studioName: string) => {
    if (useSupabaseAuth()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, studio_name: studioName } }
      });
      if (!error && data?.user) {
        const appUser = appUserFromSupabase(data.user);
        setUser(appUser);
        localStorage.setItem('inkflow_user', JSON.stringify(appUser));
        return;
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
  };

  const logout = () => {
    if (useSupabaseAuth()) supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('inkflow_user');
  };

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('inkflow_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      authLoading,
      login,
      loginWithGoogle,
      signup,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isGoogleAuthEnabled: useSupabaseAuth(),
    }}>
      {children}
    </AuthContext.Provider>
  );
};
