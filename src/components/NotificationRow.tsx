import { View, Text, Pressable, StyleSheet } from "react-native";
import { ClipboardList } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { Card } from "@/components/Card";
import type { AppNotification } from "@/context/NotificationContext";

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Shared between NotificationDropdown (bell quick-glance, max 3 visible) and
// NotificationsScreen (full list) so the two stay visually identical.
export function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const unread = !item.read_at;
  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.row, unread && styles.rowUnread]}>
        <View style={styles.iconBadge}>
          <ClipboardList size={16} color={colors.emerald600} />
        </View>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {unread && <View style={styles.unreadDot} />}
          </View>
          {item.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rowUnread: { borderWidth: 1, borderColor: colors.emerald100, backgroundColor: colors.brand50 },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.emerald100,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13.5, fontWeight: "700", color: colors.slate800, flexShrink: 1 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.rose500 },
  body: { fontSize: 12.5, color: colors.slate600, lineHeight: 17 },
  time: { fontSize: 11, color: colors.slate400, marginTop: 2 },
});
