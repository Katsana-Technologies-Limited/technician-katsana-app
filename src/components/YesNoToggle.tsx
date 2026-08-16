import { View, Text, Pressable, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { colors } from "@/theme/colors";

export function YesNoToggle({
  value,
  onChange,
}: {
  value: "Yes" | "No" | "";
  onChange: (value: "Yes" | "No") => void;
}) {
  return (
    <View style={styles.row}>
      {(["Yes", "No"] as const).map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.option, active && styles.optionActive]}
          >
            <View style={[styles.circle, active && styles.circleActive]}>
              {active && <Check size={12} color={colors.white} />}
            </View>
            <Text style={[styles.text, active && styles.textActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.slate50,
  },
  optionActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand500,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.slate300,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  text: { fontSize: 14, fontWeight: "600", color: colors.slate600 },
  textActive: { color: colors.brand800 },
});
