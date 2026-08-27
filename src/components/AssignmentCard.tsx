import { View, Text, Pressable, StyleSheet } from "react-native";
import { MapPin, Clock, ClipboardList } from "lucide-react-native";
import { Card } from "./Card";
import { Badge, type BadgeVariant } from "./Badge";
import { colors } from "@/theme/colors";
import type { DisplayAssignment } from "@/lib/assignments";

const STATUS_BADGE: Record<string, BadgeVariant> = {
  New: "new",
  Accepted: "accepted",
  "In Progress": "inProgress",
  Completed: "completed",
  Rescheduled: "rescheduled",
  Cancelled: "cancelled",
};

export function AssignmentCard({
  assignment,
  onPress,
  // Defaults to the subscription number (what's meaningful to a
  // technician) - the Assignments list screen overrides this to the
  // assignment_number instead, since it's the one place a technician needs
  // to tell apart multiple visits for the same subscription.
  displayNumber,
}: {
  assignment: DisplayAssignment;
  onPress: () => void;
  displayNumber?: string;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <ClipboardList size={18} color={colors.brand800} />
        </View>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.id}>{displayNumber ?? assignment.subscriptionNumber}</Text>
            <Badge variant={STATUS_BADGE[assignment.status]}>{assignment.status}</Badge>
          </View>
          <Text style={styles.name}>{assignment.customerName}</Text>
          <Text style={styles.vehicle}>{assignment.vehicleNumber}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={12} color={colors.slate400} />
              <Text style={styles.metaText}>{assignment.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color={colors.slate400} />
              <Text style={styles.metaText}>{assignment.scheduleLabel}</Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  id: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  name: { fontSize: 14, fontWeight: "600", color: colors.slate700 },
  vehicle: { fontSize: 12, color: colors.slate500 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: colors.slate400 },
});
