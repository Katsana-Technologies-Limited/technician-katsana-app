import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

// Solid-color tile used inside the dashboard's "Task History" / "Collection
// History" cards - a bold, high-contrast callout for each section's two
// headline numbers.
export function HistoryStatTile({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.tile, { backgroundColor: color }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, borderRadius: 14, padding: 16, gap: 4 },
  value: { fontSize: 22, fontWeight: "800", color: colors.white },
  label: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
});
