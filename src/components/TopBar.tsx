import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, ChevronLeft, Bell, Search } from "lucide-react-native";
import { colors } from "@/theme/colors";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  rightSlot?: React.ReactNode;
  showBell?: boolean;
}

// Matches the reference mockup's light top bar: hamburger (or back chevron)
// + title on the left, optional search/bell on the right. The bottom tab
// bar handles primary navigation, so this stays lightweight - the "Menu"
// icon opens the same profile/logout sheet as the More tab. Detail/flow
// screens (back-chevron screens) hide the bell, matching the mockup - only
// the top-level tab screens surface notifications.
export function TopBar({
  title,
  onBack,
  onMenuPress,
  onSearchPress,
  rightSlot,
  showBell = !onBack,
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        <Pressable onPress={onBack ?? onMenuPress} hitSlop={10}>
          {onBack ? (
            <ChevronLeft size={22} color={colors.slate700} />
          ) : (
            <Menu size={22} color={colors.slate700} />
          )}
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.right}>
        {onSearchPress && (
          <Pressable onPress={onSearchPress} hitSlop={10}>
            <Search size={20} color={colors.slate600} />
          </Pressable>
        )}
        {rightSlot}
        {showBell && (
          <Pressable hitSlop={10}>
            <View>
              <Bell size={20} color={colors.slate600} />
              <View style={styles.dot} />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate200,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  title: { fontSize: 17, fontWeight: "700", color: colors.slate800, flexShrink: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  dot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.rose500,
  },
});
