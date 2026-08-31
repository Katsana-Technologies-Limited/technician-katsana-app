import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Phone, MapPin, CheckSquare, Square, Banknote, Smartphone } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { api, getErrorMessage } from "@/lib/api";
import { useBillCollectionClientDetail } from "@/hooks/useBillCollection";
import { formatTaka, formatDueDate, DUE_STATUS_BADGE, type BillCollectionInvoice } from "@/lib/billCollection";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

type PaymentMethod = "Cash" | "bKash";

function InvoiceRow({
  invoice,
  selected,
  onToggle,
}: {
  invoice: BillCollectionInvoice;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.invoiceRow}>
      {selected ? (
        <CheckSquare size={20} color={colors.brand700} />
      ) : (
        <Square size={20} color={colors.slate300} />
      )}
      <View style={styles.invoiceBody}>
        <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        <Text style={styles.invoiceMonth}>{invoice.month ?? "-"}</Text>
        <View style={styles.invoiceDueRow}>
          <Text style={styles.invoiceDue}>Due: {formatDueDate(invoice.due_date)}</Text>
          <Badge variant={DUE_STATUS_BADGE[invoice.status]}>{invoice.status}</Badge>
        </View>
      </View>
      <Text style={styles.invoiceAmount}>{formatTaka(invoice.amount)}</Text>
    </Pressable>
  );
}

export default function BillCollectionClientDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BillCollectionClientDetail">>();
  const { customerId } = route.params;
  const insets = useSafeAreaInsets();
  const { detail, isLoading, refetch } = useBillCollectionClientDetail(customerId);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [collecting, setCollecting] = useState(false);

  // Everything starts selected once the invoices load - matches the
  // mockup's default state ("Select All" already checked).
  useEffect(() => {
    if (detail?.invoices) {
      setSelectedIds(new Set(detail.invoices.map((inv) => inv.id)));
    }
  }, [detail?.invoices]);

  const invoices = detail?.invoices ?? [];
  const allSelected = invoices.length > 0 && selectedIds.size === invoices.length;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(invoices.map((inv) => inv.id)));
  };
  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedTotal = useMemo(
    () => invoices.filter((inv) => selectedIds.has(inv.id)).reduce((s, inv) => s + inv.amount, 0),
    [invoices, selectedIds],
  );

  const handleCollect = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Select at least one invoice");
      return;
    }
    setCollecting(true);
    try {
      const res = await api.post("/api/technician/bill-collection/collect", {
        invoice_ids: Array.from(selectedIds),
        method,
      });
      Alert.alert(
        "Payment Collected",
        res.data?.message || `${formatTaka(selectedTotal)} collected successfully.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      refetch();
    } catch (err: any) {
      Alert.alert("Collection Failed", getErrorMessage(err, "Failed to collect payment"));
    } finally {
      setCollecting(false);
    }
  };

  if (isLoading || !detail) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Client Details" onBack={() => navigation.goBack()} />
        <Screen>
          <Text style={styles.loadingText}>Loading client...</Text>
        </Screen>
      </View>
    );
  }

  const { customer } = detail;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Client Details" onBack={() => navigation.goBack()} />
      <Screen style={{ paddingBottom: 140 }}>
        <Card>
          <View style={styles.clientHeader}>
            <View style={styles.clientHeaderLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{customer.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.clientName}>{customer.name}</Text>
                  <Badge variant="accepted">{customer.status || "Active"}</Badge>
                </View>
              </View>
            </View>
            <View style={styles.clientIdBox}>
              <Text style={styles.clientIdLabel}>Client ID</Text>
              <Text style={styles.clientIdValue}>C{customer.id}</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <Phone size={13} color={colors.slate400} />
            <Text style={styles.contactText}>{customer.phone}</Text>
          </View>
          {(customer.address || customer.city) && (
            <View style={styles.contactRow}>
              <MapPin size={13} color={colors.slate400} />
              <Text style={styles.contactText}>
                {[customer.address, customer.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValueRed}>{formatTaka(detail.totalOutstanding)}</Text>
              <Text style={styles.statLabel}>Total Outstanding</Text>
              <Text style={styles.statSub}>{invoices.length} Invoice{invoices.length === 1 ? "" : "s"}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValueBlue}>{detail.totalVehicles}</Text>
              <Text style={styles.statLabel}>Total Vehicles</Text>
              <Text style={styles.statSub}>Active</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Outstanding Invoices</Text>
          <Pressable style={styles.selectAllRow} onPress={toggleAll}>
            {allSelected ? (
              <CheckSquare size={16} color={colors.brand700} />
            ) : (
              <Square size={16} color={colors.slate300} />
            )}
            <Text style={styles.selectAllText}>Select All</Text>
          </Pressable>
        </View>

        {invoices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No outstanding invoices.</Text>
          </Card>
        ) : (
          <Card style={{ gap: 0 }}>
            {invoices.map((inv, i) => (
              <View key={inv.id} style={i > 0 ? styles.invoiceDivider : undefined}>
                <InvoiceRow
                  invoice={inv}
                  selected={selectedIds.has(inv.id)}
                  onToggle={() => toggleOne(inv.id)}
                />
              </View>
            ))}
          </Card>
        )}

        <View style={styles.selectedRow}>
          <View style={styles.selectedBadgeRow}>
            <Text style={styles.selectedLabel}>Selected Invoices</Text>
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedIds.size}</Text>
            </View>
          </View>
          <Text style={styles.selectedTotal}>{formatTaka(selectedTotal)}</Text>
        </View>

        <Card>
          <Text style={styles.collectTitle}>Collect Payment</Text>
          <Text style={styles.fieldLabel}>Receive Amount</Text>
          <View style={styles.receiveBox}>
            <Text style={styles.receiveAmount}>{formatTaka(selectedTotal)}</Text>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Payment Method</Text>
          <View style={styles.methodRow}>
            <Pressable
              style={[styles.methodButton, method === "Cash" && styles.methodButtonActive]}
              onPress={() => setMethod("Cash")}
            >
              <Banknote size={16} color={method === "Cash" ? colors.brand700 : colors.slate500} />
              <Text style={[styles.methodText, method === "Cash" && styles.methodTextActive]}>Cash</Text>
            </Pressable>
            <Pressable
              style={[styles.methodButton, method === "bKash" && styles.methodButtonActive]}
              onPress={() => setMethod("bKash")}
            >
              <Smartphone size={16} color={method === "bKash" ? colors.brand700 : colors.slate500} />
              <Text style={[styles.methodText, method === "bKash" && styles.methodTextActive]}>bKash</Text>
            </Pressable>
          </View>
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button
          onPress={handleCollect}
          loading={collecting}
          disabled={selectedIds.size === 0}
          icon={<Banknote size={16} color={colors.white} />}
        >
          Collect {formatTaka(selectedTotal)}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: { textAlign: "center", color: colors.slate400, paddingVertical: 40, fontSize: 13 },
  clientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  clientHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand100, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 17, fontWeight: "700", color: colors.brand800 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  clientName: { fontSize: 16, fontWeight: "700", color: colors.slate800 },
  clientIdBox: { alignItems: "flex-end" },
  clientIdLabel: { fontSize: 10, color: colors.slate400 },
  clientIdValue: { fontSize: 13, fontWeight: "700", color: colors.slate700 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  contactText: { fontSize: 12.5, color: colors.slate600 },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate100 },
  statBlock: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch", backgroundColor: colors.slate200 },
  statValueRed: { fontSize: 19, fontWeight: "800", color: colors.rose600 },
  statValueBlue: { fontSize: 19, fontWeight: "800", color: "#2563eb" },
  statLabel: { fontSize: 11.5, color: colors.slate600, fontWeight: "600" },
  statSub: { fontSize: 10.5, color: colors.slate400 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  selectAllRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectAllText: { fontSize: 12, fontWeight: "600", color: colors.slate600 },
  emptyCard: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: colors.slate400 },
  invoiceDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate100 },
  invoiceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  invoiceBody: { flex: 1, gap: 3 },
  invoiceNumber: { fontSize: 13.5, fontWeight: "700", color: colors.slate800 },
  invoiceMonth: { fontSize: 12, color: colors.slate500 },
  invoiceDueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  invoiceDue: { fontSize: 11, color: colors.slate400 },
  invoiceAmount: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brand50,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedLabel: { fontSize: 12.5, fontWeight: "600", color: colors.slate700 },
  selectedCountBadge: { backgroundColor: colors.brand700, borderRadius: 999, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  selectedCountText: { fontSize: 11, fontWeight: "700", color: colors.white },
  selectedTotal: { fontSize: 15, fontWeight: "800", color: colors.brand800 },
  collectTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800, marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.slate600, marginBottom: 6 },
  receiveBox: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.slate50 },
  receiveAmount: { fontSize: 16, fontWeight: "700", color: colors.slate800 },
  methodRow: { flexDirection: "row", gap: 10 },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  methodButtonActive: { borderColor: colors.brand700, backgroundColor: colors.brand50 },
  methodText: { fontSize: 13.5, fontWeight: "600", color: colors.slate500 },
  methodTextActive: { color: colors.brand800 },
  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
    padding: 12,
  },
});
