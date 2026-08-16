import { createContext, useContext, useState, type ReactNode } from "react";
import type { TabParamList } from "@/navigation/types";

// "More" isn't one of the highlightable nav links (mirrors technician-katsana's
// web NAV_ITEMS, which also excludes the profile/logout route) - it just opens
// the drawer with nothing highlighted.
export type SidebarRoute = keyof TabParamList | "More";

interface SidebarContextValue {
  visible: boolean;
  activeRoute: SidebarRoute;
  open: (route: SidebarRoute) => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [activeRoute, setActiveRoute] = useState<SidebarRoute>("Home");

  return (
    <SidebarContext.Provider
      value={{
        visible,
        activeRoute,
        open: (route) => {
          setActiveRoute(route);
          setVisible(true);
        },
        close: () => setVisible(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
