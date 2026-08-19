import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { Eye, EyeOff, User, Lock, Fingerprint } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";
import { colors } from "@/theme/colors";

export default function LoginScreen() {
  const { login, canLoginWithBiometric, loginWithBiometric } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Re-checked every time this screen mounts (rather than trusted from
  // context state) since the answer depends on a fresh SecureStore read -
  // it can flip to false mid-session if the saved token expired.
  useEffect(() => {
    canLoginWithBiometric().then(setShowBiometric);
  }, []);

  const handleSubmit = async () => {
    if (!mobile.trim() || !password.trim()) {
      setError("Enter your mobile number/employee ID and password");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(mobile.trim(), password, remember);
    } catch (err: any) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    setBiometricBusy(true);
    try {
      const result = await loginWithBiometric();
      if (result === "expired") {
        setError("Your saved session has expired - please login with your password.");
        setShowBiometric(false);
      }
      // "cancelled" - leave the button up so they can just try again.
    } finally {
      setBiometricBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Image
        source={require("../../assets/login-background.png")}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require("../../assets/katsana-fieldforce.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.card}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Login to continue to your account</Text>

              <Input
                label="Mobile Number / Employee ID"
                placeholder="Enter your ID"
                value={mobile}
                onChangeText={setMobile}
                autoCapitalize="none"
                keyboardType="phone-pad"
                style={styles.inputWithIcon}
              />
              <User size={18} color={colors.slate400} style={styles.inputIcon} />

              <View>
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.inputWithIcon}
                />
                <Lock size={18} color={colors.slate400} style={styles.inputIcon} />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.slate400} />
                  ) : (
                    <Eye size={18} color={colors.slate400} />
                  )}
                </Pressable>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable style={styles.rememberRow} onPress={() => setRemember((v) => !v)}>
                <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              <Button onPress={handleSubmit} loading={submitting} style={{ marginTop: 4 }}>
                Login
              </Button>

              {showBiometric && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Button
                    variant="outline"
                    onPress={handleBiometricLogin}
                    loading={biometricBusy}
                    icon={<Fingerprint size={18} color={colors.brand700} />}
                  >
                    Login with Fingerprint
                  </Button>
                </>
              )}

              <View style={styles.footer}>
                <Text style={styles.version}>Version 1.0.0</Text>
                <Text style={styles.copyright}>
                  © {new Date().getFullYear()} <Text style={styles.copyrightBrand}>Katsana Technologies Ltd.</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 100 },
  logo: { width: 300, height: 96, alignSelf: "center", marginBottom: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.slate800, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.slate500, textAlign: "center", marginTop: -8, marginBottom: 4 },
  inputWithIcon: { paddingLeft: 38 },
  inputIcon: { position: "absolute", left: 12, bottom: 13 },
  eyeButton: { position: "absolute", right: 14, bottom: 0, height: 44, justifyContent: "center" },
  error: { color: colors.rose600, fontSize: 13 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.slate300,
  },
  checkboxChecked: { backgroundColor: colors.brand700, borderColor: colors.brand700 },
  rememberText: { fontSize: 13, color: colors.slate600 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.slate200 },
  dividerText: { fontSize: 12, color: colors.slate400 },
  footer: { alignItems: "center", marginTop: 4, gap: 2 },
  version: { fontSize: 11, color: colors.slate400 },
  copyright: { fontSize: 11, color: colors.slate400 },
  copyrightBrand: { color: colors.brand700, fontWeight: "600" },
});
