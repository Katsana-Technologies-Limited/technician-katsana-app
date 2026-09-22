import { View, StyleSheet } from "react-native";
import { Card } from "./Card";
import { Skeleton } from "./Skeleton";

// Same shape as AssignmentCard - icon circle, id/badge row, name, vehicle,
// meta row - so the list doesn't jump around once real data replaces it.
export function AssignmentCardSkeleton() {
  return (
    <Card style={styles.card}>
      <Skeleton style={styles.iconWrap} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Skeleton style={{ width: 90, height: 14 }} />
          <Skeleton style={{ width: 60, height: 18, borderRadius: 999 }} />
        </View>
        <Skeleton style={{ width: 130, height: 14, marginTop: 6 }} />
        <Skeleton style={{ width: 80, height: 12, marginTop: 6 }} />
        <View style={styles.metaRow}>
          <Skeleton style={{ width: 70, height: 11 }} />
          <Skeleton style={{ width: 70, height: 11 }} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: { width: 38, height: 38, borderRadius: 19 },
  body: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  metaRow: { flexDirection: "row", gap: 12, marginTop: 8 },
});
