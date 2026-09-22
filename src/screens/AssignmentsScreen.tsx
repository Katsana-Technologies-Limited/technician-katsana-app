import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Input } from "@/components/Input";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AssignmentCardSkeleton } from "@/components/AssignmentCardSkeleton";
import { useSidebar } from "@/context/SidebarContext";
import { useAssignmentsList } from "@/hooks/useAssignments";
import { toDisplayAssignment, type AssignmentStatus } from "@/lib/assignments";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const TABS: Array<{ key: string; label: string; status?: AssignmentStatus }> = [
  { key: "All", label: "All" },
  { key: "New", label: "New", status: "New" },
  { key: "Accepted", label: "Accepted", status: "Accepted" },
  { key: "In Progress", label: "In Progress", status: "In Progress" },
  { key: "Completed", label: "Completed", status: "Completed" },
  { key: "Cancelled", label: "Cancelled", status: "Cancelled" },
];

export default function AssignmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { open } = useSidebar();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { assignments: rawAssignments, isLoading } = useAssignmentsList();
  const assignments = rawAssignments.map(toDisplayAssignment);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesTab = tab === "All" || a.status === tab;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.assignmentNumber.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.vehicleNumber.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [tab, search, assignments]);

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        title="My Assignments"
        onMenuPress={() => open("Assignments")}
        onSearchPress={() => setShowSearch((v) => !v)}
      />
      <Screen>
        {showSearch && (
          <Input
            placeholder="Search by ID, customer, or vehicle number..."
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        )}

        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <AssignmentCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No assignments match your filters.</Text>
        ) : (
          filtered.map((a) => {
            // Once a job is Completed or Cancelled there's nothing left to
            // do with it - only still-actionable statuses (New, Accepted,
            // In Progress, Rescheduled) can be opened, so a technician can
            // always get back in to finish an install they started or
            // haven't started yet.
            const isOpenable = a.status !== "Completed" && a.status !== "Cancelled";
            return (
              <AssignmentCard
                key={a.id}
                assignment={a}
                displayNumber={a.assignmentNumber}
                disabled={!isOpenable}
                onPress={() => navigation.navigate("AssignmentDetails", { id: a.id })}
              />
            );
          })
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  tabActive: { backgroundColor: colors.brand700, borderColor: colors.brand700 },
  tabText: { fontSize: 12, fontWeight: "600", color: colors.slate600 },
  tabTextActive: { color: colors.white },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 40, fontSize: 13 },
});
