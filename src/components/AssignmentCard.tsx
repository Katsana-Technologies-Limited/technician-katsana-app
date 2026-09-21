import { View, Text, Pressable, StyleSheet } from "react-native";
import { MapPin, Clock, ClipboardList, CalendarClock } from "lucide-react-native";
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
  // Set by AssignmentsScreen for a Completed/Cancelled row - once a job is
  // done there's nothing left to open it for, so it's just un-tappable
  // instead of navigating anywhere - same full-color appearance otherwise.
  disabled,
}: {
  assignment: DisplayAssignment;
  onPress: () => void;
  displayNumber?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
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
          <View style={styles.detailBlock}>
            {/* The title already IS the subscription number on cards that
                don't override displayNumber (e.g. the dashboard) - only add
                the line where the title is something else (the task list
                shows the assignment number). */}
            {displayNumber && displayNumber !== assignment.subscriptionNumber && (
              <Text style={styles.detailText}>
                Subscription: <Text style={styles.detailValue}>{assignment.subscriptionNumber}</Text>
              </Text>
            )}
            {assignment.deviceImei !== "-" && (
              <Text style={styles.detailText}>
                IMEI: <Text style={styles.detailValue}>{assignment.deviceImei}</Text>
              </Text>
            )}
            {assignment.simNumber !== "-" && (
              <Text style={styles.detailText}>
                SIM: <Text style={styles.detailValue}>{assignment.simNumber}</Text>
              </Text>
            )}
          </View>
          {assignment.speedotrackPending && (
            <Text style={styles.speedotrackText}>
              Not added to Speedotrack - open to retry
            </Text>
          )}
          {assignment.appointmentDate !== "-" && (
            <View style={styles.appointmentRow}>
              <CalendarClock size={12} color={colors.slate500} />
              <Text style={styles.appointmentText}>
                {assignment.appointmentDate}
                {assignment.appointmentTime !== "-" ? `, ${assignment.appointmentTime}` : ""}
              </Text>
            </View>
          )}
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
  cardDisabled: { opacity: 0.6 },
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
  detailBlock: { gap: 1, marginTop: 2 },
  detailText: { fontSize: 12, color: colors.slate500 },
  detailValue: { fontWeight: "600", color: colors.slate700 },
  speedotrackText: { fontSize: 12, fontWeight: "700", color: colors.rose600, marginTop: 2 },
  appointmentRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  appointmentText: { fontSize: 11, color: colors.slate500 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: colors.slate400 },
});
