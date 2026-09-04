import { View, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { CheckCircle2, Hash, Calendar, Clock, Send, Info } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatTaka } from "@/lib/billCollection";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STEPS = [
  "You have submitted the cash to Accounts.",
  "Accounts team will verify the cash amount.",
  "Accounts will confirm the submission.",
  "Client invoices will be marked as Paid.",
  "Your wallet balance will be updated.",
];

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

export default function WalletSubmitSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "WalletSubmitSuccess">>();
  const { submission } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Submission Successful" onBack={() => navigation.navigate("Tabs", { screen: "Wallet" } as never)} />
      <Screen>
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={32} color={colors.emerald600} />
          </View>
          <Text style={styles.successTitle}>Collection Submitted Successfully!</Text>
          <Text style={styles.successSub}>Your collection has been sent to Accounts.</Text>
        </View>

        <Card style={{ gap: 0 }}>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Send size={15} color={colors.slate400} />
              <Text style={styles.rowLabelText}>Submitted Amount</Text>
            </View>
            <Text style={styles.rowValue}>{formatTaka(submission.total_amount)}</Text>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowLabel}>
              <Hash size={15} color={colors.slate400} />
              <Text style={styles.rowLabelText}>Submission ID</Text>
            </View>
            <Text style={styles.rowValueMedium}>{submission.submission_number}</Text>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowLabel}>
              <Calendar size={15} color={colors.slate400} />
              <Text style={styles.rowLabelText}>Submitted Date &amp; Time</Text>
            </View>
            <Text style={styles.rowValueMedium}>{formatDateTime(submission.submitted_at)}</Text>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <View style={styles.rowLabel}>
              <Clock size={15} color={colors.slate400} />
              <Text style={styles.rowLabelText}>Status</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Pending Accounts Verification</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>What happens next?</Text>
        <Card>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.notice}>
          <Info size={15} color={colors.sky600} />
          <Text style={styles.noticeText}>
            You will be notified once Accounts confirms your submission.
          </Text>
        </View>

        <Button onPress={() => navigation.navigate("Tabs", { screen: "Wallet" } as never)}>Done</Button>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.emerald100,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 16, fontWeight: "800", color: colors.slate800, marginTop: 12 },
  successSub: { fontSize: 12.5, color: colors.slate500, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 9 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate100 },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabelText: { fontSize: 12.5, color: colors.slate500 },
  rowValue: { fontSize: 14, fontWeight: "800", color: colors.slate800 },
  rowValueMedium: { fontSize: 13, fontWeight: "600", color: colors.slate800 },
  statusBadge: { backgroundColor: colors.amber100, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: colors.amber600 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 5 },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: { fontSize: 10.5, fontWeight: "800", color: colors.brand800 },
  stepText: { flex: 1, fontSize: 13, color: colors.slate600, lineHeight: 18 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.sky100,
    borderRadius: 10,
    padding: 12,
  },
  noticeText: { flex: 1, fontSize: 11.5, color: colors.sky600, lineHeight: 16 },
});
