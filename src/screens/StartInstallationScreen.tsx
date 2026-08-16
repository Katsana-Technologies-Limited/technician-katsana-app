import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/Button";
import {
  getAssignmentById,
  vehicleTypes,
  brandModels,
  vehicleColors,
} from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const YEARS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

export default function StartInstallationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "StartInstallation">>();
  const insets = useSafeAreaInsets();
  const assignment = getAssignmentById(route.params.id);

  const [form, setForm] = useState({
    vehicleNumber: "",
    chassisNumber: "",
    engineNumber: "",
    vehicleType: "",
    brandModel: "",
    year: "",
    color: "",
  });

  if (!assignment) {
    navigation.goBack();
    return null;
  }

  const handleNext = () => {
    if (!form.vehicleNumber.trim() || !form.chassisNumber.trim() || !form.vehicleType) {
      Alert.alert("Please fill in all required fields");
      return;
    }
    navigation.navigate("InstallationForm", { id: assignment.id });
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Start Installation" onBack={() => navigation.goBack()} />
      <Screen style={{ paddingBottom: 100 }}>
        <Card style={{ gap: 16 }}>
          <View>
            <Text style={styles.cardTitle}>Enter Vehicle Information</Text>
            <Text style={styles.hint}>
              All fields marked with <Text style={{ color: colors.rose500 }}>*</Text> are required
            </Text>
          </View>

          <Input
            label="Vehicle Number"
            required
            placeholder="Example: DHAKA METRO-GA-12-3456"
            value={form.vehicleNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, vehicleNumber: v }))}
          />
          <Input
            label="Chassis Number"
            required
            placeholder="Enter chassis number"
            value={form.chassisNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, chassisNumber: v }))}
          />
          <Input
            label="Engine Number"
            placeholder="Enter engine number"
            value={form.engineNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, engineNumber: v }))}
          />
          <SelectField
            label="Vehicle Type"
            required
            placeholder="Select vehicle type"
            options={vehicleTypes}
            value={form.vehicleType}
            onChange={(v) => setForm((f) => ({ ...f, vehicleType: v }))}
          />
          <SelectField
            label="Brand / Model"
            placeholder="Select brand / model"
            options={brandModels}
            value={form.brandModel}
            onChange={(v) => setForm((f) => ({ ...f, brandModel: v }))}
          />
          <SelectField
            label="Manufacturing Year"
            placeholder="Select year"
            options={YEARS}
            value={form.year}
            onChange={(v) => setForm((f) => ({ ...f, year: v }))}
          />
          <SelectField
            label="Vehicle Color"
            placeholder="Select color"
            options={vehicleColors}
            value={form.color}
            onChange={(v) => setForm((f) => ({ ...f, color: v }))}
          />
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button onPress={handleNext}>Next</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.slate800 },
  hint: { fontSize: 11, color: colors.slate400, marginTop: 3 },
  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
    padding: 12,
  },
});
