import { View, Image, StyleSheet, ActivityIndicator, Text } from "react-native";
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
import ProfileScreen from "@/screens/ProfileScreen";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import { AppTabs } from "./AppTabs";
import { navigationRef } from "./navigationRef";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Matches the blue used in the Katsana Fieldforce logo/artwork in
// loading-page.png - not part of colors.ts because that palette is this
// app's own teal brand, unrelated to the marketing asset's blue.
const KATSANA_BLUE = "#2563eb";

// Assignment/installation flow screens are pushed onto this root stack
// (siblings of "Tabs", not nested inside a tab) so they cover the bottom
// tab bar entirely - the native-stack equivalent of the web app's
// `hideNav` prop on TechnicianShell.
export default function RootNavigator() {
  const { technician, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Image
          source={require("../../assets/loading-page.png")}
          style={styles.loadingBg}
          resizeMode="cover"
        />
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="small" color={KATSANA_BLUE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.white },
  loadingBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  loadingSpinner: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "12%",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { color: KATSANA_BLUE, fontSize: 13, fontWeight: "600" },
});
