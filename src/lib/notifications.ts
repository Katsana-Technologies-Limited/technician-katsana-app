import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/lib/api";

// Foreground behavior: the OS notification tray/banner is suppressed while
// the app is open (shouldShowBanner: false) - the in-app NotificationBanner
// component (mockup state 1) is what shows instead, driven by the
// "received" listener in NotificationContext. Background/closed states
// (mockups 2 & 3) are handled entirely by the OS using the push payload,
// not this handler - it only runs while JS is alive in the foreground.
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// "assignment_actions" category drives the "View Task" / "Accept Task"
// quick-action buttons shown directly on the OS notification (mockup state
// 2). Registered once at app start - the category identifier is referenced
// server-side (pushNotificationService.js) per notification `type`.
export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync("assignment_actions", [
    {
      identifier: "view_task",
      buttonTitle: "View Task",
      options: { opensAppToForeground: true },
    },
    {
      identifier: "accept_task",
      buttonTitle: "Accept Task",
      options: { opensAppToForeground: true },
    },
  ]);
}

// Requests permission (no-op if already granted/denied previously - the OS
// only shows the system prompt once), gets this device's Expo push token,
// and registers it with the backend. Returns silently on a simulator/web
// (Device.isDevice is false there) or if permission is denied - the rest of
// the app must keep working either way, this is best-effort.
export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) return;

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = requested.status;
  }
  if (finalStatus !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await api.post("/api/technician/push-token", {
      token,
      platform: Platform.OS,
    });
  } catch (err) {
    // Best-effort - a technician without a registered token just won't get
    // push alerts; the in-app bell/list still works via polling on focus.
    console.warn("registerForPushNotificationsAsync failed", err);
  }
}
