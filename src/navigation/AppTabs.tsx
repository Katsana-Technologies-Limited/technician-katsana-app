import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ClipboardList, Package, History, MoreHorizontal } from "lucide-react-native";
import DashboardScreen from "@/screens/DashboardScreen";
import AssignmentsScreen from "@/screens/AssignmentsScreen";
import { PlaceholderScreen } from "@/screens/PlaceholderScreen";
import MoreScreen from "@/screens/MoreScreen";
import { colors } from "@/theme/colors";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList & { More: undefined }>();

function InventoryScreen() {
  return <PlaceholderScreen title="Inventory" />;
}
function HistoryScreen() {
  return <PlaceholderScreen title="History" />;
}

export function AppTabs() {
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
