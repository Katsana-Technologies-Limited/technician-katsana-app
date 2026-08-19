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

// Whether the technician has opted in to fingerprint/Face ID login. Stored
// alongside the token rather than in AsyncStorage so both live in the same
// secure vault, even though this flag itself isn't sensitive.
const BIOMETRIC_ENABLED_KEY = "technician_biometric_enabled";

export async function getBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  }
}
