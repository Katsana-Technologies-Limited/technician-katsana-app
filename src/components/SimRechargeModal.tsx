import { Modal, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Check, X, Clock, Smartphone } from "lucide-react-native";
import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

// The two mandatory SIM recharges before an installation (BUSINESS_LOGIC
// §17): 1) activation ৳20 on Accept, 2) installation recharge - allowed only
// 5 minutes after the SIM's last successful recharge (the operator refuses a
// second one sooner), sent automatically when the countdown ends. Both must
// succeed before Continue; a failure shows Retry.

// (The backend never reports SKIPPED for a stage - shown like a failure.)
export type RechargeStageStatus = "SUCCESS" | "FAILED" | "PROCESSING" | "SKIPPED" | null;

interface Props {
  visible: boolean;
  activationStatus: RechargeStageStatus;
  activationMessage?: string | null;
  activationBusy: boolean;
  installationStatus: RechargeStageStatus;
  installationMessage?: string | null;
  installationBusy: boolean;
  // Seconds left before the installation recharge may be sent (0 = now).
  waitSeconds: number;
  totalWaitSeconds: number;
  onRetryActivation: () => void;
  onRetryInstallation: () => void;
  onContinue: () => void;
  onClose: () => void;
}

type RowState = "done" | "busy" | "failed" | "waiting" | "pending";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function StepIcon({ state }: { state: RowState }) {
  if (state === "busy") {
    return (
      <View style={[styles.icon, styles.iconBusy]}>
        <ActivityIndicator size="small" color={colors.brand700} />
      </View>
    );
  }
  const map = {
    done: { style: styles.iconDone, el: <Check size={18} color={colors.white} /> },
    failed: { style: styles.iconFailed, el: <X size={18} color={colors.white} /> },
    waiting: { style: styles.iconWaiting, el: <Clock size={18} color={colors.amber600} /> },
    pending: { style: styles.iconPending, el: <Text style={styles.iconNum}>2</Text> },
  } as const;
  const { style, el } = map[state];
  return <View style={[styles.icon, style]}>{el}</View>;
}

export function SimRechargeModal(p: Props) {
  const activation: RowState =
    p.activationBusy || p.activationStatus === "PROCESSING"
      ? "busy"
      : p.activationStatus === "SUCCESS"
        ? "done"
        : "failed";
  const installation: RowState =
    p.activationStatus !== "SUCCESS"
      ? "pending"
      : p.installationStatus === "SUCCESS"
        ? "done"
        : p.installationBusy || p.installationStatus === "PROCESSING"
          ? "busy"
          : p.waitSeconds > 0
            ? "waiting"
            : p.installationStatus === "FAILED"
              ? "failed"
              : "busy"; // countdown over - being sent automatically
  const allDone = activation === "done" && installation === "done";
  const progress = p.totalWaitSeconds
    ? Math.min(1, Math.max(0, 1 - p.waitSeconds / p.totalWaitSeconds))
    : 1;

  return (
    <Modal visible={p.visible} transparent animationType="fade" onRequestClose={p.onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.headIcon}>
            <Smartphone size={24} color={colors.brand700} />
          </View>
          <Text style={styles.title}>SIM Recharge</Text>
          <Text style={styles.subtitle}>
            Both recharges must succeed before the installation can start.
          </Text>

          {/* 1. Activation */}
          <View style={styles.row}>
            <StepIcon state={activation} />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Activation recharge · ৳20</Text>
              <Text style={[styles.rowText, activation === "failed" && styles.textFailed]}>
                {activation === "busy"
                  ? "Recharging the SIM..."
                  : activation === "done"
                    ? "Successful"
                    : p.activationMessage || "Recharge failed. Please retry."}
              </Text>
              {activation === "failed" && (
                <Button style={styles.rowButton} onPress={p.onRetryActivation}>
                  Retry Activation Recharge
                </Button>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* 2. Installation */}
          <View style={styles.row}>
            <StepIcon state={installation} />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, installation === "pending" && styles.textMuted]}>
                Installation recharge
              </Text>
              {installation === "pending" && (
                <Text style={[styles.rowText, styles.textMuted]}>Starts after the activation recharge</Text>
              )}
              {installation === "waiting" && (
                <>
                  <Text style={styles.countdown}>{mmss(p.waitSeconds)}</Text>
                  <View style={styles.track}>
                    <View style={[styles.bar, { width: `${progress * 100}%` }]} />
                  </View>
                  <Text style={styles.rowText}>
                    The operator allows the next recharge on this SIM after 5 minutes. It will be sent
                    automatically.
                  </Text>
                </>
              )}
              {installation === "busy" && <Text style={styles.rowText}>Recharging the SIM...</Text>}
              {installation === "done" && <Text style={styles.rowText}>Successful</Text>}
              {installation === "failed" && (
                <>
                  <Text style={[styles.rowText, styles.textFailed]}>
                    {p.installationMessage || "Recharge failed. Please retry."}
                  </Text>
                  <Button style={styles.rowButton} onPress={p.onRetryInstallation}>
                    Retry Installation Recharge
                  </Button>
                </>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            {allDone ? (
              <Button onPress={p.onContinue}>Continue to Installation</Button>
            ) : (
              <Button variant="outline" onPress={p.onClose}>
                Close
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  dialog: { width: "100%", backgroundColor: colors.white, borderRadius: 16, padding: 20 },
  headIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: { fontSize: 17, fontWeight: "800", color: colors.slate800, textAlign: "center", marginTop: 12 },
  subtitle: { fontSize: 13, color: colors.slate500, textAlign: "center", marginTop: 4, marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  rowBody: { flex: 1, paddingTop: 4 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  rowText: { fontSize: 12, color: colors.slate500, marginTop: 3, lineHeight: 17 },
  rowButton: { marginTop: 10 },
  textFailed: { color: colors.rose600 },
  textMuted: { color: colors.slate400 },
  divider: { height: 1, backgroundColor: colors.slate100, marginVertical: 14 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  iconBusy: { backgroundColor: colors.brand100 },
  iconDone: { backgroundColor: colors.emerald500 },
  iconFailed: { backgroundColor: colors.rose500 },
  iconWaiting: { backgroundColor: colors.amber100 },
  iconPending: { backgroundColor: colors.slate200 },
  iconNum: { fontSize: 13, fontWeight: "700", color: colors.slate500 },
  countdown: { fontSize: 28, fontWeight: "800", color: colors.amber600, marginTop: 4, fontVariant: ["tabular-nums"] },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.slate100, marginTop: 6, overflow: "hidden" },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.amber500 },
  footer: { marginTop: 20 },
});
