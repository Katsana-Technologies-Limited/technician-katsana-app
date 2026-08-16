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
import { dashboardStats, assignments } from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STAT_CARDS = [
  { key: "newAssignments", label: "New Assignments", icon: ClipboardPlus, tone: colors.sky100 },
  { key: "accepted", label: "Accepted", icon: CheckCircle2, tone: colors.emerald100 },
  { key: "inProgress", label: "In Progress", icon: Loader2, tone: colors.amber100 },
  { key: "completedToday", label: "Completed Today", icon: CheckCircle2, tone: colors.emerald100 },
  { key: "rescheduled", label: "Rescheduled", icon: RotateCcw, tone: colors.violet100 },
  { key: "cancelled", label: "Cancelled", icon: XCircle, tone: colors.rose100 },
] as const;

export default function DashboardScreen() {
  const { technician } = useAuth();
  const { open } = useSidebar();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const todaysSchedule = assignments.filter((a) => a.scheduleLabel.startsWith("Today"));

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
              value={dashboardStats[key]}
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
});
