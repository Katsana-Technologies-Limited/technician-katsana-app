import { View, Text, StyleSheet } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { UserRound, ChevronDown, FileText } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { HistoryStatTile } from "@/components/HistoryStatTile";
import { AssignmentCard } from "@/components/AssignmentCard";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useAssignmentsList } from "@/hooks/useAssignments";
import { toDisplayAssignment } from "@/lib/assignments";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

// Anything not yet finished or dropped - matches what the "Pending Task"
// list below actually shows, so the Task History count and the list agree.
const PENDING_STATUSES = new Set(["New", "Accepted", "In Progress", "Rescheduled"]);

// Collection History has no backend yet (no collection/invoice concept
// anywhere in this app or vts-backend-katsana) - fake zeroed placeholders
// so the section reads correctly until a real endpoint exists. Swap for
// real data in one place once that's wired up.
const DEMO_TOTAL_COLLECTION = 0;
const DEMO_INVOICE_COUNT = 0;

export default function DashboardScreen() {
  const { technician } = useAuth();
  const { open } = useSidebar();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { assignments: rawAssignments, isLoading } = useAssignmentsList();
  const assignments = rawAssignments.map(toDisplayAssignment);

  const pendingAssignments = assignments.filter((a) => PENDING_STATUSES.has(a.status));
  const completedCount = assignments.filter((a) => a.status === "Completed").length;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Dashboard" onMenuPress={() => open("Home")} />
      <Screen>
        <Card style={styles.greetingCard}>
          <View style={styles.greetingLeft}>
            <View style={styles.avatar}>
              <UserRound size={22} color={colors.brand800} />
            </View>
            <View>
              <Text style={styles.greetingLabel}>Good Morning,</Text>
              <Text style={styles.greetingName}>{technician?.name ?? "Technician"}</Text>
            </View>
          </View>
          <Badge variant="accepted">Online</Badge>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task History</Text>
            <View style={styles.filterPill}>
              <Text style={styles.filterText}>All time</Text>
              <ChevronDown size={14} color={colors.slate500} />
            </View>
          </View>
          <View style={styles.tileRow}>
            <HistoryStatTile
              value={isLoading ? 0 : pendingAssignments.length}
              label="Pending Task"
              color={colors.rose500}
            />
            <HistoryStatTile
              value={isLoading ? 0 : completedCount}
              label="Completed Task"
              color={colors.emerald500}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Collection History</Text>
            <View style={styles.filterPill}>
              <Text style={styles.filterText}>All time</Text>
              <ChevronDown size={14} color={colors.slate500} />
            </View>
          </View>
          <View style={styles.tileRow}>
            <HistoryStatTile value={DEMO_TOTAL_COLLECTION} label="Total Collection" color={colors.sky500} />
            <HistoryStatTile value={DEMO_INVOICE_COUNT} label="Invoice Count" color={colors.emerald500} />
          </View>
        </Card>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Pending Task</Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Tabs", { screen: "Assignments" } as never)}
          >
            View All
          </Text>
        </View>

        {!isLoading && pendingAssignments.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <FileText size={26} color={colors.brand600} />
            </View>
            <Text style={styles.emptyTitle}>No tasks pending</Text>
            <Text style={styles.emptySubtitle}>
              No pending tasks. We'll notify you when an admin assigns one.
            </Text>
          </Card>
        )}

        {pendingAssignments.map((a) => (
          <AssignmentCard
            key={a.id}
            assignment={a}
            onPress={() => navigation.navigate("AssignmentDetails", { id: a.id })}
          />
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greetingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingLabel: { fontSize: 12, color: colors.slate500 },
  greetingName: { fontSize: 15, fontWeight: "700", color: colors.slate800 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: colors.slate600 },
  tileRow: { flexDirection: "row", gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate700 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontSize: 12, fontWeight: "600", color: colors.brand700 },
  emptyCard: { alignItems: "center", paddingVertical: 28, gap: 4 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  emptySubtitle: { fontSize: 12, color: colors.slate500, textAlign: "center", maxWidth: 260, lineHeight: 17 },
});
