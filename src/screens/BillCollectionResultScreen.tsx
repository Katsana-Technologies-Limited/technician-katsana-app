import { View, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, X } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { InfoRow } from "@/components/InfoRow";
import { Button } from "@/components/Button";
import { formatTaka } from "@/lib/billCollection";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

export default function BillCollectionResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "BillCollectionResult">>();
  const p = route.params;
  const isSuccess = p.status === "success";

  // Pops both this screen and the client-detail screen underneath, landing
  // on the Bill Collection tab (which refetches on focus).
  const backToList = () =>
    navigation.navigate("Tabs", { screen: "BillCollection" } as never);

  const tryAgain = () =>
    p.customerId != null
      ? navigation.navigate("BillCollectionClientDetail", {
          customerId: p.customerId,
        })
      : backToList();

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        title={isSuccess ? "Payment Collected" : "Payment Failed"}
        onBack={backToList}
        showBell={false}
      />
      <Screen style={{ alignItems: "center", paddingTop: 32 }}>
        <View style={[styles.iconWrap, isSuccess ? styles.iconSuccess : styles.iconError]}>
          {isSuccess ? (
            <Check size={44} color={colors.white} strokeWidth={3} />
          ) : (
            <X size={44} color={colors.white} strokeWidth={3} />
          )}
        </View>

        <Text style={styles.title}>
          {isSuccess
            ? p.method === "bKash"
              ? "Payment Received via bKash"
              : "Cash Payment Collected"
            : "Payment Could Not Be Completed"}
        </Text>

        {isSuccess ? (
          <>
            {typeof p.amount === "number" && (
              <Text style={styles.amount}>{formatTaka(p.amount)}</Text>
            )}

            <Card style={{ width: "100%", marginTop: 16 }}>
              {p.customerName ? (
                <InfoRow label="Customer" value={p.customerName} />
              ) : null}
              <InfoRow label="Payment Method" value={p.method ?? "Cash"} />
              {typeof p.invoiceCount === "number" && (
                <InfoRow
                  label="Invoices"
                  value={`${p.invoiceCount} invoice${p.invoiceCount === 1 ? "" : "s"}`}
                />
              )}
              {typeof p.amount === "number" && (
                <InfoRow label="Amount" value={formatTaka(p.amount)} />
              )}
            </Card>

            {p.message ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{p.message}</Text>
              </View>
            ) : null}

            <View style={{ width: "100%", marginTop: 16 }}>
              <Button onPress={backToList}>Done</Button>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.errorText}>
              {p.message ||
                "The payment was not completed. No money has been collected - you can try again."}
            </Text>

            <View style={{ width: "100%", gap: 10, marginTop: 20 }}>
              {p.customerId != null && (
                <Button onPress={tryAgain}>Try Again</Button>
              )}
              <Button variant="outline" onPress={backToList}>
                Back to Bill Collection
              </Button>
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSuccess: { backgroundColor: colors.emerald500 },
  iconError: { backgroundColor: colors.rose500 },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.slate800,
    textAlign: "center",
    marginTop: 16,
  },
  amount: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.emerald600,
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.slate500,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  noteBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  noteText: { fontSize: 12, color: colors.slate500, textAlign: "center" },
});
