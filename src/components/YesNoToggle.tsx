import { View, Text, Pressable, StyleSheet } from "react-native";
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
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate300,
    backgroundColor: colors.white,
  },
  optionActive: {
    backgroundColor: colors.brand700,
    borderColor: colors.brand700,
  },
  text: { fontSize: 14, fontWeight: "600", color: colors.slate600 },
  textActive: { color: colors.white },
});
