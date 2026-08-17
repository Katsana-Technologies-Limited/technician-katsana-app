import { View, Text, StyleSheet } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import {
  UserRound,
  ClipboardPlus,
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { AssignmentCard } from "@/components/AssignmentCard";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useAssignmentsList } from "@/hooks/useAssignments";
import { toDisplayAssignment } from "@/lib/assignments";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STAT_CARDS = [
  { key: "New", label: "New Assignments", icon: ClipboardPlus, tone: colors.sky100 },
  { key: "Accepted", label: "Accepted", icon: CheckCircle2, tone: colors.emerald100 },
  { key: "In Progress", label: "In Progress", icon: Loader2, tone: colors.amber100 },
  { key: "Completed", label: "Completed", icon: CheckCircle2, tone: colors.emerald100 },
  { key: "Rescheduled", label: "Rescheduled", icon: RotateCcw, tone: colors.violet100 },
  { key: "Cancelled", label: "Cancelled", icon: XCircle, tone: colors.rose100 },
] as const;

export default function DashboardScreen() {
  const { technician } = useAuth();
  const { open } = useSidebar();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { assignments: rawAssignments, isLoading } = useAssignmentsList();
  const assignments = rawAssignments.map(toDisplayAssignment);

  const stats = STAT_CARDS.reduce(
    (acc, { key }) => {
      acc[key] = assignments.filter((a) => a.status === key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const today = new Date();
  const todaysSchedule = rawAssignments
    .filter((a) => {
      const d = new Date(a.assigned_on);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    })
    .map(toDisplayAssignment);

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

        <View>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
        </View>

        <View style={styles.statGrid}>
          {STAT_CARDS.map(({ key, label, icon: Icon, tone }) => (
            <StatCard
              key={key}
              icon={<Icon size={17} color={colors.slate700} />}
              value={isLoading ? 0 : stats[key] || 0}
              label={label}
              tone={tone}
            />
          ))}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Tabs", { screen: "Assignments" } as never)}
          >
            View All
          </Text>
        </View>

        {!isLoading && todaysSchedule.length === 0 && (
          <Text style={styles.empty}>Nothing scheduled for today.</Text>
        )}

        {todaysSchedule.map((a) => (
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
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate700 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { fontSize: 12, fontWeight: "600", color: colors.brand700 },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 24, fontSize: 13 },
});
