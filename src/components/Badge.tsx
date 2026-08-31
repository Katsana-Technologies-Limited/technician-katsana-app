import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

export type BadgeVariant =
  | "new"
  | "accepted"
  | "inProgress"
  | "completed"
  | "rescheduled"
  | "cancelled"
  // Bill Collection's due-date badges (DueStatus, lib/billCollection.ts) -
  // overdue/dueSoon deliberately distinct from the assignment-status rose/
  // amber above even though the colors match, since they're a different
  // vocabulary shown on a different screen.
  | "overdue"
  | "dueSoon"
  | "current";

const VARIANTS: Record<BadgeVariant, { bg: string; fg: string }> = {
  new: { bg: colors.sky100, fg: colors.sky600 },
  accepted: { bg: colors.emerald100, fg: colors.emerald600 },
  inProgress: { bg: colors.amber100, fg: colors.amber600 },
  completed: { bg: colors.emerald100, fg: colors.emerald600 },
  rescheduled: { bg: colors.violet100, fg: colors.violet600 },
  cancelled: { bg: colors.rose100, fg: colors.rose600 },
  overdue: { bg: colors.rose100, fg: colors.rose600 },
  dueSoon: { bg: colors.amber100, fg: colors.amber600 },
  current: { bg: colors.emerald100, fg: colors.emerald600 },
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
}) {
  const tone = VARIANTS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.label, { color: tone.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
