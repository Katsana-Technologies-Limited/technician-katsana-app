import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardList, X } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { TOP_BAR_HEIGHT } from "@/components/TopBar";
import { useNotifications } from "@/context/NotificationContext";
import { navigate } from "@/navigation/navigationRef";

const AUTO_DISMISS_MS = 6000;
const ENTER_MS = 220;
const EXIT_MS = 180;

// Mounted once at the app root (App.tsx) so it can render above every
// screen. NotificationContext holds a FIFO queue of incoming toasts (one per
// push received while the app is foregrounded, mockup state 1) - this
// component owns all of the actual timing/animation for whichever toast is
// at the head of that queue: it slides/fades in from the top, counts down
// with a shrinking progress bar, then slides/fades out before calling
// dismissBanner() to pop the queue and reveal the next one (react-toastify's
// "one at a time" behavior). `rendered` intentionally lags behind `banner`
// on the way to null/next so the exit animation has something to animate.
export function NotificationBanner() {
  const { banner, dismissBanner } = useNotifications();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exiting = useRef(false);

  const [rendered, setRendered] = useState(banner);

  const runExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -24, duration: EXIT_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: EXIT_MS, useNativeDriver: true }),
    ]).start(() => {
      setRendered(null);
      dismissBanner();
    });
  };

  useEffect(() => {
    if (!banner) return;
    exiting.current = false;
    setRendered(banner);
    translateY.setValue(-24);
    opacity.setValue(0);
    progress.setValue(1);

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: ENTER_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: ENTER_MS, useNativeDriver: true }),
    ]).start();

    const progressAnim = Animated.timing(progress, {
      toValue: 0,
      duration: AUTO_DISMISS_MS,
      useNativeDriver: false,
    });
    progressAnim.start();
    autoTimer.current = setTimeout(runExit, AUTO_DISMISS_MS);

    return () => {
      progressAnim.stop();
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner?.id]);

  if (!rendered) return null;

  const time = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={[styles.wrap, { top: insets.top + TOP_BAR_HEIGHT + 6.5 }]} pointerEvents="box-none">
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable
          style={styles.card}
          onPress={() => {
            if (rendered.assignmentId) {
              navigate("AssignmentDetails", { id: rendered.assignmentId });
            }
            runExit();
          }}
        >
          <View style={styles.row}>
            <View style={styles.iconBadge}>
              <ClipboardList size={18} color={colors.emerald600} />
            </View>
            <View style={styles.textCol}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {rendered.title}
                </Text>
                <Text style={styles.time}>{time}</Text>
              </View>
              {rendered.body ? (
                <Text style={styles.body} numberOfLines={2}>
                  {rendered.body}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={runExit} hitSlop={10} style={styles.closeBtn}>
              <X size={16} color={colors.slate400} />
            </Pressable>
          </View>

          {rendered.assignmentId ? (
            <Pressable
              onPress={() => {
                navigate("AssignmentDetails", { id: rendered.assignmentId! });
                runExit();
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
      </Animated.View>
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
    borderRadius: 10,
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
