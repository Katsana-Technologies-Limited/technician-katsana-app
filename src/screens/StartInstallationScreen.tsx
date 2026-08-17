import { useEffect, useState } from "react";
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
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

interface VehicleType {
  id: number;
  name: string;
}

export default function StartInstallationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "StartInstallation">>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  useEffect(() => {
    api
      .get("/api/technician/vehicle-types")
      .then((res) => setVehicleTypes(res.data?.vehicle_types || []))
      .catch(() => setVehicleTypes([]));
  }, []);

  const [form, setForm] = useState({
    vehicleNumber: "",
    chassisNumber: "",
    engineNumber: "",
    vehicleType: "",
  });

  const handleNext = async () => {
    if (!form.vehicleNumber.trim() || !form.chassisNumber.trim() || !form.vehicleType) {
      Alert.alert("Please fill in all required fields");
      return;
    }
    const selectedType = vehicleTypes.find((v) => v.name === form.vehicleType);
    setIsSaving(true);
    try {
      await api.post(`/api/technician/assignments/${id}/start`, {
        registration_no: form.vehicleNumber.trim(),
        chassis_no: form.chassisNumber.trim(),
        engine_no: form.engineNumber.trim() || null,
        vehicle_type_id: selectedType?.id,
      });
      navigation.navigate("InstallationForm", { id });
    } catch (err: any) {
      Alert.alert(err?.response?.data?.message || "Failed to start installation");
    } finally {
      setIsSaving(false);
    }
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
            options={vehicleTypes.map((v) => v.name)}
            value={form.vehicleType}
            onChange={(v) => setForm((f) => ({ ...f, vehicleType: v }))}
          />
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button onPress={handleNext} disabled={isSaving}>
          {isSaving ? "Saving..." : "Next"}
        </Button>
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
