import { View, Text, StyleSheet } from "react-native";
import { Card } from "./Card";
import { colors } from "@/theme/colors";

export function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tone }]}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: "30%", gap: 6, padding: 14 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 20, fontWeight: "700", color: colors.slate800 },
  label: { fontSize: 11, color: colors.slate500 },
});
