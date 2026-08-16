import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ClipboardList, Package, History, MoreHorizontal } from "lucide-react-native";
import DashboardScreen from "@/screens/DashboardScreen";
import AssignmentsScreen from "@/screens/AssignmentsScreen";
import { PlaceholderScreen } from "@/screens/PlaceholderScreen";
import MoreScreen from "@/screens/MoreScreen";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { colors } from "@/theme/colors";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList & { More: undefined }>();

function InventoryScreen() {
  const { open } = useSidebar();
  return <PlaceholderScreen title="Inventory" onMenuPress={() => open("Inventory")} />;
}
function HistoryScreen() {
  const { open } = useSidebar();
  return <PlaceholderScreen title="History" onMenuPress={() => open("History")} />;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand700,
        tabBarInactiveTintColor: colors.slate400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          borderTopColor: colors.slate200,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// The hamburger button on each tab screen's TopBar opens this drawer (mirrors
// technician-katsana's mobile slide-in nav) - SidebarProvider/Sidebar live
// here, above the tab navigator, so the drawer overlays the bottom tab bar too.
export function AppTabs() {
  return (
    <SidebarProvider>
      <Tabs />
      <Sidebar />
    </SidebarProvider>
  );
}
