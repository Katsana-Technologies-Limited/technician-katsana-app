import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardList, X } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { TOP_BAR_HEIGHT } from "@/components/TopBar";
import { useNotifications } from "@/context/NotificationContext";
import { navigate } from "@/navigation/navigationRef";

const AUTO_DISMISS_MS = 6000;

// Mounted once at the app root (App.tsx) so it can render above every
// screen. Only visible while `banner` is set in NotificationContext - shows
// for AUTO_DISMISS_MS with a shrinking progress bar (mockup state 1: "when
// app is open"), matching how NotificationContext's own showBanner() timer
// is set to the same duration.
export function NotificationBanner() {
  const { banner, dismissBanner } = useNotifications();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!banner) return;
    progress.setValue(1);
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: AUTO_DISMISS_MS,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [banner, progress]);

  if (!banner) return null;

  const time = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={[styles.wrap, { top: insets.top + TOP_BAR_HEIGHT + 8 }]} pointerEvents="box-none">
      <Pressable
        style={styles.card}
        onPress={() => {
          if (banner.assignmentId) {
            navigate("AssignmentDetails", { id: banner.assignmentId });
          }
          dismissBanner();
        }}
      >
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <ClipboardList size={18} color={colors.emerald600} />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.time}>{time}</Text>
            </View>
            {banner.body ? (
              <Text style={styles.body} numberOfLines={2}>
                {banner.body}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={dismissBanner} hitSlop={10} style={styles.closeBtn}>
            <X size={16} color={colors.slate400} />
          </Pressable>
        </View>

        {banner.assignmentId ? (
          <Pressable
            onPress={() => {
              navigate("AssignmentDetails", { id: banner.assignmentId! });
              dismissBanner();
            }}
          >
            <Text style={styles.viewDetails}>View Details</Text>
          </Pressable>
        ) : null}

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: colors.emerald100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.emerald100,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 14, fontWeight: "700", color: colors.slate800, flexShrink: 1 },
  time: { fontSize: 11, color: colors.slate400 },
  body: { fontSize: 12.5, color: colors.slate600, lineHeight: 17 },
  closeBtn: { padding: 2, marginLeft: 2 },
  viewDetails: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.emerald600,
    marginTop: 8,
    marginLeft: 42,
  },
  progressTrack: {
    marginTop: 10,
    marginHorizontal: -14,
    height: 3,
    backgroundColor: colors.slate100,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.emerald500,
  },
});
