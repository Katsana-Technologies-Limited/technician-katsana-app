import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, Linking, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Phone, Check, MoreVertical } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Badge, type BadgeVariant } from "@/components/Badge";
import { InfoRow } from "@/components/InfoRow";
import { Button } from "@/components/Button";
import { getAssignmentById } from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STATUS_BADGE: Record<string, BadgeVariant> = {
  New: "new",
  Accepted: "accepted",
  "In Progress": "inProgress",
  Completed: "completed",
};

export default function AssignmentDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AssignmentDetails">>();
  const insets = useSafeAreaInsets();
  const assignment = getAssignmentById(route.params.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!assignment) {
    navigation.goBack();
    return null;
  }

  const callCustomer = () => Linking.openURL(`tel:${assignment.customerMobile.replace(/-/g, "")}`);
  const openDirections = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${assignment.customerAddress}`,
      )}`,
    );

  const handleAccept = () => {
    setConfirmOpen(false);
    navigation.navigate("InstallationProgress", { id: assignment.id });
  };

  const openMoreActions = () => {
    Alert.alert(assignment.id, undefined, [
      { text: "Directions", onPress: openDirections },
      { text: "Reschedule", onPress: () => Alert.alert("Reschedule flow coming soon") },
      {
        text: "Reject Assignment",
        style: "destructive",
        onPress: () => Alert.alert("Assignment rejected"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        title="Assignment Details"
        onBack={() => navigation.goBack()}
        rightSlot={
          <Pressable hitSlop={10} onPress={openMoreActions}>
            <MoreVertical size={20} color={colors.slate600} />
          </Pressable>
        }
      />
      <Screen style={{ paddingBottom: 140 }}>
        <View>
          <Badge variant={STATUS_BADGE[assignment.status] ?? "new"}>{assignment.status}</Badge>
          <Text style={styles.id}>{assignment.id}</Text>
          <Text style={styles.type}>{assignment.type}</Text>
          <Text style={styles.assignedOn}>Assigned On {assignment.assignedOn}</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Subscription Information</Text>
          <InfoRow label="Subscription ID" value={assignment.subscriptionId} />
          <InfoRow label="Package" value={assignment.packageName} />
          <InfoRow label="Monthly Fee" value={`৳ ${assignment.monthlyFee}`} />
          <InfoRow label="Billing Start Date" value={assignment.billingStartDate} />
          <InfoRow label="No. of Vehicles" value={String(assignment.vehicleCount)} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <InfoRow label="Name" value={assignment.customerName} />
          <InfoRow label="Mobile" value={assignment.customerMobile} />
          <InfoRow label="Alternate" value={assignment.customerAlternateMobile} />
          <InfoRow label="Address" value={assignment.customerAddress} />
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button variant="outline" onPress={callCustomer} icon={<Phone size={16} color={colors.slate700} />}>
          Call Customer
        </Button>
        <Button onPress={() => setConfirmOpen(true)}>Accept Assignment</Button>
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Check size={26} color={colors.brand700} />
            </View>
            <Text style={styles.dialogTitle}>Accept this Assignment?</Text>
            <Text style={styles.dialogBody}>
              You are about to accept the installation job{"\n"}
              <Text style={styles.dialogBold}>{assignment.id}</Text>
            </Text>
            <View style={{ width: "100%", gap: 8, marginTop: 18 }}>
              <Button onPress={handleAccept}>Yes, Accept</Button>
              <Button variant="outline" onPress={() => setConfirmOpen(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  id: { fontSize: 21, fontWeight: "800", color: colors.slate800, marginTop: 8 },
  type: { fontSize: 14, color: colors.slate500, marginTop: 2 },
  assignedOn: { fontSize: 11, color: colors.slate400, marginTop: 4 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800, marginBottom: 4 },
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  dialogIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogTitle: { fontSize: 17, fontWeight: "800", color: colors.slate800, marginTop: 14 },
  dialogBody: { fontSize: 13, color: colors.slate500, textAlign: "center", marginTop: 6 },
  dialogBold: { fontWeight: "700", color: colors.slate700 },
});
