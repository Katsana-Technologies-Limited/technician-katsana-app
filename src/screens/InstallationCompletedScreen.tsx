import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, type RouteProp, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { InfoRow } from "@/components/InfoRow";
import { Button } from "@/components/Button";
import { useAssignmentDetail } from "@/hooks/useAssignments";
import { toDisplayAssignment, formatDateTime } from "@/lib/assignments";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

export default function InstallationCompletedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "InstallationCompleted">>();
  const { detail, isLoading } = useAssignmentDetail(route.params.id);

  const backToDashboard = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Tabs" }],
      }),
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Installation Completed" onBack={backToDashboard} showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brand700} />
        </View>
      </View>
    );
  }

  if (!detail?.assignment) {
    navigation.goBack();
    return null;
  }

  const assignment = toDisplayAssignment(detail.assignment);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Installation Completed" onBack={backToDashboard} showBell={false} />
      <Screen style={{ alignItems: "center", paddingTop: 32 }}>
        <View style={styles.iconWrap}>
          <Check size={44} color={colors.white} strokeWidth={3} />
        </View>
        <Text style={styles.title}>
          Installation Completed{"\n"}Successfully
        </Text>

        <Card style={{ width: "100%", marginTop: 8 }}>
          <InfoRow label="Subscription ID" value={assignment.subscriptionNumber} />
          <InfoRow label="Vehicle Number" value={assignment.vehicleNumber} />
          <InfoRow label="Completed At" value={formatDateTime(detail.assignment.completed_at)} />
        </Card>

        <View style={styles.footnoteBox}>
          <Text style={styles.footnote}>Customer will receive SMS/WhatsApp confirmation.</Text>
        </View>

        <View style={{ width: "100%", gap: 10, marginTop: 12 }}>
          <Button variant="outline" onPress={backToDashboard}>
            Back to Dashboard
          </Button>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.emerald500,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.slate800,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  footnoteBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  footnote: { fontSize: 12, color: colors.slate500, textAlign: "center" },
});
