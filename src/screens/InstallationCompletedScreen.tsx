import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle2 } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { InfoRow } from "@/components/InfoRow";
import { Button } from "@/components/Button";
import { getAssignmentById } from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

export default function InstallationCompletedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "InstallationCompleted">>();
  const assignment = getAssignmentById(route.params.id);

  if (!assignment) {
    navigation.goBack();
    return null;
  }

  const backToDashboard = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Tabs" }],
      }),
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Installation Completed" onBack={backToDashboard} showBell={false} />
      <Screen style={{ alignItems: "center", paddingTop: 32 }}>
        <View style={styles.iconWrap}>
          <CheckCircle2 size={44} color={colors.emerald600} />
        </View>
        <Text style={styles.title}>Installation Completed Successfully</Text>

        <Card style={{ width: "100%", marginTop: 8 }}>
          <InfoRow label="Subscription ID" value={assignment.subscriptionId} />
          <InfoRow label="Vehicle Number" value={assignment.vehicleNumber} />
          <InfoRow label="Completed At" value="20 May 2026, 11:45 AM" />
        </Card>

        <Text style={styles.footnote}>Customer will receive SMS/WhatsApp confirmation.</Text>

        <View style={{ width: "100%", gap: 10, marginTop: 12 }}>
          <Button onPress={() => Alert.alert("Report opening soon")}>View Report</Button>
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
    backgroundColor: colors.emerald100,
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
  footnote: { fontSize: 12, color: colors.slate500, marginTop: 16, marginBottom: 4 },
});
