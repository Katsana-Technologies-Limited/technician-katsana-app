import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, AlertTriangle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { getAssignmentById, installationProgressSteps } from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

export default function InstallationProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "InstallationProgress">>();
  const insets = useSafeAreaInsets();
  const assignment = getAssignmentById(route.params.id);

  if (!assignment) {
    navigation.goBack();
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Installation Progress" onBack={() => navigation.goBack()} />
      <Screen style={{ paddingBottom: 120 }}>
        <View style={styles.headerRow}>
          <Text style={styles.id}>{assignment.id}</Text>
          <Badge variant="inProgress">In Progress</Badge>
        </View>
        <Text style={styles.vehicle}>{assignment.vehicleNumber}</Text>

        <Card>
          {installationProgressSteps.map((step, idx) => {
            const isLast = idx === installationProgressSteps.length - 1;
            return (
              <View key={step.label} style={styles.stepRow}>
                <View style={styles.stepIconCol}>
                  <View
                    style={[
                      styles.dot,
                      step.state === "done" && styles.dotDone,
                      step.state === "current" && styles.dotCurrent,
                    ]}
                  >
                    {step.state === "done" ? (
                      <Check size={14} color={colors.white} />
                    ) : (
                      <View style={styles.dotInner} />
                    )}
                  </View>
                  {!isLast && (
                    <View style={[styles.line, step.state === "done" && styles.lineDone]} />
                  )}
                </View>
                <View style={styles.stepBody}>
                  <Text
                    style={[
                      styles.stepLabel,
                      step.state === "pending" && styles.stepLabelPending,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.time && <Text style={styles.stepTime}>{step.time}</Text>}
                </View>
              </View>
            );
          })}
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button onPress={() => navigation.navigate("StartInstallation", { id: assignment.id })}>
          Start Installation
        </Button>
        <Button
          variant="danger"
          onPress={() => Alert.alert("Issue reported to dispatch")}
          icon={<AlertTriangle size={16} color={colors.rose600} />}
        >
          Report an Issue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  id: { fontSize: 17, fontWeight: "800", color: colors.slate800 },
  vehicle: { fontSize: 13, color: colors.slate500 },
  stepRow: { flexDirection: "row", gap: 14 },
  stepIconCol: { alignItems: "center" },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.slate200,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.emerald500 },
  dotCurrent: { backgroundColor: colors.amber500 },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  line: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.slate200 },
  lineDone: { backgroundColor: colors.emerald500 },
  stepBody: { flex: 1, paddingBottom: 22, paddingTop: 4 },
  stepLabel: { fontSize: 14, fontWeight: "600", color: colors.slate800 },
  stepLabelPending: { color: colors.slate400, fontWeight: "500" },
  stepTime: { fontSize: 11, color: colors.slate400, marginTop: 2 },
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
