import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { ensureStudio, getStudioAvatarUrlByEmail } from '../lib/supabaseDashboard';
import { linkCollaboratorArtistAccountToUser } from '../lib/collaboratorStudio';
import { clearAllInkflowStorage } from '../lib/clearAuthStorage';
import { getAuthCallbackRedirectTo, LANDING_URL } from '../lib/urls';
import { mapSignupError } from '../lib/supabaseAuthMessages';
import { requestStudioActivationLink } from '../lib/studioActivationEmail';
import { useSupabaseEnabled } from '../hooks/useSupabaseEnabled';
import { DEMO_ACCOUNT_EMAIL } from '../data/demoData';
import { isInkflowInternalStaffEmail } from '../lib/inkflowInternalStaff';
import { resetPosthogIdentity } from '../lib/analytics/posthogInit';
import { isAppleSignInEnabled } from '../lib/appleAuthFeature';

/** sessionStorage : session fermée faute d’e-mail confirmé (garde-fou côté app). */
export const INKFLOW_EMAIL_UNVERIFIED_KEY = 'inkflow_email_unverified';

/**
 * Garde-fou si le projet Supabase n’impose plus « confirm email » : session mot de passe
 * sans `email_confirmed_at` = déconnexion (providers OAuth/Apple ont en général l’e-mail validé).
 */
function shouldSignOutUnconfirmedEmailProvider(user: {
  email_confirmed_at?: string | null;
  identities?: { provider: string }[] | null;
}): boolean {
  if (user.email_confirmed_at) return false;
  return Boolean((user.identities ?? []).find((i) => i.provider === 'email'));
}

function rememberUnverifiedRedirectFlag() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(INKFLOW_EMAIL_UNVERIFIED_KEY, '1');
  } catch {
    /* ignore */
  }
}

function appUserFromSupabase(sessionUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  const email = sessionUser.email ?? '';
  const meta = sessionUser.user_metadata ?? {};
  const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('inkflow_avatar') : null;
  const staff = isInkflowInternalStaffEmail(email);
  return {
    id: sessionUser.id,
    email,
    name: (meta.name as string) || email?.split('@')[0] || 'User',
    studioName: staff ? 'InkFlow' : (meta.studio_name as string) || 'Mon studio',
    isInkflowStaff: staff || undefined,
    role: 'studio_owner',
    avatar: savedAvatar || undefined,
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
      const u = parsed as User;
      const email = typeof u.email === 'string' ? u.email : '';
      if (email && isInkflowInternalStaffEmail(email)) {
        return { ...u, isInkflowStaff: true, studioName: u.studioName || 'InkFlow' };
      }
      return u;
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
  loginWithApple: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    studioName: string,
    referralCode?: string,
    options?: { teamInviteStudioLabel?: string | null }
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  /** Renvoie l’e-mail de confirmation d’inscription (Supabase). */
  resendSignupConfirmation: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isGoogleAuthEnabled: boolean;
  isAppleAuthEnabled: boolean;
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
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('auth_timeout')), AUTH_SESSION_TIMEOUT_MS)
    );
    Promise.race([sessionPromise, timeoutPromise])
      .then(async (result: Awaited<typeof sessionPromise>) => {
        const {
          data: { session },
        } = result;
        if (session?.user) {
          if (shouldSignOutUnconfirmedEmailProvider(session.user)) {
            await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
            rememberUnverifiedRedirectFlag();
            setUser(null);
            localStorage.removeItem('inkflow_user');
            return;
          }
          const {
            data: { session: refreshed },
          } = await supabase.auth.refreshSession().catch(() => ({ data: { session } }));
          const u = refreshed?.user ?? session.user;
          if (shouldSignOutUnconfirmedEmailProvider(u)) {
            await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
            rememberUnverifiedRedirectFlag();
            setUser(null);
            localStorage.removeItem('inkflow_user');
            return;
          }
          const appUser = appUserFromSupabase(u);
          setUser(appUser);
          localStorage.setItem('inkflow_user', JSON.stringify(appUser));
        }
      })
      .catch(() => {
        /* timeout ou erreur : on reste déconnecté */
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setAuthLoading(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const clearStoredUser = () => {
        setUser(null);
        localStorage.removeItem('inkflow_user');
      };
      const applyUser = (u: (typeof session)['user']): void => {
        if (shouldSignOutUnconfirmedEmailProvider(u)) {
          rememberUnverifiedRedirectFlag();
          clearStoredUser();
          void supabase.auth.signOut({ scope: 'global' }).catch(() => {});
          return;
        }
        const appUser = appUserFromSupabase(u);
        setUser(appUser);
        localStorage.setItem('inkflow_user', JSON.stringify(appUser));
      };
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          applyUser(session.user);
        } else {
          clearStoredUser();
        }
        clearTimeout(timeoutId);
        setAuthLoading(false);
        return;
      }
      if (session?.user) {
        applyUser(session.user);
      } else {
        clearStoredUser();
      }
    });

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.auth
              .refreshSession()
              .then(({ data: { session: refreshed } }) => {
                const u = refreshed?.user ?? session.user;
                const appUser = appUserFromSupabase(u);
                setUser(appUser);
                localStorage.setItem('inkflow_user', JSON.stringify(appUser));
              })
              .catch(() => {});
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupabaseAuthEnabled]);

  /** Après login, la photo ne doit pas dépendre du localStorage (vidé à la déconnexion) : relire `avatar_url` en base. */
  useEffect(() => {
    if (!isSupabaseAuthEnabled || !user?.email) return;
    let cancelled = false;
    void getStudioAvatarUrlByEmail(user.email).then((url) => {
      if (cancelled || !url) return;
      setUser((prev) => {
        if (!prev || prev.email?.toLowerCase() !== user.email?.toLowerCase()) return prev;
        if (prev.avatar === url) return prev;
        const updated = { ...prev, avatar: url };
        localStorage.setItem('inkflow_user', JSON.stringify(updated));
        return updated;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isSupabaseAuthEnabled, user?.email, user?.id]);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseAuthEnabled) return;
    const redirectTo = getAuthCallbackRedirectTo();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  }, [isSupabaseAuthEnabled]);

  const loginWithApple = useCallback(async () => {
    if (!isSupabaseAuthEnabled || !isAppleSignInEnabled()) return;
    const redirectTo = getAuthCallbackRedirectTo();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        /** Préfère l’UI Apple en français quand supporté */
        queryParams: { locale: 'fr_FR' },
      },
    });
    if (error) throw new Error(error.message);
  }, [isSupabaseAuthEnabled]);

  const login = useCallback(
    async (email: string, password: string) => {
      // Compte démo : connexion immédiate sans Supabase, avec fausses données pour captures d'écran
      if (email.toLowerCase().trim() === DEMO_ACCOUNT_EMAIL) {
        const demoUser: User = {
          id: 'demo-user-1',
          email: DEMO_ACCOUNT_EMAIL,
          name: 'Demo Artist',
          studioName: 'Studio Demo',
          role: 'studio_owner',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        };
        setUser(demoUser);
        localStorage.setItem('inkflow_user', JSON.stringify(demoUser));
        return;
      }
      if (isSupabaseAuthEnabled) {
        const LOGIN_TIMEOUT_MS = 25000;
        const loginPromise = supabase.auth.signInWithPassword({ email, password });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error('Connexion expirée — le serveur Supabase ne répond pas assez vite.')
              ),
            LOGIN_TIMEOUT_MS
          )
        );
        let raceResult: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
        try {
          raceResult = await Promise.race([loginPromise, timeoutPromise]);
        } catch (e) {
          const m = e instanceof Error ? e.message : String(e);
          if (m.includes('Failed to fetch') || m.toLowerCase().includes('network')) {
            throw new Error(
              'Failed to fetch — vérifie la connexion internet et que VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY sont corrects sur Vercel.'
            );
          }
          throw e;
        }
        const { data, error } = raceResult;
        if (error) throw new Error(error.message);
        if (data?.user) {
          const appUser = appUserFromSupabase(data.user);
          setUser(appUser);
          localStorage.setItem('inkflow_user', JSON.stringify(appUser));
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      const savedAvatar = localStorage.getItem('inkflow_avatar');
      const mockUser: User = {
        id: '1',
        email,
        name: 'Alexandre Martin',
        studioName: 'Ink & Art Studio',
        role: 'studio_owner',
        avatar:
          savedAvatar ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      };
      setUser(mockUser);
      localStorage.setItem('inkflow_user', JSON.stringify(mockUser));
    },
    [isSupabaseAuthEnabled]
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      studioName: string,
      referralCode?: string,
      options?: { teamInviteStudioLabel?: string | null }
    ): Promise<{ needsEmailConfirmation: boolean }> => {
      if (isSupabaseAuthEnabled) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              studio_name: studioName,
              referral_code: referralCode || null,
              studio_invite: options?.teamInviteStudioLabel?.trim() || null,
            },
            /** Toujours l'app (ex. app.ink-flow.me/auth/callback), jamais la Site URL landing Framer. */
            emailRedirectTo: getAuthCallbackRedirectTo(),
          },
        });
        if (error) {
          throw new Error(mapSignupError(error));
        }
        if (!data?.user) {
          throw new Error(
            'Réponse serveur incomplète après inscription. Vérifiez la configuration Supabase (Auth) ou réessayez.'
          );
        }
        const needsEmailConfirmation = !data.session;
        if (needsEmailConfirmation) {
          // Confirmation email requise : la session du parrain (ou autre) peut encore être active.
          // On se déconnecte pour éviter d'afficher le dashboard du mauvais utilisateur.
          await supabase.auth.signOut({ scope: 'global' });
          setUser(null);
          localStorage.removeItem('inkflow_user');
          // Le studio sera créé à la première connexion (AuthCallbackPage) avec le referral_code dans user_metadata
        } else {
          const appUser = appUserFromSupabase(data.user);
          setUser(appUser);
          localStorage.setItem('inkflow_user', JSON.stringify(appUser));
          const isTeamInvite = Boolean(options?.teamInviteStudioLabel?.trim());
          try {
            if (isInkflowInternalStaffEmail(email)) {
              // Pas de fiche studio tatoueur pour les comptes équipe (@ink-flow.me / founder list)
            } else if (isTeamInvite) {
              await linkCollaboratorArtistAccountToUser(data.user.id, email);
            } else {
              await ensureStudio(
                email,
                appUser.name,
                studioName || appUser.studioName,
                referralCode
              );
            }
          } catch {
            // Ne pas bloquer l'inscription si le studio échoue (ex. table pas encore migrée)
          }
        }
        return { needsEmailConfirmation };
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        studioName,
        role: 'studio_owner',
      };
      setUser(newUser);
      localStorage.setItem('inkflow_user', JSON.stringify(newUser));
      return { needsEmailConfirmation: false };
    },
    [isSupabaseAuthEnabled]
  );

  const resendSignupConfirmation = useCallback(
    async (email: string) => {
      if (!isSupabaseAuthEnabled) {
        throw new Error('Confirmation par e-mail non disponible.');
      }
      const trimmed = email.trim();
      if (!trimmed) throw new Error('Adresse e-mail requise.');
      /** Lien d’activation envoyé via Resend (API), pas le SMTP Auth — fiabilise la délivrabilité. */
      await requestStudioActivationLink(trimmed);
    },
    [isSupabaseAuthEnabled]
  );

  const logout = useCallback(async () => {
    /** Toujours attendre signOut : sinon la redirection coupe l’écriture des jetons → il faut souvent « se déconnecter deux fois ». */
    if (isSupabaseAuthEnabled) {
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
    }
    resetPosthogIdentity();
    setUser(null);
    clearAllInkflowStorage();
    if (typeof window !== 'undefined') window.location.href = LANDING_URL;
  }, [isSupabaseAuthEnabled]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
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
      loginWithApple,
      signup,
      resendSignupConfirmation,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isGoogleAuthEnabled: isSupabaseAuthEnabled,
      isAppleAuthEnabled: isSupabaseAuthEnabled && isAppleSignInEnabled(),
    }),
    [
      user,
      authLoading,
      login,
      loginWithGoogle,
      loginWithApple,
      signup,
      resendSignupConfirmation,
      logout,
      updateUser,
      isSupabaseAuthEnabled,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const PUBLIC_DEMO_USER: User = {
  id: 'public-demo-user',
  email: DEMO_ACCOUNT_EMAIL,
  name: 'Alex',
  studioName: 'Studio InkFlow',
  role: 'studio_owner',
  avatar: '/images/avatars/avatar-1.png',
};

/**
 * Session démo isolée pour `/dashboard-demo` — ne lit ni n’écrit `localStorage` auth.
 * S’imbrique dans `AuthProvider` et remplace le contexte pour les composants enfants.
 */
export const PublicDemoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(PUBLIC_DEMO_USER);
  const noopAsync = useCallback(async () => {}, []);
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);
  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') window.location.href = '/signup';
  }, []);
  const signup = useCallback(async () => ({ needsEmailConfirmation: false }), []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      authLoading: false,
      isAuthenticated: true,
      login: noopAsync,
      loginWithGoogle: noopAsync,
      loginWithApple: noopAsync,
      signup,
      resendSignupConfirmation: noopAsync,
      logout,
      updateUser,
      isGoogleAuthEnabled: false,
      isAppleAuthEnabled: false,
    }),
    [user, noopAsync, updateUser, logout, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
