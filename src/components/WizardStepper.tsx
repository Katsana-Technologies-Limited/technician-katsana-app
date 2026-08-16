import { View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { colors } from "@/theme/colors";

export function WizardStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={styles.row}>
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const state = stepNum < current ? "done" : stepNum === current ? "current" : "pending";
        const isLast = idx === steps.length - 1;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.dotRow}>
              <View
                style={[
                  styles.dot,
                  state === "done" && styles.dotDone,
                  state === "current" && styles.dotCurrent,
                ]}
              >
                {state === "done" ? (
                  <Check size={13} color={colors.white} />
                ) : (
                  <Text style={[styles.dotLabel, state === "current" && styles.dotLabelCurrent]}>
                    {stepNum}
                  </Text>
                )}
              </View>
              {!isLast && (
                <View style={[styles.line, state === "done" && styles.lineDone]} />
              )}
            </View>
            <Text
              style={[styles.stepLabel, state !== "pending" && styles.stepLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  step: { flex: 1, alignItems: "center" },
  dotRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.slate200,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  dotDone: { backgroundColor: colors.emerald500 },
  dotCurrent: { backgroundColor: colors.brand700 },
  dotLabel: { fontSize: 12, fontWeight: "700", color: colors.slate500 },
  dotLabelCurrent: { color: colors.white },
  line: {
    position: "absolute",
    left: "50%",
    right: "-50%",
    top: 13,
    height: 2,
    backgroundColor: colors.slate200,
  },
  lineDone: { backgroundColor: colors.emerald500 },
  stepLabel: {
    marginTop: 6,
    fontSize: 11,
    color: colors.slate400,
    textAlign: "center",
  },
  stepLabelActive: { color: colors.slate700, fontWeight: "600" },
});
