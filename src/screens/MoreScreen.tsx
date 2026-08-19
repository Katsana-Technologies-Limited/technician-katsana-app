import { useState } from "react";
import { View, Text, StyleSheet, Switch, Alert } from "react-native";
import { UserRound, LogOut, Fingerprint } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { colors } from "@/theme/colors";

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

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="More" onMenuPress={() => open("More")} />
      <Screen>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserRound size={26} color={colors.brand800} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{technician?.name ?? "Technician"}</Text>
            <Text style={styles.role}>{technician?.role ?? "Field Technician"}</Text>
            <Text style={styles.mobile}>{technician?.mobile}</Text>
          </View>
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
  name: { fontSize: 16, fontWeight: "700", color: colors.slate800 },
  role: { fontSize: 12, color: colors.slate500, marginTop: 1 },
  mobile: { fontSize: 12, color: colors.slate400, marginTop: 1 },
  biometricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  biometricLabel: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  biometricTitle: { fontSize: 14, fontWeight: "600", color: colors.slate800 },
  biometricSubtitle: { fontSize: 11, color: colors.slate500, marginTop: 1 },
});
