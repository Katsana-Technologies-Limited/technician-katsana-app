import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, View } from "react-native";
import { api, setUnauthorizedHandler } from "@/lib/api";
import { getToken, setToken, clearToken } from "@/lib/auth";

// 15 minutes without touching the app logs the technician out - same idea
// as crm-katsana-react's useIdleLogout. The backend enforces the same limit
// on its side (technicianSession.js, BUSINESS_LOGIC.md §100), so this is
// the friendly half: it logs out on time and shows why, instead of the
// next request just failing.
const IDLE_LIMIT_MS = 15 * 60 * 1000;

export interface TechnicianInfo {
  id: number;
  name: string;
  photo?: string | null;
  mobile: string;
  role: string;
  assigned_area?: string | null;
}

interface AuthContextValue {
  technician: TechnicianInfo | null;
  isLoading: boolean;
  login: (mobile: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  // Why the last logout happened, for the Login screen's notice - "idle"
  // after 15 minutes without activity (here or on the backend), else null.
  logoutReason: "idle" | null;
  // Re-fetches the technician's own row (photo, in practice) after a
  // self-service update on ProfileScreen - verify-auth already returns the
  // full technicianInfo shape, so it doubles as a refresh call.
  refreshTechnician: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [technician, setTechnician] = useState<TechnicianInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutReason, setLogoutReason] = useState<"idle" | null>(null);
  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On cold start, a token may already be sitting in SecureStore from a
  // previous session - verify it's still valid against the backend rather
  // than trusting it blindly (it may have expired, been logged out, or gone
  // idle - the backend refuses all three).
  //
  // The token check can resolve in a few ms (no token, or a fast local
  // network), which would otherwise flash the splash screen for a single
  // frame - a minimum display time keeps it visible long enough to read.
  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 900));

    (async () => {
      const check = (async () => {
        const token = await getToken();
        if (!token) return;
        try {
          const res = await api.get("/api/technician/verify-auth");
          if (res.data?.authenticated) {
            lastActivityRef.current = Date.now();
            setTechnician(res.data.technicianInfo);
          } else {
            await clearToken();
          }
        } catch {
          await clearToken();
        }
      })();

      await Promise.all([check, minDelay]);
      setIsLoading(false);
    })();
  }, []);

  const login = async (mobile: string, password: string, remember: boolean) => {
    const res = await api.post("/api/technician/auth/login", {
      mobile,
      password,
      remember,
      // Tells the backend this is the native app, not the browser - it
      // issues a 30-day token either way instead of the web's
      // remember-me-dependent 12h/30d split (see loginTechnician). The
      // 15-minute inactivity limit applies on top of that.
      clientType: "mobile",
    });
    if (!res.data?.loginStatus || !res.data?.token) {
      throw new Error(res.data?.message || "Login failed");
    }
    await setToken(res.data.token);
    lastActivityRef.current = Date.now();
    setLogoutReason(null);
    setTechnician(res.data.technicianInfo);
  };

  // Ends the session on the backend (the token stops working everywhere),
  // then drops it here.
  const endSession = useCallback(async (reason: "idle" | null) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    try {
      await api.post("/api/technician/auth/logout");
    } catch {
      // Already logged out / offline - clearing the token below still logs
      // this app out, and the backend refuses it after 15 idle minutes anyway.
    }
    await clearToken();
    setLogoutReason(reason);
    setTechnician(null);
  }, []);

  const logout = useCallback(() => endSession(null), [endSession]);

  // Restart the 15-minute countdown. Called on every touch (see the View
  // wrapper below) and right after logging in.
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => endSession("idle"), IDLE_LIMIT_MS);
  }, [endSession]);

  // Timer runs only while logged in.
  useEffect(() => {
    if (!technician) return;
    markActivity();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [technician, markActivity]);

  // Timers don't run reliably while the app is in the background, so on
  // coming back check the clock instead: 15+ minutes away = logged out.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !technician) return;
      if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
        endSession("idle");
      } else {
        markActivity();
      }
    });
    return () => sub.remove();
  }, [technician, endSession, markActivity]);

  // Any request the backend refuses with 401 (idle there, logged out on
  // another device, expired) - show the Login screen right away.
  useEffect(() => {
    setUnauthorizedHandler((code) => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setLogoutReason(code === "SESSION_IDLE" ? "idle" : null);
      setTechnician(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const refreshTechnician = async () => {
    try {
      const res = await api.get("/api/technician/verify-auth");
      if (res.data?.authenticated) {
        setTechnician(res.data.technicianInfo);
      }
    } catch {
      // Best-effort - the caller (e.g. ProfileScreen after a photo upload)
      // already has the new value to show locally either way.
    }
  };

  return (
    <AuthContext.Provider
      value={{ technician, isLoading, login, logout, logoutReason, refreshTechnician }}
    >
      {/* Every touch anywhere in the app counts as activity. Touch events
          bubble up to here without taking the touch away from the screen. */}
      <View style={{ flex: 1 }} onTouchStart={technician ? markActivity : undefined}>
        {children}
      </View>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
