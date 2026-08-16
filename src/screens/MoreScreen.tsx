import { View, Text, StyleSheet } from "react-native";
import { UserRound, LogOut } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { colors } from "@/theme/colors";

export default function MoreScreen() {
  const { technician, logout } = useAuth();
  const { open } = useSidebar();

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
});
