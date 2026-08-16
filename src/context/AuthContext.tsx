import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { getToken, setToken, clearToken } from "@/lib/auth";

export interface TechnicianInfo {
  id: number;
  name: string;
  mobile: string;
  role: string;
  assigned_area?: string | null;
}

interface AuthContextValue {
  technician: TechnicianInfo | null;
  isLoading: boolean;
  login: (mobile: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [technician, setTechnician] = useState<TechnicianInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On cold start, a token may already be sitting in SecureStore from a
  // previous session - verify it's still valid against the backend rather
  // than trusting it blindly (it may have expired or been revoked).
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get("/api/technician/verify-auth");
        if (res.data?.authenticated) {
          setTechnician(res.data.technicianInfo);
        } else {
          await clearToken();
        }
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (mobile: string, password: string, remember: boolean) => {
    const res = await api.post("/api/technician/auth/login", {
      mobile,
      password,
      remember,
      // Tells the backend this is the native app, not the browser - it
      // issues a 30-day token either way instead of the web's
      // remember-me-dependent 12h/30d split (see loginTechnician).
      clientType: "mobile",
    });
    if (!res.data?.loginStatus || !res.data?.token) {
      throw new Error(res.data?.message || "Login failed");
    }
    await setToken(res.data.token);
    setTechnician(res.data.technicianInfo);
  };

  const logout = async () => {
    try {
      await api.post("/api/technician/auth/logout");
    } catch {
      // Cookie-clearing on the server is irrelevant to a Bearer client -
      // clearing the local token below is what actually logs this app out.
    }
    await clearToken();
    setTechnician(null);
  };

  return (
    <AuthContext.Provider value={{ technician, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
