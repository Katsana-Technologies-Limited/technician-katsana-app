import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "@/components/Screen";
import { TopBar } from "@/components/TopBar";
import { NotificationRow } from "@/components/NotificationRow";
import { colors } from "@/theme/colors";
import { useNotifications, type AppNotification } from "@/context/NotificationContext";
import type { RootStackParamList } from "@/navigation/types";

// Full history - reached via "View All" at the bottom of the bell dropdown
// (NotificationDropdown), which only ever shows the 3 most recent.
export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { notifications, unreadCount, isLoading, refetch, markRead, markAllRead } =
    useNotifications();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handlePress = (item: AppNotification) => {
    if (!item.read_at) markRead(item.id);
    if (item.data?.assignmentId) {
      navigation.navigate("AssignmentDetails", { id: item.data.assignmentId });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Notifications" onBack={() => navigation.goBack()} />
      <Screen style={styles.content}>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllLink}>Mark all as read</Text>
          </Pressable>
        )}

        {!isLoading && notifications.length === 0 && (
          <Text style={styles.empty}>No notifications yet.</Text>
        )}

        {notifications.map((item) => (
          <NotificationRow key={item.id} item={item} onPress={() => handlePress(item)} />
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10 },
  markAllLink: {
    alignSelf: "flex-end",
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.brand700,
    marginBottom: 2,
  },
  empty: { textAlign: "center", color: colors.slate400, paddingVertical: 24, fontSize: 13 },
});
