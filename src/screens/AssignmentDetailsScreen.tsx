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
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { useAssignmentDetail } from "@/hooks/useAssignments";
import { toDisplayAssignment } from "@/lib/assignments";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STATUS_BADGE: Record<string, BadgeVariant> = {
  New: "new",
  Accepted: "accepted",
  "In Progress": "inProgress",
  Completed: "completed",
};

function DetailsSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Assignment Details" onBack={onBack} />
      <Screen>
        <View>
          <Skeleton style={{ width: 64, height: 20, borderRadius: 999 }} />
          <Skeleton style={{ width: 160, height: 22, marginTop: 10 }} />
          <Skeleton style={{ width: 100, height: 14, marginTop: 8 }} />
          <Skeleton style={{ width: 140, height: 11, marginTop: 8 }} />
        </View>
        <Card style={{ gap: 10 }}>
          <Skeleton style={{ width: 180, height: 15 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton style={{ width: 90, height: 12 }} />
              <Skeleton style={{ width: 110, height: 12 }} />
            </View>
          ))}
        </Card>
        <Card style={{ gap: 10 }}>
          <Skeleton style={{ width: 160, height: 15 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton style={{ width: 90, height: 12 }} />
              <Skeleton style={{ width: 110, height: 12 }} />
            </View>
          ))}
        </Card>
      </Screen>
    </View>
  );
}

export default function AssignmentDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AssignmentDetails">>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { detail, isLoading, refetch } = useAssignmentDetail(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  if (isLoading) {
    return <DetailsSkeleton onBack={() => navigation.goBack()} />;
  }

  if (!detail?.assignment) {
    navigation.goBack();
    return null;
  }

  const assignment = toDisplayAssignment(detail.assignment);

  const callCustomer = () => Linking.openURL(`tel:${assignment.customerMobile.replace(/\D/g, "")}`);
  const openDirections = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${assignment.customerAddress}`,
      )}`,
    );

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await api.post(`/api/technician/assignments/${id}/accept`);
      setConfirmOpen(false);
      await refetch();
      navigation.navigate("InstallationProgress", { id });
    } catch (err: any) {
      Alert.alert(err?.response?.data?.message || "Failed to accept assignment");
    } finally {
      setIsAccepting(false);
    }
  };

  const openMoreActions = () => {
    Alert.alert(assignment.assignmentNumber, undefined, [
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
          <Text style={styles.id}>{assignment.assignmentNumber}</Text>
          <Text style={styles.type}>{assignment.type}</Text>
          <Text style={styles.assignedOn}>Assigned On {assignment.assignedOn}</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Subscription Information</Text>
          <InfoRow label="Subscription No" value={assignment.subscriptionNumber} />
          <InfoRow label="Package" value={assignment.packageName} />
          <InfoRow label="Monthly Fee" value={`৳ ${assignment.monthlyFee}`} />
          <InfoRow label="Billing Start Date" value={assignment.billingStartDate} />
          <InfoRow label="Vehicle Number" value={assignment.vehicleNumber} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <InfoRow label="Name" value={assignment.customerName} />
          <InfoRow label="Mobile" value={assignment.customerMobile} />
          <InfoRow label="Address" value={assignment.customerAddress} />
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button variant="outline" onPress={callCustomer} icon={<Phone size={16} color={colors.slate700} />}>
          Call Customer
        </Button>
        {assignment.status === "New" ? (
          <Button onPress={() => setConfirmOpen(true)}>Accept Assignment</Button>
        ) : assignment.status === "In Progress" ? (
          // Already past Start Installation - go straight into the wizard,
          // which resumes at whichever step was last saved.
          <Button onPress={() => navigation.navigate("InstallationForm", { id })}>
            Continue
          </Button>
        ) : assignment.status === "Completed" ? null : (
          <Button onPress={() => navigation.navigate("InstallationProgress", { id })}>
            Continue
          </Button>
        )}
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
              <Text style={styles.dialogBold}>{assignment.assignmentNumber}</Text>
            </Text>
            <View style={{ width: "100%", gap: 8, marginTop: 18 }}>
              <Button onPress={handleAccept} disabled={isAccepting}>
                {isAccepting ? "Accepting..." : "Yes, Accept"}
              </Button>
              <Button variant="outline" onPress={() => setConfirmOpen(false)} disabled={isAccepting}>
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
  skeletonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
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
