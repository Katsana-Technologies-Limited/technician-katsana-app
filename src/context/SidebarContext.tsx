import { createContext, useContext, useState, type ReactNode } from "react";
import type { TabParamList } from "@/navigation/types";

export type SidebarRoute = keyof TabParamList;

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
