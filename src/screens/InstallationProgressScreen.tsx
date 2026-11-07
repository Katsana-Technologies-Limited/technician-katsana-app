import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, AlertTriangle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SimRechargeModal } from "@/components/SimRechargeModal";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { useAssignmentDetail } from "@/hooks/useAssignments";
import { toDisplayAssignment, formatDateTime } from "@/lib/assignments";
import { api, getErrorMessage } from "@/lib/api";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

interface RechargeResult {
  status: "SUCCESS" | "FAILED" | "PROCESSING";
  mobile?: string;
  amount?: number;
  message?: string | null;
}

// Total wait the server applies between two recharges of one SIM (5 min +
// 15 s margin) - only for the countdown's progress bar.
const RECHARGE_GAP_SECONDS = 5 * 60 + 15;

function ProgressSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Installation Progress" onBack={onBack} />
      <Screen>
        <View style={styles.headerRow}>
          <Skeleton style={{ width: 140, height: 20 }} />
          <Skeleton style={{ width: 70, height: 20, borderRadius: 999 }} />
        </View>
        <Skeleton style={{ width: 120, height: 13 }} />
        <Card>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.stepRow}>
              <Skeleton style={{ width: 30, height: 30, borderRadius: 15 }} />
              <View style={{ flex: 1, paddingTop: 4, gap: 6 }}>
                <Skeleton style={{ width: 150, height: 14 }} />
                <Skeleton style={{ width: 90, height: 11 }} />
              </View>
            </View>
          ))}
        </Card>
      </Screen>
    </View>
  );
}

export default function InstallationProgressScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, "InstallationProgress">>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { detail, isLoading, refetch, fetchedAt } = useAssignmentDetail(id);
  const [isStarting, setIsStarting] = useState(false);
  const [activationBusy, setActivationBusy] = useState(false);
  // SIM Recharge modal: open on arrival; Close hides it (the page button
  // reopens it).
  const [modalOpen, setModalOpen] = useState(true);
  // The installation recharge succeeded while this screen was open - the
  // modal stays on its success state until Continue.
  const [startedNow, setStartedNow] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // The detail (fetchedAt) the auto Start Installation last fired for.
  const autoStartedFor = useRef<number | null>(null);

  // Start Installation (first try, sent automatically after the countdown)
  // and Retry Installation Recharge - same endpoint. The modal shows the
  // outcome from the refreshed detail.
  const handleStartInstallation = async () => {
    setIsStarting(true);
    try {
      const res = await api.post(`/api/technician/assignments/${id}/start`);
      const recharge = res.data?.recharge as RechargeResult | null | undefined;
      if (recharge?.status === "SUCCESS") setStartedNow(true);
      setModalOpen(true);
      await refetch();
    } catch (err: any) {
      // 409 = not yet (5-minute wait / activation not done): reload the
      // real state - the countdown restarts from it and the automatic
      // start fires again when it ends.
      if (err?.response?.status === 409) {
        await refetch();
        if (err.response.data?.code !== "RECHARGE_COOLDOWN") {
          Alert.alert(getErrorMessage(err, "Failed to start installation"));
        }
      } else {
        Alert.alert(getErrorMessage(err, "Failed to start installation"));
      }
    } finally {
      setIsStarting(false);
    }
  };

  const assignmentForEffects = detail?.assignment;
  const activationStatusForEffects = detail?.activationRechargeStatus;
  // Deadline for the installation recharge (provider: same number only
  // after 5 minutes): the server's seconds-remaining, counted from when
  // this detail arrived - independent of the device's clock and timezone.
  const availableInSeconds = detail?.installationRechargeAvailableInSeconds;
  const cooldownEndsAt =
    availableInSeconds == null || !fetchedAt
      ? null
      : fetchedAt + availableInSeconds * 1000;
  const cooldownEndsAtForEffects = cooldownEndsAt;
  const cooldownRemainingForEffects = cooldownEndsAtForEffects
    ? Math.max(0, cooldownEndsAtForEffects - now)
    : 0;
  const rechargePendingForEffects =
    detail?.installationRechargeStatus !== "SUCCESS";
  const activationWaitingForEffects =
    Boolean(assignmentForEffects?.accepted_at) &&
    activationStatusForEffects !== "SUCCESS";

  // Ticks while a 5-minute wait runs - before the first installation
  // recharge and before a retry (the job is In Progress then).
  useEffect(() => {
    if (!cooldownEndsAtForEffects || cooldownRemainingForEffects === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownEndsAtForEffects, cooldownRemainingForEffects]);

  useEffect(() => {
    if (
      assignmentForEffects?.status !== "In Progress" ||
      !rechargePendingForEffects
    )
      return;
    const timer = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(timer);
  }, [assignmentForEffects?.status, rechargePendingForEffects, refetch]);

  useEffect(() => {
    if (!activationWaitingForEffects) return;
    const timer = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(timer);
  }, [activationWaitingForEffects, refetch]);

  useEffect(() => {
    if (
      autoStartedFor.current !== fetchedAt &&
      !isStarting &&
      assignmentForEffects?.status !== "In Progress" &&
      activationStatusForEffects === "SUCCESS" &&
      cooldownEndsAtForEffects !== null &&
      cooldownRemainingForEffects === 0
    ) {
      autoStartedFor.current = fetchedAt;
      handleStartInstallation();
    }
  }, [
    cooldownEndsAtForEffects,
    activationStatusForEffects,
    fetchedAt,
    isStarting,
    assignmentForEffects?.status,
    cooldownRemainingForEffects,
  ]);

  if (isLoading && !detail) {
    return <ProgressSkeleton onBack={() => navigation.goBack()} />;
  }

  if (!detail?.assignment) {
    navigation.goBack();
    return null;
  }

  const raw = detail.assignment;
  const assignment = toDisplayAssignment(raw);
  const cooldownRemaining = cooldownEndsAt
    ? Math.max(0, cooldownEndsAt - now)
    : 0;
  const rechargeStatus = detail.installationRechargeStatus;
  const activationStatus = detail.activationRechargeStatus;
  const activationSucceeded = activationStatus === "SUCCESS";
  const rechargeSucceeded = rechargeStatus === "SUCCESS";

  // Real status timestamps, not a fabricated granular timeline - matches
  // technician-katsana (web)'s InstallationProgress.tsx exactly.
  const steps = [
    { label: "Assigned", time: raw.assigned_on, done: true },
    {
      label: "Technician Accepted",
      time: raw.accepted_at,
      done: Boolean(raw.accepted_at),
    },
    {
      label: "Installation Started",
      time: raw.started_at,
      done: Boolean(raw.started_at),
    },
    {
      label: "Installation Completed",
      time: raw.completed_at,
      done: Boolean(raw.completed_at),
    },
  ];
  const currentIdx = steps.findIndex((s) => !s.done);

  const minutes = Math.floor(cooldownRemaining / 60000);
  const seconds = Math.floor((cooldownRemaining % 60000) / 1000);
  const cooldownLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;

  // Retry Activation Recharge = Accept again (nothing re-sent once it
  // succeeded).
  const handleActivationRecharge = async () => {
    setActivationBusy(true);
    try {
      await api.post(`/api/technician/assignments/${id}/accept`);
      await refetch();
    } catch (err: any) {
      Alert.alert(getErrorMessage(err, "Failed to recharge the SIM"));
    } finally {
      setActivationBusy(false);
    }
  };

  const bothRecharged = activationSucceeded && rechargeSucceeded;
  const continueInstallation = () => {
    setModalOpen(false);
    navigation.navigate(startedNow ? "StartInstallation" : "InstallationForm", { id });
  };
  // Already fully recharged on arrival: no modal, just Continue.
  const modalVisible =
    modalOpen && raw.status !== "Completed" && (!bothRecharged || startedNow);

  const nextAction =
    raw.status === "Completed"
      ? null
      : bothRecharged
        ? { label: "Continue Installation", onPress: continueInstallation, disabled: false }
        : {
            label:
              activationSucceeded && cooldownRemaining > 0
                ? `SIM Recharge · ${cooldownLabel}`
                : "SIM Recharge",
            onPress: () => setModalOpen(true),
            disabled: false,
          };

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        title="Installation Progress"
        onBack={() => navigation.goBack()}
      />
      <Screen style={{ paddingBottom: 120 }}>
        <View style={styles.headerRow}>
          <Text style={styles.id}>{assignment.subscriptionNumber}</Text>
          <Badge variant="inProgress">{assignment.status}</Badge>
        </View>
        <Text style={styles.vehicle}>{assignment.vehicleNumber}</Text>

        <Card>
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const state = step.done
              ? "done"
              : idx === currentIdx
                ? "current"
                : "pending";
            return (
              <View key={step.label} style={styles.stepRow}>
                <View style={styles.stepIconCol}>
                  <View
                    style={[
                      styles.dot,
                      state === "done" && styles.dotDone,
                      state === "current" && styles.dotCurrent,
                    ]}
                  >
                    {state === "done" ? (
                      <Check size={14} color={colors.white} />
                    ) : (
                      <View style={styles.dotInner} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[styles.line, state === "done" && styles.lineDone]}
                    />
                  )}
                </View>
                <View style={styles.stepBody}>
                  <Text
                    style={[
                      styles.stepLabel,
                      state === "pending" && styles.stepLabelPending,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.time && (
                    <Text style={styles.stepTime}>
                      {formatDateTime(step.time)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      </Screen>

      {nextAction && (
        <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
          <Button onPress={nextAction.onPress} disabled={nextAction.disabled}>
            {nextAction.label}
          </Button>
          <Button
            variant="danger"
            onPress={() => Alert.alert("Issue reported to dispatch")}
            icon={<AlertTriangle size={16} color={colors.rose600} />}
          >
            Report an Issue
          </Button>
        </View>
      )}
      <SimRechargeModal
        visible={modalVisible}
        activationStatus={detail.activationRechargeStatus ?? null}
        activationMessage={detail.activationRechargeMessage}
        activationBusy={activationBusy}
        installationStatus={detail.installationRechargeStatus ?? null}
        installationMessage={detail.installationRechargeMessage}
        installationBusy={isStarting}
        waitSeconds={Math.ceil(cooldownRemaining / 1000)}
        totalWaitSeconds={RECHARGE_GAP_SECONDS}
        onRetryActivation={handleActivationRecharge}
        onRetryInstallation={handleStartInstallation}
        onContinue={continueInstallation}
        onClose={() => setModalOpen(false)}
      />
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
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
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
