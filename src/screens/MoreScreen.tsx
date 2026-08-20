import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { UserRound, LogOut, Fingerprint, Lock, ChevronRight } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function MoreScreen() {
  const {
    technician,
    logout,
    biometricSupported,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
  } = useAuth();
  const { open } = useSidebar();
  const navigation = useNavigation<Nav>();
  const [togglingBiometric, setTogglingBiometric] = useState(false);

  const onToggleBiometric = async (value: boolean) => {
    setTogglingBiometric(true);
    try {
      if (value) {
        const confirmed = await enableBiometric();
        if (!confirmed) {
          Alert.alert("Fingerprint not confirmed", "Try again to enable fingerprint login.");
        }
      } else {
        await disableBiometric();
      }
    } finally {
      setTogglingBiometric(false);
    }
  };

  const photoUri = technician?.photo ? `${API_URL}${technician.photo}` : null;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="More" onMenuPress={() => open("More")} />
      <Screen>
        <Pressable onPress={() => navigation.navigate("Profile")}>
          <Card style={styles.profileCard}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <UserRound size={26} color={colors.brand800} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{technician?.name ?? "Technician"}</Text>
              <Text style={styles.role}>{technician?.role ?? "Field Technician"}</Text>
              <Text style={styles.mobile}>{technician?.mobile}</Text>
            </View>
            <ChevronRight size={18} color={colors.slate400} />
          </Card>
        </Pressable>

        <Card style={{ padding: 0 }}>
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("Profile")}
          >
            <View style={styles.rowLabel}>
              <UserRound size={18} color={colors.slate500} />
              <Text style={styles.rowText}>Profile</Text>
            </View>
            <ChevronRight size={18} color={colors.slate400} />
          </Pressable>
          <View style={styles.rowDivider} />
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <View style={styles.rowLabel}>
              <Lock size={18} color={colors.slate500} />
              <Text style={styles.rowText}>Change Password</Text>
            </View>
            <ChevronRight size={18} color={colors.slate400} />
          </Pressable>
        </Card>

        {biometricSupported && (
          <Card style={styles.biometricRow}>
            <View style={styles.biometricLabel}>
              <Fingerprint size={20} color={colors.brand700} />
              <View>
                <Text style={styles.biometricTitle}>Login with Fingerprint</Text>
                <Text style={styles.biometricSubtitle}>
                  Use your fingerprint instead of your password after logout
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={onToggleBiometric}
              disabled={togglingBiometric}
              trackColor={{ true: colors.brand500, false: colors.slate300 }}
            />
          </Card>
        )}

        <Button
          variant="outline"
          onPress={logout}
          icon={<LogOut size={16} color={colors.rose600} />}
          style={{ borderColor: colors.rose100 }}
        >
          <Text style={{ color: colors.rose600, fontWeight: "600" }}>Logout</Text>
        </Button>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  name: { fontSize: 16, fontWeight: "700", color: colors.slate800 },
  role: { fontSize: 12, color: colors.slate500, marginTop: 1 },
  mobile: { fontSize: 12, color: colors.slate400, marginTop: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, fontWeight: "500", color: colors.slate700 },
  rowDivider: { height: 1, backgroundColor: colors.slate200, marginLeft: 16 },
  biometricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  biometricLabel: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  biometricTitle: { fontSize: 14, fontWeight: "600", color: colors.slate800 },
  biometricSubtitle: { fontSize: 11, color: colors.slate500, marginTop: 1 },
});
