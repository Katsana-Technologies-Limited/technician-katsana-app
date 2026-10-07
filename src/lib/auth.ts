import * as SecureStore from "expo-secure-store";

// Bearer token lives in SecureStore (Keychain on iOS, Keystore-backed
// EncryptedSharedPreferences on Android) - the native equivalent of the
// httpOnly cookie the web app (technician-katsana) relies on, since a
// native app has no shared cookie jar with the backend the way a browser
// does. See verifyTechnician.js on the backend: it already accepts
// `Authorization: Bearer <token>` as a fallback when there's no cookie,
// which is the only path this app ever uses.
const TOKEN_KEY = "technician_auth_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Fingerprint login (§100). A saved token can't be reused after the 15-minute
// idle logout (the backend ends that session), so a fingerprint match does a
// fresh login with the mobile + password saved here - encrypted, readable only
// while the phone is unlocked, never backed up or moved to another device.
// Kept on logout (that's when fingerprint is used); removed when the toggle
// is turned off or the saved password stops working.
const BIOMETRIC_ENABLED_KEY = "technician_biometric_enabled";
const BIOMETRIC_LOGIN_KEY = "technician_biometric_login";
const SECURE_OPTS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function getBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (enabled) await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
  else await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export interface SavedLogin {
  mobile: string;
  password: string;
}

export async function getSavedLogin(): Promise<SavedLogin | null> {
  const raw = await SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY, SECURE_OPTS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedLogin;
  } catch {
    return null;
  }
}

export async function saveLogin(login: SavedLogin): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_LOGIN_KEY, JSON.stringify(login), SECURE_OPTS);
}

export async function clearSavedLogin(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_LOGIN_KEY, SECURE_OPTS);
}
