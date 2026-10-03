import { View, StyleSheet } from "react-native";
import { Card } from "./Card";
import { Skeleton } from "./Skeleton";

// Loading placeholders shaped like each screen's real content, so nothing
// jumps when data arrives - same pulsing Skeleton AssignmentCardSkeleton and
// the installation screens already use.

// Bill Collection list - one client card (avatar, name/phone/city, amount/badge).
export function ClientCardSkeleton() {
  return (
    <Card style={styles.row}>
      <Skeleton style={{ width: 44, height: 44, borderRadius: 22 }} />
      <View style={styles.body}>
        <Skeleton style={{ width: 130, height: 14 }} />
        <Skeleton style={{ width: 95, height: 12, marginTop: 6 }} />
        <Skeleton style={{ width: 70, height: 11, marginTop: 6 }} />
      </View>
      <View style={styles.right}>
        <Skeleton style={{ width: 60, height: 14 }} />
        <Skeleton style={{ width: 50, height: 11, marginTop: 6 }} />
        <Skeleton style={{ width: 62, height: 18, borderRadius: 999, marginTop: 6 }} />
      </View>
    </Card>
  );
}

// Wallet - one transaction (icon, title/description/date, amount/balance).
export function TransactionSkeleton() {
  return (
    <Card style={styles.row}>
      <Skeleton style={{ width: 36, height: 36, borderRadius: 18 }} />
      <View style={styles.body}>
        <Skeleton style={{ width: 120, height: 13 }} />
        <Skeleton style={{ width: 150, height: 11, marginTop: 6 }} />
        <Skeleton style={{ width: 90, height: 10, marginTop: 6 }} />
      </View>
      <View style={styles.right}>
        <Skeleton style={{ width: 60, height: 13 }} />
        <Skeleton style={{ width: 75, height: 10, marginTop: 6 }} />
      </View>
    </Card>
  );
}

// Wallet submit review - rows of the "Collections Included" card.
export function CollectionRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card style={{ gap: 0 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.listRow, i > 0 && styles.divider]}>
          <View style={{ flex: 1 }}>
            <Skeleton style={{ width: 130, height: 13 }} />
            <Skeleton style={{ width: 80, height: 11, marginTop: 6 }} />
          </View>
          <Skeleton style={{ width: 60, height: 14 }} />
        </View>
      ))}
    </Card>
  );
}

// Notifications - one row (icon, title/body/time).
export function NotificationSkeleton() {
  return (
    <Card style={styles.row}>
      <Skeleton style={{ width: 34, height: 34, borderRadius: 17 }} />
      <View style={styles.body}>
        <Skeleton style={{ width: 150, height: 13 }} />
        <Skeleton style={{ width: "90%", height: 11, marginTop: 6 }} />
        <Skeleton style={{ width: 70, height: 10, marginTop: 6 }} />
      </View>
    </Card>
  );
}

// Bill Collection client detail - client card, stats, invoice + vehicles,
// payment card.
export function BillCollectionDetailSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 12 }}>
        <View style={[styles.row, { padding: 0 }]}>
          <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />
          <View style={styles.body}>
            <Skeleton style={{ width: 130, height: 15 }} />
            <Skeleton style={{ width: 60, height: 16, borderRadius: 999, marginTop: 6 }} />
          </View>
          <Skeleton style={{ width: 40, height: 16 }} />
        </View>
        <Skeleton style={{ width: 120, height: 12 }} />
        <Skeleton style={{ width: 160, height: 12 }} />
        <View style={styles.stats}>
          {[0, 1].map((i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <Skeleton style={{ width: 80, height: 20 }} />
              <Skeleton style={{ width: 95, height: 11 }} />
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.sectionHead}>
        <Skeleton style={{ width: 140, height: 14 }} />
        <Skeleton style={{ width: 70, height: 14 }} />
      </View>

      <Card style={{ gap: 10 }}>
        <View style={[styles.row, { padding: 0 }]}>
          <Skeleton style={{ width: 20, height: 20 }} />
          <View style={styles.body}>
            <Skeleton style={{ width: 90, height: 14 }} />
            <Skeleton style={{ width: 80, height: 11, marginTop: 6 }} />
            <Skeleton style={{ width: 170, height: 11, marginTop: 6 }} />
          </View>
          <Skeleton style={{ width: 60, height: 14 }} />
        </View>
        {[0, 1].map((i) => (
          <View key={i} style={styles.vehicle}>
            <Skeleton style={{ width: 16, height: 16 }} />
            <View style={{ flex: 1 }}>
              <Skeleton style={{ width: 130, height: 12 }} />
              <Skeleton style={{ width: 160, height: 10, marginTop: 5 }} />
            </View>
            <Skeleton style={{ width: 50, height: 12 }} />
          </View>
        ))}
      </Card>

      <Card style={{ gap: 12 }}>
        <Skeleton style={{ width: 130, height: 15 }} />
        <Skeleton style={{ height: 44, borderRadius: 10 }} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Skeleton style={{ flex: 1, height: 46, borderRadius: 10 }} />
          <Skeleton style={{ flex: 1, height: 46, borderRadius: 10 }} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  body: { flex: 1 },
  right: { alignItems: "flex-end" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  stats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between" },
  vehicle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 30,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
});
