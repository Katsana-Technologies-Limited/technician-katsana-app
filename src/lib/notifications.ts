import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/lib/api";

// As of SDK 53, Expo Go dropped remote/push notification support entirely -
// and critically, the crash isn't from calling a specific function: just
// evaluating `expo-notifications`' module (a plain `import ... from` at the
// top of a file) runs an internal side effect (its own push-token-listener
// auto-registration) that throws immediately in Expo Go, before any
// isExpoGo() check inside a function body would ever get a chance to run.
// So this file deliberately has NO static `import * as Notifications from
// "expo-notifications"` at all - every function below does a gated dynamic
// `await import(...)`, checking isExpoGo() FIRST, so the module is never
// loaded (let alone its side effects run) under Expo Go. `appOwnership` is
// deprecated in favor of `executionEnvironment`, but it's kept here
// specifically because it's the only signal that distinguishes true Expo Go
// from a custom expo-dev-client build (which DOES support push) -
// `executionEnvironment` alone can't tell the two apart (both report
// `StoreClient`).
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

// Foreground behavior: the OS notification tray/banner is suppressed while
// the app is open (shouldShowBanner: false) - the in-app NotificationBanner
// component (mockup state 1) is what shows instead, driven by the
// "received" listener in NotificationContext. Background/closed states
// (mockups 2 & 3) are handled entirely by the OS using the push payload,
// not this handler - it only runs while JS is alive in the foreground.
export async function configureNotificationHandler() {
  if (isExpoGo()) return;
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });

  // Android requires an explicit channel for sound to reliably play on
  // notifications posted while shouldShowBanner is false - "default" is the
  // channel Expo's push service posts to when a message (like the ones sent
  // from pushNotificationService.js) doesn't specify a channelId of its own.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Assignment notifications",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

// "assignment_actions" category drives the "View Task" / "Accept Task"
// quick-action buttons shown directly on the OS notification (mockup state
// 2). Registered once at app start - the category identifier is referenced
// server-side (pushNotificationService.js) per notification `type`.
export async function setupNotificationCategories() {
  if (isExpoGo()) return;
  const Notifications = await import("expo-notifications");
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
  if (isExpoGo()) return;
  if (!Device.isDevice) return;

  const Notifications = await import("expo-notifications");

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
