import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import LoginScreen from "@/screens/LoginScreen";
import AssignmentDetailsScreen from "@/screens/AssignmentDetailsScreen";
import InstallationProgressScreen from "@/screens/InstallationProgressScreen";
import StartInstallationScreen from "@/screens/StartInstallationScreen";
import InstallationFormScreen from "@/screens/InstallationFormScreen";
import InstallationCompletedScreen from "@/screens/InstallationCompletedScreen";
import { AppTabs } from "./AppTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Assignment/installation flow screens are pushed onto this root stack
// (siblings of "Tabs", not nested inside a tab) so they cover the bottom
// tab bar entirely - the native-stack equivalent of the web app's
// `hideNav` prop on TechnicianShell.
export default function RootNavigator() {
  const { technician, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.brand700} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!technician ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={AppTabs} />
            <Stack.Screen name="AssignmentDetails" component={AssignmentDetailsScreen} />
            <Stack.Screen name="InstallationProgress" component={InstallationProgressScreen} />
            <Stack.Screen name="StartInstallation" component={StartInstallationScreen} />
            <Stack.Screen name="InstallationForm" component={InstallationFormScreen} />
            <Stack.Screen name="InstallationCompleted" component={InstallationCompletedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
