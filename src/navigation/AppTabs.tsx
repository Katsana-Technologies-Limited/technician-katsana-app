import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, CheckCircle2, CreditCard, Wallet, MoreHorizontal } from "lucide-react-native";
import DashboardScreen from "@/screens/DashboardScreen";
import AssignmentsScreen from "@/screens/AssignmentsScreen";
import WalletScreen from "@/screens/WalletScreen";
import BillCollectionScreen from "@/screens/BillCollectionScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import { colors } from "@/theme/colors";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  // On Android 15+ (edge-to-edge is enforced from targetSdk 35 up), content
  // draws behind the system gesture/nav bar by default - without adding
  // insets.bottom here the tab bar's icons/labels render partly underneath
  // it and become unclickable, which is what the screenshot showed.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand800,
        tabBarInactiveTintColor: colors.slate700,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          borderTopColor: colors.slate200,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
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
          tabBarLabel: "Task",
          tabBarIcon: ({ color, size }) => <CheckCircle2 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: "Wallet",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BillCollection"
        component={BillCollectionScreen}
        options={{
          tabBarLabel: "Bill Collection",
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Menu",
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
