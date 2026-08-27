import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

// Lets code outside the component tree (the notification-tap listener,
// which fires from a native event, not a screen render) navigate the same
// way a screen would via useNavigation(). Standard React Navigation pattern
// for "navigate without the navigation prop".
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  ...args: RootStackParamList[RouteName] extends undefined
    ? [RouteName]
    : [RouteName, RootStackParamList[RouteName]]
) {
  if (!navigationRef.isReady()) return;
  // @ts-expect-error - react-navigation's own typing for this spread form
  navigationRef.navigate(...args);
}
