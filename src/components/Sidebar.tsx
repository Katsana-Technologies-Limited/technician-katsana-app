import { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Home, ClipboardList, Package, History as HistoryIcon, X, UserRound, LogOut } from "lucide-react-native";
import { useSidebar, type SidebarRoute } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const NAV_ITEMS: Array<{ key: SidebarRoute; label: string; icon: typeof Home }> = [
  { key: "Home", label: "Home", icon: Home },
  { key: "Assignments", label: "Assignments", icon: ClipboardList },
  { key: "Inventory", label: "Inventory", icon: Package },
  { key: "History", label: "History", icon: HistoryIcon },
];

const DRAWER_WIDTH = 256;

// Mirrors technician-katsana's mobile slide-in drawer (TechnicianShell.tsx):
// dark backdrop + white panel sliding in from the left, same nav links,
// profile row, and logout action. Always mounted (rather than unmounted when
// closed) so the closing slide-out animation has something to animate.
export function Sidebar() {
  const { visible, activeRoute, close } = useSidebar();
  const { technician, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  const goToTab = (screen: "Home" | "Assignments" | "Inventory" | "History" | "More") => {
    close();
    navigation.navigate("Tabs", { screen } as never);
  };

  const initials = (technician?.name ?? "Technician")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const photoUri = technician?.photo ? `${API_URL}${technician.photo}` : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[styles.panel, { paddingTop: insets.top + 16, transform: [{ translateX }] }]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Pressable onPress={close} hitSlop={10}>
            <X size={20} color={colors.slate400} />
          </Pressable>
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = key === activeRoute;
            return (
              <Pressable
                key={key}
                onPress={() => goToTab(key as "Home" | "Assignments" | "Inventory" | "History")}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <Icon size={18} color={active ? colors.white : colors.slate600} />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={styles.profileRow}
            onPress={() => {
              close();
              navigation.navigate("Profile");
            }}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {technician?.name ?? "Technician"}
              </Text>
              <Text style={styles.profileRole} numberOfLines={1}>
                {technician?.role ?? "Technician"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.logoutRow}
            onPress={() => {
              close();
              logout();
            }}
          >
            <LogOut size={16} color={colors.rose600} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate100,
  },
  logo: { width: 120, height: 32 },
  nav: { flex: 1, paddingHorizontal: 12, paddingTop: 12, gap: 4 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  navItemActive: { backgroundColor: colors.brand700 },
  navLabel: { fontSize: 14, fontWeight: "600", color: colors.slate700 },
  navLabelActive: { color: colors.white },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate100, padding: 12, gap: 4 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 10, backgroundColor: colors.slate50 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.slate200, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 34, height: 34, borderRadius: 17 },
  avatarText: { fontSize: 12, fontWeight: "700", color: colors.slate600 },
  profileName: { fontSize: 13, fontWeight: "600", color: colors.slate700 },
  profileRole: { fontSize: 11, color: colors.brand600, marginTop: 1 },
  logoutRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  logoutText: { fontSize: 13, fontWeight: "600", color: colors.rose600 },
});
