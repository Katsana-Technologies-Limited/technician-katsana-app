import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, Info, Coins, Wallet as WalletIcon, FileCheck, Download, Upload } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useSidebar } from "@/context/SidebarContext";
import { useWalletSummary, useWalletTransactions } from "@/hooks/useWallet";
import { formatTaka } from "@/lib/billCollection";
import type { WalletTransaction } from "@/lib/wallet";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const TRANSACTION_STYLE: Record<
  WalletTransaction["type"],
  { icon: typeof Download; bg: string; fg: string; amountColor: string; sign: string }
> = {
  COLLECTION: { icon: Download, bg: colors.emerald100, fg: colors.emerald600, amountColor: colors.emerald600, sign: "+" },
  SUBMISSION: { icon: Upload, bg: colors.violet100, fg: colors.violet600, amountColor: colors.violet600, sign: "-" },
  REJECTION: { icon: Download, bg: colors.amber100, fg: colors.amber600, amountColor: colors.amber600, sign: "+" },
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function WalletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { open } = useSidebar();
  const { summary, isLoading: summaryLoading } = useWalletSummary();
  const { transactions, isLoading: txLoading } = useWalletTransactions();

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="My Wallet" onMenuPress={() => open("Wallet")} />
      <Screen>
        {/* Balance hero */}
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>Wallet Balance</Text>
            <Eye size={14} color={colors.brand100} />
          </View>
          <Text style={styles.heroBalance}>
            {summaryLoading ? "-" : formatTaka(summary.balance)}
          </Text>
          <Text style={styles.heroSub}>In your wallet</Text>

          <View style={styles.heroNotice}>
            <Info size={14} color={colors.brand50} />
            <Text style={styles.heroNoticeText}>
              You cannot withdraw money from your wallet. Submit collected amount to Accounts.
            </Text>
          </View>
        </View>

        {/* Amount to submit */}
        <Card style={styles.submitCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.submitLabel}>Amount to Submit</Text>
            <Text style={styles.submitAmount}>
              {summaryLoading ? "-" : formatTaka(summary.balance)}
            </Text>
            <Text style={styles.submitSub}>
              This amount will be submitted to Accounts for client invoice payment
            </Text>
          </View>
          <Button
            onPress={() => navigation.navigate("WalletSubmitReview")}
            disabled={summary.balance <= 0}
            icon={<Upload size={16} color={colors.white} />}
            style={styles.submitButton}
          >
            Submit
          </Button>
        </Card>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Coins size={16} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>
              {summaryLoading ? "-" : formatTaka(summary.totalCollected)}
            </Text>
            <Text style={styles.statLabel}>Total Collected</Text>
            <Text style={styles.statSub}>All time</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.amber100 }]}>
              <WalletIcon size={16} color={colors.amber600} />
            </View>
            <Text style={styles.statValue}>
              {summaryLoading ? "-" : formatTaka(summary.balance)}
            </Text>
            <Text style={styles.statLabel}>In Wallet</Text>
            <Text style={styles.statSub}>Not submitted</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.emerald100 }]}>
              <FileCheck size={16} color={colors.emerald600} />
            </View>
            <Text style={styles.statValue}>
              {summaryLoading ? "-" : formatTaka(summary.submittedThisMonth)}
            </Text>
            <Text style={styles.statLabel}>Submitted</Text>
            <Text style={styles.statSub}>This month</Text>
          </Card>
        </View>

        {/* Recent transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {txLoading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No transactions yet. Collect a payment to get started.
            </Text>
          </Card>
        ) : (
          transactions.map((tx) => {
            const style = TRANSACTION_STYLE[tx.type];
            return (
              <Card key={tx.id} style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: style.bg }]}>
                  <style.icon size={16} color={style.fg} />
                </View>
                <View style={styles.txBody}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {tx.type === "COLLECTION"
                      ? "Bill Collection"
                      : tx.type === "SUBMISSION"
                        ? "Submitted to Accounts"
                        : "Submission Returned"}
                  </Text>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={styles.txDate}>{formatDateTime(tx.created_at)}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: style.amountColor }]}>
                    {style.sign}
                    {formatTaka(Math.abs(tx.amount))}
                  </Text>
                  <Text style={styles.txBalance}>Balance: {formatTaka(tx.balance_after)}</Text>
                </View>
              </Card>
            );
          })
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brand900,
    borderRadius: 14,
    padding: 18,
  },
  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroTitle: { fontSize: 13, color: colors.brand100 },
  heroBalance: { fontSize: 28, fontWeight: "800", color: colors.white, marginTop: 4 },
  heroSub: { fontSize: 11, color: colors.brand100, marginTop: 2 },
  heroNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  heroNoticeText: { flex: 1, fontSize: 11.5, color: colors.brand50, lineHeight: 16 },
  submitCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  submitLabel: { fontSize: 11, color: colors.slate500 },
  submitAmount: { fontSize: 18, fontWeight: "800", color: colors.slate800, marginTop: 2 },
  submitSub: { fontSize: 10.5, color: colors.slate400, marginTop: 2 },
  submitButton: { paddingHorizontal: 16 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, gap: 3, padding: 12, alignItems: "center" },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 12.5, fontWeight: "800", color: colors.slate800, textAlign: "center" },
  statLabel: { fontSize: 10.5, color: colors.slate600, textAlign: "center" },
  statSub: { fontSize: 9.5, color: colors.slate400 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 24, fontSize: 13 },
  emptyCard: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: colors.slate400, textAlign: "center" },
  txCard: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  txIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  txBody: { flex: 1, gap: 2 },
  txTitle: { fontSize: 13.5, fontWeight: "700", color: colors.slate800 },
  txDesc: { fontSize: 11.5, color: colors.slate500 },
  txDate: { fontSize: 10.5, color: colors.slate400 },
  txRight: { alignItems: "flex-end", gap: 2 },
  txAmount: { fontSize: 13.5, fontWeight: "700" },
  txBalance: { fontSize: 10.5, color: colors.slate400 },
});
