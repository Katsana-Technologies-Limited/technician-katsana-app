import { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Search, Filter, Users, FileText, MapPin, ChevronRight, ChevronDown } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { useSidebar } from "@/context/SidebarContext";
import { useBillCollectionClients } from "@/hooks/useBillCollection";
import { formatTaka, DUE_STATUS_BADGE, type BillCollectionClient } from "@/lib/billCollection";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

// Cycled by row index, same "varied soft-color initial avatar" look the
// mockup shows across its client list - no per-client identity behind the
// color choice, purely visual rhythm so a long list doesn't read as one
// flat block.
const AVATAR_COLORS = [
  { bg: "#ede9fe", fg: "#7c3aed" }, // violet
  { bg: colors.emerald100, fg: colors.emerald600 },
  { bg: "#dbeafe", fg: "#2563eb" }, // blue
  { bg: colors.amber100, fg: colors.amber600 },
];

function ClientCard({
  client,
  colorIndex,
  onPress,
}: {
  client: BillCollectionClient;
  colorIndex: number;
  onPress: () => void;
}) {
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  // Already collected (awaiting CRM approval) - not enterable again until
  // that's resolved, so there's nothing to do inside the detail screen for
  // this client right now. No dimming/opacity change though - same as a
  // Completed card on the Assignments screen, which only changes
  // pressability, never the card's own appearance.
  return (
    <Pressable onPress={client.collected ? undefined : onPress}>
      <Card style={styles.clientCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
          <Text style={[styles.avatarText, { color: avatarColor.fg }]}>
            {client.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientBody}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
          {client.city && (
            <View style={styles.clientMeta}>
              <MapPin size={11} color={colors.slate400} />
              <Text style={styles.clientMetaText}>{client.city}</Text>
            </View>
          )}
        </View>
        <View style={styles.clientRight}>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatTaka(client.outstanding)}</Text>
            {!client.collected && <ChevronRight size={16} color={colors.slate300} />}
          </View>
          <Text style={styles.invoiceCount}>
            {client.invoice_count} Invoice{client.invoice_count === 1 ? "" : "s"}
          </Text>
          <Badge variant={DUE_STATUS_BADGE[client.status]}>{client.status}</Badge>
        </View>
      </Card>
    </Pressable>
  );
}

export default function BillCollectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { open } = useSidebar();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);
  const { clients, totalClients, totalOutstanding, isLoading } = useBillCollectionClients(search);

  // Debounced the same way every other search box in this app family does
  // (AppointmentsPage.tsx/CallCenterPage.tsx on the web side) - refetches
  // 400ms after typing stops, not on every keystroke.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeSearch = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 400);
  };

  const sortedClients = useMemo(() => clients, [clients]);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Bill Collection" onMenuPress={() => open("BillCollection")} />
      <Screen>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.slate400} />
            <TextInput
              ref={searchRef}
              value={searchInput}
              onChangeText={onChangeSearch}
              placeholder="Search by client name or phone"
              placeholderTextColor={colors.slate400}
              style={styles.searchInput}
            />
          </View>
          <Pressable style={styles.filterButton}>
            <Filter size={15} color={colors.slate600} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.emerald100 }]}>
              <Users size={18} color={colors.emerald600} />
            </View>
            <Text style={styles.statValue}>{isLoading ? "-" : totalClients}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
            <Text style={styles.statSub}>Assigned to you</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.amber100 }]}>
              <FileText size={18} color={colors.amber600} />
            </View>
            <Text style={styles.statValue}>{isLoading ? "-" : formatTaka(totalOutstanding)}</Text>
            <Text style={styles.statLabel}>Total Outstanding</Text>
            <Text style={styles.statSub}>From {isLoading ? "-" : totalClients} clients</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clients with Outstanding</Text>
          <View style={styles.sortPill}>
            <Text style={styles.sortText}>Sort by: Recent</Text>
            <ChevronDown size={13} color={colors.slate500} />
          </View>
        </View>

        {isLoading ? (
          <Text style={styles.empty}>Loading clients...</Text>
        ) : sortedClients.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No outstanding clients</Text>
            <Text style={styles.emptySubtitle}>
              Nothing to collect in your area right now.
            </Text>
          </Card>
        ) : (
          sortedClients.map((c, i) => (
            <ClientCard
              key={c.customer_id}
              client={c}
              colorIndex={i}
              onPress={() =>
                navigation.navigate("BillCollectionClientDetail", { customerId: c.customer_id })
              }
            />
          ))
        )}

        {!isLoading && sortedClients.length > 0 && (
          <Text style={styles.noMore}>No more clients</Text>
        )}
      </Screen>

      <Pressable style={styles.quickSearch} onPress={() => searchRef.current?.focus()}>
        <Search size={16} color={colors.white} />
        <Text style={styles.quickSearchText}>Quick Search</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.slate800 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  filterButtonText: { fontSize: 13, fontWeight: "600", color: colors.slate600 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, gap: 4 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.slate800 },
  statLabel: { fontSize: 12, fontWeight: "600", color: colors.slate700 },
  statSub: { fontSize: 11, color: colors.slate400 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  sortPill: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 12, fontWeight: "600", color: colors.slate500 },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 32, fontSize: 13 },
  emptyCard: { alignItems: "center", paddingVertical: 24, gap: 4 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  emptySubtitle: { fontSize: 12, color: colors.slate500, textAlign: "center" },
  clientCard: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" },
  clientBody: { flex: 1, gap: 2 },
  clientName: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  clientPhone: { fontSize: 12, color: colors.slate500 },
  clientMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  clientMetaText: { fontSize: 11, color: colors.slate400 },
  clientRight: { alignItems: "flex-end", gap: 4 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  amount: { fontSize: 15, fontWeight: "800", color: colors.rose600 },
  invoiceCount: { fontSize: 11, color: colors.slate400 },
  noMore: { textAlign: "center", color: colors.slate400, fontSize: 12, paddingVertical: 8 },
  quickSearch: {
    position: "absolute",
    right: 16,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brand800,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  quickSearchText: { fontSize: 13, fontWeight: "700", color: colors.white },
});
