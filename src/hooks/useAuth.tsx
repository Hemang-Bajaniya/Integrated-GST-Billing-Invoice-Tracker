import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { authApi, setToken, getToken, clearToken, type MeResponse } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
}

interface AuthProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'accountant' | 'viewer';
  business_id: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAccountant: boolean;
  canModify: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helper: map backend MeResponse to our profile shape ──────────────────────

function mapMeToProfile(me: MeResponse): AuthProfile {
  const roles = (me.roles ?? []).map((r) => r.toLowerCase());
  let role: AuthProfile['role'] = 'viewer';
  if (roles.includes('admin')) role = 'admin';
  else if (roles.includes('accountant')) role = 'accountant';

  return {
    id: me.id,
    email: me.email,
    full_name: me.email.split('@')[0] ?? null, // Backend register doesn't store fullName in profile yet
    role,
    business_id: me.business?.id ?? null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: if token exists, fetch current user
  const loadCurrentUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser({ id: me.id, email: me.email });
      setProfile(mapMeToProfile(me));
    } catch {
      // Token invalid / expired
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      const me = await authApi.me();
      setUser({ id: me.id, email: me.email });
      setProfile(mapMeToProfile(me));
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message ?? 'Login failed') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    _fullName: string
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await authApi.register(email, password, _fullName);
      setToken(res.token);
      const me = await authApi.me();
      setUser({ id: me.id, email: me.email });
      setProfile(mapMeToProfile(me));
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message ?? 'Registration failed') };
    }
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isAccountant = profile?.role === 'accountant';
  const canModify = isAdmin || isAccountant;

  const value: AuthContextType = {
    user,
    session: user ? { user } : null,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isAccountant,
    canModify,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
