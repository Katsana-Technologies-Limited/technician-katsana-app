import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate100,
  },
  label: {
    fontSize: 13,
    color: colors.slate500,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.slate800,
    flexShrink: 1,
    textAlign: "right",
  },
});
