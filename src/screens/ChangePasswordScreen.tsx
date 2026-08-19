import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { api, getErrorMessage } from "@/lib/api";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// One shared show/hide toggle since it's the same three-field pattern
// three times over - avoids repeating the icon/eyeButton boilerplate.
function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        style={styles.inputWithIcon}
      />
      <Lock size={18} color={colors.slate400} style={styles.inputIcon} />
      <Pressable onPress={() => setVisible((v) => !v)} style={styles.eyeButton} hitSlop={8}>
        {visible ? (
          <EyeOff size={18} color={colors.slate400} />
        ) : (
          <Eye size={18} color={colors.slate400} />
        )}
      </Pressable>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("All three fields are required");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("New password and confirm password don't match");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/technician/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      Alert.alert("Password changed successfully");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Change Password" onBack={() => navigation.goBack()} />
      <Screen>
        <Card style={{ gap: 14 }}>
          <PasswordField label="Old Password" value={oldPassword} onChangeText={setOldPassword} />
          <PasswordField label="New Password" value={newPassword} onChangeText={setNewPassword} />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button onPress={handleSubmit} loading={submitting} style={{ marginTop: 4 }}>
            Update Password
          </Button>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWithIcon: { paddingLeft: 38 },
  inputIcon: { position: "absolute", left: 12, bottom: 13 },
  eyeButton: { position: "absolute", right: 14, bottom: 0, height: 44, justifyContent: "center" },
});
