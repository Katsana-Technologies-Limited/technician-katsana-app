import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationRow } from "@/components/NotificationRow";
import { colors } from "@/theme/colors";
import { useNotifications, type AppNotification } from "@/context/NotificationContext";
import { navigate } from "@/navigation/navigationRef";

// Roughly one NotificationRow's rendered height (icon + 2-line title/body +
// timestamp, plus Card padding and the list's own gap) - three of these is
// the "max 3 at a time" visible window; a 4th+ notification just requires
// scrolling inside this same box rather than growing it further.
const ROW_HEIGHT = 92;
const VISIBLE_ROWS = 3;

// Mounted once at the app root (alongside NotificationBanner) so the bell
// icon on every screen can toggle the same instance via
// NotificationContext.isDropdownOpen, instead of each screen owning its own
// popover. Same "below the top bar, above the rest of the screen" slot the
// banner uses.
// Uses the imperative navigate() ref helper (not useNavigation()) - this
// component is mounted in App.tsx as a sibling of RootNavigator, outside
// the NavigationContainer that RootNavigator creates internally, so
// useNavigation() has no navigation tree to find and throws
// "Couldn't find a navigation object". Same reasoning as NotificationBanner.
export function NotificationDropdown() {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    isDropdownOpen,
    closeDropdown,
    markRead,
    markAllRead,
  } = useNotifications();

  if (!isDropdownOpen) return null;

  const recent = notifications.slice(0, 10); // newest-first already, per the API's ORDER BY id DESC

  const handlePress = (item: AppNotification) => {
    if (!item.read_at) markRead(item.id);
    closeDropdown();
    if (item.data?.assignmentId) {
      navigate("AssignmentDetails", { id: item.data.assignmentId });
    }
  };

  return (
    <>
      {/* Full-screen invisible backdrop - tap anywhere outside the panel to
          dismiss, standard dropdown/popover behavior. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closeDropdown} />

      <View style={[styles.wrap, { top: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead}>
              <Text style={styles.markAllLink}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {recent.length === 0 ? (
          <Text style={styles.empty}>No notifications yet.</Text>
        ) : (
          <ScrollView
            style={{ maxHeight: ROW_HEIGHT * VISIBLE_ROWS }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {recent.map((item) => (
              <NotificationRow key={item.id} item={item} onPress={() => handlePress(item)} />
            ))}
          </ScrollView>
        )}

        <Pressable
          onPress={() => {
            closeDropdown();
            navigate("Notifications");
          }}
        >
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 100,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 14, fontWeight: "700", color: colors.slate800 },
  markAllLink: { fontSize: 11.5, fontWeight: "600", color: colors.brand700 },
  list: { gap: 8 },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 20, fontSize: 12.5 },
  viewAll: {
    textAlign: "center",
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.emerald600,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
  },
});
