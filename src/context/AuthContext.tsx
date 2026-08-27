import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { api } from "@/lib/api";
import {
  getToken,
  setToken,
  clearToken,
  getBiometricEnabled,
  setBiometricEnabled,
} from "@/lib/auth";

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
  // Device has a fingerprint/Face ID sensor with at least one enrolled -
  // gates whether SettingsScreen even offers the toggle at all.
  biometricSupported: boolean;
  // The technician's own opt-in preference, persisted across app restarts.
  biometricEnabled: boolean;
  // Re-confirms with a live biometric prompt before flipping the
  // preference on - a stale "yes" from a UI toggle alone isn't proof the
  // person holding the phone right now is who they claim to be.
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  // Whether the login screen should even offer the fingerprint button -
  // true only when the preference is on AND a session token is still
  // sitting in SecureStore for it to unlock (e.g. after a biometric-aware
  // logout, but not on a fresh install or after the 30-day token expired).
  canLoginWithBiometric: () => Promise<boolean>;
  // "cancelled" - the fingerprint prompt itself failed/was dismissed; the
  // saved token is still there, so the button should stay and let them
  // retry. "expired" - the token no longer verifies server-side and has
  // been dropped; there's nothing left to unlock, so the caller should
  // fall back to the password fields instead of offering another retry.
  loginWithBiometric: () => Promise<"success" | "cancelled" | "expired">;
  // Re-fetches the technician's own row (photo, in practice) after a
  // self-service update on ProfileScreen - verify-auth already returns the
  // full technicianInfo shape, so it doubles as a refresh call.
  refreshTechnician: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [technician, setTechnician] = useState<TechnicianInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  // Hardware capability and the stored preference are independent of the
  // token-verify check above, so they run in their own effect rather than
  // blocking (or being blocked by) the splash-screen delay.
  useEffect(() => {
    (async () => {
      const [hasHardware, isEnrolled, enabledPref] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        getBiometricEnabled(),
      ]);
      setBiometricSupported(hasHardware && isEnrolled);
      setBiometricEnabledState(enabledPref);
    })();
  }, []);

  // On cold start, a token may already be sitting in SecureStore from a
  // previous session - verify it's still valid against the backend rather
  // than trusting it blindly (it may have expired or been revoked).
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
    // With fingerprint login on, logout only needs to hide the app's
    // in-memory session - the token stays in SecureStore so the fingerprint
    // prompt has something to unlock next time. Without it, this behaves
    // exactly as before: the token is gone and only a password gets back in.
    if (!biometricEnabled) {
      await clearToken();
    }
    setTechnician(null);
  };

  const enableBiometric = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your fingerprint to enable fingerprint login",
    });
    if (!result.success) return false;
    await setBiometricEnabled(true);
    setBiometricEnabledState(true);
    return true;
  };

  const disableBiometric = async () => {
    await setBiometricEnabled(false);
    setBiometricEnabledState(false);
  };

  const canLoginWithBiometric = async (): Promise<boolean> => {
    if (!biometricEnabled) return false;
    const token = await getToken();
    return token !== null;
  };

  const loginWithBiometric = async (): Promise<"success" | "cancelled" | "expired"> => {
    const token = await getToken();
    if (!token) return "expired";

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with fingerprint",
    });
    if (!result.success) return "cancelled";

    try {
      const res = await api.get("/api/technician/verify-auth");
      if (res.data?.authenticated) {
        setTechnician(res.data.technicianInfo);
        return "success";
      }
    } catch {
      // fall through to the stale-token cleanup below
    }

    // The saved token no longer verifies (expired/revoked) - nothing left
    // for a fingerprint to unlock, so drop it and the preference together
    // rather than leaving a dead "fingerprint enabled" toggle behind.
    await clearToken();
    await setBiometricEnabled(false);
    setBiometricEnabledState(false);
    return "expired";
  };

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
      value={{
        technician,
        isLoading,
        login,
        logout,
        biometricSupported,
        biometricEnabled,
        enableBiometric,
        disableBiometric,
        canLoginWithBiometric,
        loginWithBiometric,
        refreshTechnician,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
