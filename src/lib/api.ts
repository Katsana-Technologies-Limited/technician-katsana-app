import axios from "axios";
import { getToken, clearToken } from "./auth";

// EXPO_PUBLIC_* vars are inlined at build/start time by Expo - set
// EXPO_PUBLIC_API_URL in .env (see .env.example) to point at
// vts-backend-katsana, same backend technician-katsana (web) already talks
// to. Falls back to localhost for a same-machine dev server; on a physical
// device or emulator this must be your machine's LAN IP instead.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4002";

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
