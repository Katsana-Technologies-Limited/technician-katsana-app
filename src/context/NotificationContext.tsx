import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, getErrorMessage } from "@/lib/api";
import {
  configureNotificationHandler,
  isExpoGo,
  registerForPushNotificationsAsync,
  setupNotificationCategories,
} from "@/lib/notifications";
import { navigate } from "@/navigation/navigationRef";
import { useAuth } from "@/context/AuthContext";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: { assignmentId?: number; notificationId?: number } | null;
  read_at: string | null;
  created_at: string;
}

// The single active in-app top banner (mockup state 1) - one at a time,
// matching the mockup's single-card design. A second notification arriving
// while one is showing simply replaces it rather than queueing, since
// there's no unread badge shown ON the banner itself and the bell already
// tracks the real backlog.
interface BannerState {
  title: string;
  body: string | null;
  assignmentId?: number;
  notificationId?: number;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  banner: BannerState | null;
  dismissBanner: () => void;
  // Bell-tap dropdown (max 3 visible, scrollable) - separate from the
  // auto-appearing top banner above. Owned here (not local TopBar state) so
  // the dropdown, mounted once at the app root, can be toggled from the
  // bell icon on every screen.
  isDropdownOpen: boolean;
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { technician } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const bannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const openDropdown = useCallback(() => setIsDropdownOpen(true), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const toggleDropdown = useCallback(() => setIsDropdownOpen((v) => !v), []);

  const refetch = useCallback(async () => {
    if (!technician) return;
    setIsLoading(true);
    try {
      const res = await api.get("/api/technician/notifications");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unread_count || 0);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load notifications"));
    } finally {
      setIsLoading(false);
    }
  }, [technician]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.post(`/api/technician/notifications/${id}/read`);
    } catch {
      // Local state already updated optimistically - a failed mark-read
      // just means it'll show unread again on the next refetch, harmless.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await api.post("/api/technician/notifications/read-all");
    } catch {
      // same best-effort reasoning as markRead
    }
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    setBanner(null);
  }, []);

  const showBanner = useCallback(
    (next: BannerState) => {
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
      setBanner(next);
      bannerTimeout.current = setTimeout(() => setBanner(null), 6000);
    },
    [],
  );

  // Registration + listener setup - once per login, torn down on logout.
  useEffect(() => {
    if (!technician) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refetch();

    // Expo Go dropped remote/push notification support entirely as of SDK
    // 53 - touching any expo-notifications setup API there throws a hard,
    // uncaught error instead of degrading gracefully (see isExpoGo's own
    // comment in lib/notifications.ts). The in-app notification list above
    // still works fine either way (plain REST) - only live push delivery
    // is unavailable in Expo Go, which requires a real development build.
    if (isExpoGo()) return;

    configureNotificationHandler();
    setupNotificationCategories();
    registerForPushNotificationsAsync();

    // Only dynamically imported (never a static top-level import in this
    // file) - this whole block already only runs past the isExpoGo() return
    // above, but the `await import(...)` here is what actually keeps the
    // module's own side effects from ever loading in the first place, since
    // a static import would have evaluated (and crashed) the instant this
    // file itself loaded, regardless of any runtime check.
    let cancelled = false;
    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;

    (async () => {
      const Notifications = await import("expo-notifications");
      if (cancelled) return;

      // App is foregrounded - show the in-app banner instead of relying on
      // the OS tray (which is suppressed in this state by the handler above).
      receivedSub = Notifications.addNotificationReceivedListener((n) => {
        const content = n.request.content;
        const data = (content.data || {}) as {
          assignmentId?: number;
          notificationId?: number;
        };
        showBanner({
          title: content.title || "New notification",
          body: content.body || null,
          assignmentId: data.assignmentId,
          notificationId: data.notificationId,
        });
        setUnreadCount((prev) => prev + 1);
      });

      // Tap on the banner/OS notification, or one of its action buttons.
      responseSub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = (response.notification.request.content.data || {}) as {
            assignmentId?: number;
            notificationId?: number;
          };
          if (data.notificationId) markRead(data.notificationId);

          if (response.actionIdentifier === "accept_task" && data.assignmentId) {
            api
              .post(`/api/technician/assignments/${data.assignmentId}/accept`)
              .catch(() => {
                // Navigating to the details screen either way lets the
                // technician retry Accept there if this silently failed.
              })
              .finally(() => {
                if (data.assignmentId) {
                  navigate("AssignmentDetails", { id: data.assignmentId });
                }
              });
            return;
          }

          if (data.assignmentId) {
            navigate("AssignmentDetails", { id: data.assignmentId });
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [technician, refetch, markRead, showBanner]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        refetch,
        markRead,
        markAllRead,
        banner,
        dismissBanner,
        isDropdownOpen,
        openDropdown,
        closeDropdown,
        toggleDropdown,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
