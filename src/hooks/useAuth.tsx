import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authService } from "@/api/auth.service";
import type { MeResponse } from "@/api/types/auth.types";

// ── Profile type (mirrors your existing Profile from @/types/database) ────────
// Kept identical so any component using profile.role, profile.full_name etc.
// continues to work without changes.
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "accountant" | "viewer";
  business_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Fake Session shape ─────────────────────────────────────────────────────────
// Some components may read session.access_token or session.user.
// We construct a lightweight object that satisfies those reads.
export interface AppSession {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

// ── Auth error shape (same as Supabase — { error: Error | null }) ─────────────
interface AuthError {
  message: string;
  name: string;
}

// ── Context type — identical signature to your Supabase version ───────────────
interface AuthContextType {
  user: { id: string; email: string } | null; // matches User usage across app
  session: AppSession | null; // matches Session usage across app
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAccountant: boolean;
  canModify: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helper: build Profile from MeResponse ─────────────────────────────────────
// MeResponse comes from GET /api/auth/me
// Maps it to the Profile shape your app already uses everywhere
function buildProfile(me: MeResponse): Profile {
  const role = me.roles?.includes("Admin")
    ? "admin"
    : me.roles?.includes("Accountant")
      ? "accountant"
      : "viewer";

  return {
    id: me.id,
    email: me.email,
    full_name: me.fullName ?? null,
    role,
    business_id: me.business.id ?? null,
    created_at: new Date().toISOString(), // not returned by API, safe default
    updated_at: new Date().toISOString(),
  };
}

// ── Helper: build AppSession from token + MeResponse ─────────────────────────
function buildSession(token: string, me: MeResponse): AppSession {
  return {
    access_token: token,
    user: {
      id: me.id,
      email: me.email,
    },
  };
}

// ── Helper: normalise API errors into { message, name } shape ─────────────────
function toAuthError(err: any): AuthError {
  const message: string =
    typeof err.response?.data === "string"
      ? err.response.data
      : (err.response?.data?.title ??
        err.response?.data?.message ??
        err.message ??
        "An unexpected error occurred");

  return { message, name: "AuthError" };
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: replaces supabase.auth.getSession() ───────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((me) => {
        const builtProfile = buildProfile(me);
        const builtSession = buildSession(token, me);

        setUser({ id: me.id, email: me.email });
        setSession(builtSession);
        setProfile(builtProfile);
      })
      .catch(() => {
        // Token expired or invalid — clean slate
        localStorage.removeItem("token");
        setUser(null);
        setSession(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── signIn: replaces supabase.auth.signInWithPassword ────────────────────
  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: AuthError | null }> => {
      try {
        const response = await authService.login({ email, password });
        const token = response.token;

        localStorage.setItem("token", token);

        const me = await authService.me();
        const builtProfile = buildProfile(me);
        const builtSession = buildSession(token, me);

        setUser({ id: me.id, email: me.email });
        setSession(builtSession);
        setProfile(builtProfile);

        return { error: null };
      } catch (err: any) {
        return { error: toAuthError(err) };
      }
    },
    [],
  );

  // ── signUp: replaces supabase.auth.signUp ─────────────────────────────────
  // fullName is accepted for future use; your backend currently ignores it.
  // Extend RegisterRequest DTO in AuthController to use it when ready.
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      _fullName: string,
    ): Promise<{ error: AuthError | null }> => {
      try {
        await authService.register({ email, password });
        return { error: null };
      } catch (err: any) {
        return { error: toAuthError(err) };
      }
    },
    [],
  );

  // ── signOut: replaces supabase.auth.signOut ───────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    authService.logout(); // removes token from localStorage
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  // ── Derived role flags (identical to your Supabase version) ──────────────
  const isAdmin = profile?.role === "admin";
  const isAccountant = profile?.role === "accountant";
  const canModify = isAdmin || isAccountant;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isAccountant,
        canModify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Consumer hook — identical signature to your Supabase version ──────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  console.log(context);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
