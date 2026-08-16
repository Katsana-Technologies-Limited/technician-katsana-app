import { useState } from "react";
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
import { Eye, EyeOff, ShieldCheck } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.brandPanel}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>KATSANA</Text>
        </View>
        <Text style={styles.title}>Technician App</Text>
        <View style={styles.tip}>
          <ShieldCheck size={18} color={colors.brand100} />
          <Text style={styles.tipText}>
            Manage installations, testing, and customer handovers from anywhere.
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.formPanel}
      >
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Login to continue</Text>
          <Text style={styles.formSubtitle}>
            Enter your credentials to access your assignments.
          </Text>

          <Input
            placeholder="Mobile Number / Employee ID"
            value={mobile}
            onChangeText={setMobile}
            autoCapitalize="none"
            keyboardType="phone-pad"
          />

          <View>
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
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

          <Text style={styles.version}>v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  brandPanel: {
    backgroundColor: colors.brand900,
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoText: { color: colors.brand900, fontWeight: "800", fontSize: 15, letterSpacing: 1 },
  title: { color: colors.white, fontSize: 20, fontWeight: "800", marginTop: 14 },
  tip: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    borderRadius: 12,
    maxWidth: 320,
  },
  tipText: { color: colors.brand100, fontSize: 12, flex: 1, lineHeight: 17 },
  formPanel: { flex: 1 },
  formContent: { padding: 24, gap: 14 },
  formTitle: { fontSize: 20, fontWeight: "700", color: colors.slate800 },
  formSubtitle: { fontSize: 13, color: colors.slate500, marginTop: -8, marginBottom: 4 },
  eyeButton: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
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
  version: { textAlign: "center", fontSize: 11, color: colors.slate400, marginTop: 12 },
});
