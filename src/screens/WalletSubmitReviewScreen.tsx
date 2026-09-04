import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Info, Upload } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { api, getErrorMessage } from "@/lib/api";
import { usePendingCollections } from "@/hooks/useWallet";
import { formatTaka } from "@/lib/billCollection";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

export default function WalletSubmitReviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { collections, totalAmount, isLoading } = usePendingCollections();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/api/technician/wallet/submit");
      navigation.replace("WalletSubmitSuccess", { submission: res.data?.submission });
    } catch (err: any) {
      Alert.alert("Submission Failed", getErrorMessage(err, "Failed to submit to Accounts"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Submit to Accounts" onBack={() => navigation.goBack()} />
      <Screen style={{ paddingBottom: 140 }}>
        <View style={styles.notice}>
          <Info size={15} color={colors.amber600} />
          <Text style={styles.noticeText}>
            Please review the collection details below. Once submitted, it will be sent to
            Accounts for verification.
          </Text>
        </View>

        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Amount to Submit</Text>
          <Text style={styles.totalAmount}>{isLoading ? "-" : formatTaka(totalAmount)}</Text>
          <Text style={styles.totalSub}>
            This amount will be submitted to Accounts for client invoice payment
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Collections Included</Text>
        {isLoading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : collections.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nothing in your wallet to submit.</Text>
          </Card>
        ) : (
          <Card style={{ gap: 0 }}>
            {collections.map((c, i) => (
              <View
                key={c.id}
                style={[styles.row, i > 0 && styles.rowDivider]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {c.customer_name}
                  </Text>
                  <Text style={styles.rowInvoice}>{c.invoice_number}</Text>
                </View>
                <Text style={styles.rowAmount}>{formatTaka(c.amount)}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={[styles.notice, styles.noticeSky]}>
          <Info size={15} color={colors.sky600} />
          <Text style={[styles.noticeText, { color: colors.sky600 }]}>
            After submitting, these collections will be sent to the Accounts team for
            verification. Your wallet balance will remain pending until Accounts confirms
            receipt.
          </Text>
        </View>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button
          onPress={handleSubmit}
          loading={submitting}
          disabled={collections.length === 0}
          icon={<Upload size={16} color={colors.white} />}
        >
          Submit {formatTaka(totalAmount)} to Accounts
        </Button>
        <Button variant="outline" onPress={() => navigation.goBack()} disabled={submitting}>
          Cancel
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.amber100,
    borderRadius: 10,
    padding: 12,
  },
  noticeSky: { backgroundColor: colors.sky100 },
  noticeText: { flex: 1, fontSize: 11.5, color: colors.amber600, lineHeight: 16 },
  totalCard: { alignItems: "center" },
  totalLabel: { fontSize: 11.5, color: colors.slate500 },
  totalAmount: { fontSize: 24, fontWeight: "800", color: colors.brand800, marginTop: 4 },
  totalSub: { fontSize: 11, color: colors.slate400, marginTop: 4, textAlign: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 24, fontSize: 13 },
  emptyCard: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: colors.slate400 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate100 },
  rowName: { fontSize: 13.5, fontWeight: "700", color: colors.slate800 },
  rowInvoice: { fontSize: 11.5, color: colors.slate400, marginTop: 1 },
  rowAmount: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
    padding: 12,
    gap: 8,
  },
});
