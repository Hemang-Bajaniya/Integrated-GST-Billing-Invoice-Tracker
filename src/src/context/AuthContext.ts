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

// ── Shape of the context ─────────────────────────────────────────────────────
interface AuthContextValue {
    user: MeResponse | null;
    token: string | null;
    isLoading: boolean;           // true while bootstrapping on first load
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<MeResponse | null>(null);
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("token")   // initialise from storage
    );
    const [isLoading, setIsLoading] = useState(true);

    // On mount (or when token changes), fetch the current user from /api/auth/me
    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        authService
            .me()
            .then(setUser)
            .catch(() => {
                // Token is invalid or expired — clean up
                localStorage.removeItem("token");
                setToken(null);
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, [token]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await authService.login({ email, password });

        localStorage.setItem("token", response.token);
        setToken(response.token);

        // Immediately fetch user profile after login
        const me = await authService.me();
        setUser(me);
    }, []);

    const logout = useCallback(() => {
        authService.logout();          // clears localStorage
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
      value= {{
        user,
            token,
            isLoading,
            isAuthenticated: !!user,
                login,
                logout,
      }
}
    >
    { children }
    </AuthContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}