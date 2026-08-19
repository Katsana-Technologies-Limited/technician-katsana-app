import axios from "axios";
import { getToken, clearToken } from "./auth";

// EXPO_PUBLIC_* vars are inlined at build/start time by Expo - set
// EXPO_PUBLIC_API_URL in .env (see .env.example) to point at
// vts-backend-katsana, same backend technician-katsana (web) already talks
// to. On a physical device or emulator this must be your machine's LAN IP,
// not localhost. For an EAS build, this also has to be registered as an
// EAS environment variable (`eas env:set`) - the local .env file is
// gitignored and never reaches Expo's remote build servers.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Every request picks up whatever token is currently in SecureStore -
// simpler than threading it through React state, and it's always the
// freshest value right before the request goes out.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/expired/invalid - drop it so the next
// screen render sees "logged out" instead of silently retrying with a dead
// token. The screen itself (AuthContext) is responsible for navigating back
// to Login; this only clears the stale credential.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  },
);

// Axios's own "Network Error" doesn't say *why* - no internet, an
// unreachable/misconfigured API_URL, a timeout, or a real server-side
// error. Technicians using this app aren't developers, so the connectivity
// case gets one plain, actionable sentence - never the raw API URL or a
// bare JS/axios error string, which would just read as a random crash to
// them. A real backend error, on the other hand, always gets shown as-is:
// every technician-facing endpoint already replies with a clean, static
// message (e.g. "Failed to fetch assignments"), never raw exception/SQL
// text, so it's always safe and more specific than any generic fallback.
export function getErrorMessage(err: any, fallback: string): string {
  if (err?.response) {
    // The server responded - a real 4xx/5xx, use its own message.
    return err.response.data?.message || fallback;
  }
  if (err?.code === "ECONNABORTED") {
    return "The request took too long. Check your connection and try again.";
  }
  if (err?.request) {
    // Request went out, no response ever came back - a connectivity
    // problem, not a server error.
    return "Unable to connect to the server. Check your internet connection and try again.";
  }
  return fallback;
}
