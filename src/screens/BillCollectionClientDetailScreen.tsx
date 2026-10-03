import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Modal } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Phone, MapPin, CheckSquare, Square, SquareMinus, Banknote, Smartphone, X } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { api, getErrorMessage } from "@/lib/api";
import { useBillCollectionClientDetail } from "@/hooks/useBillCollection";
import { formatTaka, formatDueDate, type BillCollectionInvoice } from "@/lib/billCollection";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";
import { BillCollectionDetailSkeleton } from "@/components/PageSkeletons";

type PaymentMethod = "Cash" | "bKash";

// One installation invoice: header checkbox (all its vehicles) + one row per
// completed vehicle that can be ticked individually (backend §96). Vehicles
// not installed yet are shown greyed out - billed after installation.
function InvoiceRow({
  invoice,
  selectedSubs,
  onToggleInvoice,
  onToggleSub,
}: {
  invoice: BillCollectionInvoice;
  selectedSubs: Set<number>;
  onToggleInvoice: () => void;
  onToggleSub: (subscriptionId: number) => void;
}) {
  const lines = invoice.lines ?? [];
  const picked = lines.filter((l) => selectedSubs.has(l.subscription_id));
  const all = lines.length > 0 && picked.length === lines.length;
  const amount = picked.reduce((sum, l) => sum + l.total, 0);
  const total = invoice.total_vehicles ?? lines.length;
  const installed = invoice.installed_vehicles ?? invoice.vehicles ?? lines.length;
  // All vehicles installed -> billed and collected as one whole invoice (as
  // before); vehicles can only be picked one by one while some still wait
  // for installation.
  const wholeInvoice = lines.length > 0 && lines.length === total;
  return (
    <View>
      <Pressable onPress={onToggleInvoice} disabled={lines.length === 0} style={styles.invoiceRow}>
        {all ? (
          <CheckSquare size={20} color={colors.brand700} />
        ) : picked.length > 0 ? (
          <SquareMinus size={20} color={colors.brand700} />
        ) : (
          <Square size={20} color={colors.slate300} />
        )}
        <View style={styles.invoiceBody}>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={styles.invoiceMonth}>{invoice.month ?? "-"}</Text>
          {installed < total ? (
            <Text style={styles.invoicePartial}>
              {installed} of {total} vehicles installed - rest after installation
            </Text>
          ) : null}
          {invoice.already_collected ? (
            <Text style={styles.invoiceCollected}>Collected - awaiting CRM approval</Text>
          ) : null}
          <View style={styles.invoiceDueRow}>
            <Text style={styles.invoiceDue}>Due: {formatDueDate(invoice.due_date)}</Text>

          </View>
        </View>
        <Text style={styles.invoiceAmount}>{formatTaka(amount)}</Text>
      </Pressable>

      {lines.length > 0 && (
        <View style={styles.vehicleList}>
          {lines.map((l) => {
            const on = selectedSubs.has(l.subscription_id);
            return (
              <Pressable
                key={l.subscription_id}
                onPress={wholeInvoice ? onToggleInvoice : () => onToggleSub(l.subscription_id)}
                style={[styles.vehicleRow, on && styles.vehicleRowOn]}
              >
                {wholeInvoice ? (
                  <View style={styles.vehicleDot} />
                ) : on ? (
                  <CheckSquare size={16} color={colors.brand700} />
                ) : (
                  <Square size={16} color={colors.slate300} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleName}>
                    {l.subscription_number || "-"}
                    {l.registration_no ? ` · ${l.registration_no}` : ""}
                  </Text>
                  <Text style={styles.vehicleSub}>
                    Monthly {formatTaka(l.monthly)} + Installation {formatTaka(l.installation)}
                  </Text>
                </View>
                <Text style={styles.vehicleTotal}>{formatTaka(l.total)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function BillCollectionClientDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BillCollectionClientDetail">>();
  const { customerId } = route.params;
  const insets = useSafeAreaInsets();
  const { detail, isLoading } = useBillCollectionClientDetail(customerId);
  const invoices = useMemo(() => detail?.invoices ?? [], [detail?.invoices]);

  // Ticked vehicles (subscription ids) - the unit billed and paid (§96).
  const [selectedSubs, setSelectedSubs] = useState<Set<number>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [collecting, setCollecting] = useState(false);
  // Set once a bKash checkout session is created - opens the in-app WebView
  // modal below and drives the status poll while it's open.
  const [bkashUrl, setBkashUrl] = useState<string | null>(null);
  const [pollingTranId, setPollingTranId] = useState<string | null>(null);
  // Amount + invoice count captured when the bKash checkout starts, so the
  // result screen shows what was actually charged even if the technician
  // toggled invoices while the customer was paying.
  const [bkashCtx, setBkashCtx] = useState<{
    amount: number;
    invoiceCount: number;
  } | null>(null);

  // Everything starts selected once the invoices load (or reload after a
  // partial collection) - matches the mockup's default state ("Select All"
  // already checked). Adjusted during render instead of in an effect (see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes) -
  // an effect-based reset commits an extra render pass with the stale
  // selection before the reset takes effect; this bails out and re-renders
  // immediately instead.
  const [selectedForInvoices, setSelectedForInvoices] = useState<
    BillCollectionInvoice[] | null
  >(null);
  if (detail?.invoices && detail.invoices !== selectedForInvoices) {
    setSelectedForInvoices(detail.invoices);
    setSelectedSubs(new Set(detail.invoices.flatMap((inv) => (inv.lines ?? []).map((l) => l.subscription_id))));
  }

  const allSubIds = invoices.flatMap((inv) => (inv.lines ?? []).map((l) => l.subscription_id));
  const allSelected = allSubIds.length > 0 && allSubIds.every((id) => selectedSubs.has(id));

  const toggleAll = () => {
    setSelectedSubs(allSelected ? new Set() : new Set(allSubIds));
  };
  const toggleInvoice = (inv: BillCollectionInvoice) => {
    const ids = (inv.lines ?? []).map((l) => l.subscription_id);
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      const everyOn = ids.every((id) => next.has(id));
      ids.forEach((id) => (everyOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };
  const toggleSub = (id: number) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Invoices with at least one ticked vehicle, and what the bill shows.
  const selectedIds = useMemo(
    () =>
      new Set(
        invoices
          .filter((inv) => (inv.lines ?? []).some((l) => selectedSubs.has(l.subscription_id)))
          .map((inv) => inv.id),
      ),
    [invoices, selectedSubs],
  );
  const selectedTotal = useMemo(
    () =>
      invoices
        .flatMap((inv) => inv.lines ?? [])
        .filter((l) => selectedSubs.has(l.subscription_id))
        .reduce((sum, l) => sum + l.total, 0),
    [invoices, selectedSubs],
  );

  const handleCollect = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Select at least one invoice");
      return;
    }

    if (method === "bKash") {
      setCollecting(true);
      try {
        const res = await api.post("/api/technician/bill-collection/collect-bkash", {
          invoice_ids: Array.from(selectedIds),
          subscription_ids: Array.from(selectedSubs),
        });
        const { payment_url, tran_id } = res.data || {};
        if (!payment_url || !tran_id) {
          navigation.navigate("BillCollectionResult", {
            status: "error",
            customerId,
            message: "Could not start the bKash checkout. Please try again.",
          });
          return;
        }
        setBkashCtx({ amount: selectedTotal, invoiceCount: selectedIds.size });
        setBkashUrl(payment_url);
        setPollingTranId(tran_id);
      } catch (err: any) {
        navigation.navigate("BillCollectionResult", {
          status: "error",
          customerId,
          message: getErrorMessage(err, "Failed to start bKash checkout"),
        });
      } finally {
        setCollecting(false);
      }
      return;
    }

    setCollecting(true);
    try {
      const res = await api.post("/api/technician/bill-collection/collect", {
        invoice_ids: Array.from(selectedIds),
        subscription_ids: Array.from(selectedSubs),
      });
      navigation.navigate("BillCollectionResult", {
        status: "success",
        method: "Cash",
        amount: selectedTotal,
        invoiceCount: selectedIds.size,
        customerName: detail?.customer?.name,
        customerId,
        message:
          res.data?.message ||
          `${formatTaka(selectedTotal)} added to your wallet`,
      });
    } catch (err: any) {
      navigation.navigate("BillCollectionResult", {
        status: "error",
        customerId,
        message: getErrorMessage(err, "Failed to collect payment"),
      });
    } finally {
      setCollecting(false);
    }
  };

  const bkashSuccess = () => {
    setPollingTranId(null);
    setBkashUrl(null);
    navigation.navigate("BillCollectionResult", {
      status: "success",
      method: "bKash",
      amount: bkashCtx?.amount,
      invoiceCount: bkashCtx?.invoiceCount,
      customerName: detail?.customer?.name,
      customerId,
      message: "Added to your wallet - submit to Accounts to get it marked Paid",
    });
  };
  const bkashFailed = (message: string) => {
    setPollingTranId(null);
    setBkashUrl(null);
    navigation.navigate("BillCollectionResult", {
      status: "error",
      customerId,
      message,
    });
  };

  // The bKash checkout runs inside the WebView modal below. bKash redirects
  // to the backend callback when done, which then redirects again to one of
  // payment-katsana's own result pages - watching the WebView's URL for
  // those is the fastest, and (for a failed/cancelled payment) the ONLY
  // signal, since the status poll only ever confirms a genuine PAID.
  const handleWebViewNav = (url: string | undefined) => {
    if (!url) return;
    if (/\/payment-success\b/.test(url)) {
      // Let the poll do the authoritative confirm (a payment_records row
      // must exist) - just kick it immediately instead of waiting up to 3s.
      void pollBkashOnce();
    } else if (/\/payment-(failed|cancelled|error)\b/.test(url)) {
      bkashFailed(
        /cancelled/.test(url)
          ? "The bKash payment was cancelled."
          : "The bKash payment did not go through. No money has been collected.",
      );
    }
  };

  const pollBkashOnce = async () => {
    if (!pollingTranId) return;
    try {
      const res = await api.get(
        "/api/technician/bill-collection/collect-status",
        { params: { tran_id: pollingTranId } },
      );
      if (res.data?.status === "PAID") bkashSuccess();
    } catch {
      // ignore - the interval below will retry
    }
  };

  // Polls every 3s while the bKash WebView modal is open - a genuine PAID is
  // confirmed by a payment_records row on the backend, not by the WebView's
  // URL alone.
  useEffect(() => {
    if (!pollingTranId) return;
    const interval = setInterval(pollBkashOnce, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingTranId]);

  if (isLoading || !detail) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Client Details" onBack={() => navigation.goBack()} />
        <Screen>
          <BillCollectionDetailSkeleton />
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
                  selectedSubs={selectedSubs}
                  onToggleInvoice={() => toggleInvoice(inv)}
                  onToggleSub={toggleSub}
                />
              </View>
            ))}
          </Card>
        )}

        <View style={styles.selectedRow}>
          <View style={styles.selectedBadgeRow}>
            <Text style={styles.selectedLabel}>Selected Invoices</Text>
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedSubs.size}</Text>
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
          disabled={selectedIds.size === 0 || selectedTotal <= 0}
          icon={
            method === "bKash" ? (
              <Smartphone size={16} color={colors.white} />
            ) : (
              <Banknote size={16} color={colors.white} />
            )
          }
        >
          Collect {formatTaka(selectedTotal)}
        </Button>
      </View>


      <Modal
        visible={Boolean(bkashUrl)}
        animationType="slide"
        onRequestClose={() => {
          setBkashUrl(null);
          setPollingTranId(null);
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={[styles.webviewHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.webviewTitle}>bKash Payment</Text>
            <Pressable
              onPress={() => {
                setBkashUrl(null);
                setPollingTranId(null);
              }}
              hitSlop={10}
            >
              <X size={22} color={colors.slate700} />
            </Pressable>
          </View>
          {bkashUrl && (
            <WebView
              source={{ uri: bkashUrl }}
              style={{ flex: 1 }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              setSupportMultipleWindows={false}
              startInLoadingState
              onNavigationStateChange={(navState) =>
                handleWebViewNav(navState.url)
              }
            />
          )}
        </View>
      </Modal>
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
  invoicePartial: { fontSize: 11.5, fontWeight: "500", color: "#d97706", marginTop: 2 },
  invoiceCollected: { fontSize: 11.5, fontWeight: "500", color: "#059669", marginTop: 2 },
  vehicleList: { marginLeft: 30, marginBottom: 10, gap: 6 },
  vehicleRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.white },
  vehicleRowOn: { borderColor: "#bfe0dc", backgroundColor: "#f0f9f8" },
  vehiclePending: { borderStyle: "dashed", opacity: 0.8 },
  vehicleName: { fontSize: 13, fontWeight: "600", color: colors.slate800 },
  vehicleSub: { fontSize: 11, color: colors.slate500, marginTop: 1 },
  vehicleTotal: { fontSize: 13, fontWeight: "700", color: colors.slate700 },
  vehicleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.slate400 },
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
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate200,
  },
  webviewTitle: { fontSize: 15, fontWeight: "700", color: colors.slate800 },
});
