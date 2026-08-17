import { useRef, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Camera, RotateCcw } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/Button";
import { WizardStepper } from "@/components/WizardStepper";
import { YesNoToggle } from "@/components/YesNoToggle";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { useAssignmentDetail } from "@/hooks/useAssignments";
import {
  installLocations,
  ignConnectionOptions,
  relayOptions,
  fuelTypes,
  batteryVoltages,
} from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STEPS = ["Device", "Configuration", "Handover"];

type YN = "Yes" | "No" | "";

export default function InstallationFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "InstallationForm">>();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { detail, isLoading } = useAssignmentDetail(id);
  const signaturePadRef = useRef<SignaturePadHandle>(null);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [device, setDevice] = useState({
    location: "",
    ignConnection: "",
    relay: "",
  });

  const [config, setConfig] = useState<{
    fuelType: string;
    batteryVoltage: string;
    accWire: YN;
    relayInstalled: YN;
    engineCutoff: YN;
    sosButton: YN;
  }>({
    fuelType: "",
    batteryVoltage: "",
    accWire: "",
    relayInstalled: "",
    engineCutoff: "",
    sosButton: "",
  });

  const [handover, setHandover] = useState({
    hasSignature: false,
    photo: null as string | null,
    remarks: "",
  });

  // Pre-fill the customer mobile once the assignment loads, same
  // sync-from-prop pattern technician-katsana (web)'s InstallationForm.tsx
  // uses - it's read-only here, never something the technician types.
  const [prefilledMobile, setPrefilledMobile] = useState<string | null>(null);
  const incomingMobile = detail?.assignment?.customer_mobile ?? null;
  if (incomingMobile && incomingMobile !== prefilledMobile) {
    setPrefilledMobile(incomingMobile);
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Installation Form" onBack={() => navigation.goBack()} />
        <Screen style={{ paddingBottom: 100 }}>
          <Card>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} style={{ flex: 1, height: 30, borderRadius: 15 }} />
              ))}
            </View>
            <View style={{ marginTop: 20, gap: 14 }}>
              <Skeleton style={{ width: 160, height: 16 }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ gap: 6 }}>
                  <Skeleton style={{ width: 120, height: 12 }} />
                  <Skeleton style={{ width: "100%", height: 44, borderRadius: 10 }} />
                </View>
              ))}
            </View>
          </Card>
        </Screen>
      </View>
    );
  }

  if (!detail?.assignment) {
    navigation.goBack();
    return null;
  }

  const vehicle = detail.vehicle;

  const goBack = () => {
    if (step === 1) {
      navigation.navigate("StartInstallation", { id });
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const goNext = async () => {
    if (step === 1) {
      if (!device.location || !device.ignConnection || !device.relay) {
        Alert.alert("Please complete all required device fields");
        return;
      }
      setIsSaving(true);
      try {
        await api.patch(`/api/technician/assignments/${id}/installation`, {
          installation_location: device.location,
          ign_connection: device.ignConnection,
          relay_installed: device.relay,
        });
      } catch (err: any) {
        Alert.alert(err?.response?.data?.message || "Failed to save");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }
    if (step === 2) {
      if (
        !config.fuelType ||
        !config.accWire ||
        !config.relayInstalled ||
        !config.engineCutoff ||
        !config.sosButton
      ) {
        Alert.alert("Please complete all required configuration fields");
        return;
      }
      setIsSaving(true);
      try {
        await api.patch(`/api/technician/assignments/${id}/installation`, {
          fuel_type: config.fuelType,
          battery_voltage: config.batteryVoltage,
          acc_wire_connected: config.accWire,
          engine_cutoff_configured: config.engineCutoff,
          sos_button_installed: config.sosButton,
        });
      } catch (err: any) {
        Alert.alert(err?.response?.data?.message || "Failed to save");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleComplete = async () => {
    const signatureData = signaturePadRef.current?.getDataUrl();
    if (!prefilledMobile?.trim() || !signatureData || !handover.photo) {
      Alert.alert("Signature and photo are required");
      return;
    }
    setIsSaving(true);
    try {
      await api.post(`/api/technician/assignments/${id}/complete`, {
        customer_mobile: prefilledMobile.trim(),
        otp_verified: true,
        signature_data: signatureData,
        customer_photo: handover.photo,
        remarks: handover.remarks.trim() || null,
      });
      navigation.navigate("InstallationCompleted", { id });
    } catch (err: any) {
      Alert.alert(err?.response?.data?.message || "Failed to complete installation");
    } finally {
      setIsSaving(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission is required to take the handover photo");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setHandover((h) => ({
        ...h,
        photo: `data:image/jpeg;base64,${asset.base64}`,
      }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Installation Form" onBack={goBack} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
      <Screen style={{ paddingBottom: 100 }}>
        <Card>
          <WizardStepper steps={STEPS} current={step} />

          <View style={{ marginTop: 20, gap: 14 }}>
            {step === 1 && (
              <>
                <Text style={styles.stepTitle}>Device &amp; SIM Details</Text>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>GPS Device IMEI</Text>
                  <Input
                    value={vehicle?.device_imei || "Not assigned"}
                    editable={false}
                    style={{ backgroundColor: colors.slate50, color: colors.slate500 }}
                  />
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>SIM ICCID</Text>
                  <Input
                    value={vehicle?.sim_iccid || "Not assigned"}
                    editable={false}
                    style={{ backgroundColor: colors.slate50, color: colors.slate500 }}
                  />
                </View>

                <SelectField
                  label="Installation Location in Vehicle"
                  required
                  placeholder="Select location"
                  options={installLocations}
                  value={device.location}
                  onChange={(v) => setDevice((d) => ({ ...d, location: v }))}
                />
                <SelectField
                  label="IGN Connection"
                  required
                  placeholder="Select"
                  options={ignConnectionOptions}
                  value={device.ignConnection}
                  onChange={(v) => setDevice((d) => ({ ...d, ignConnection: v }))}
                />
                <SelectField
                  label="Relay Installed"
                  required
                  placeholder="Select"
                  options={relayOptions}
                  value={device.relay}
                  onChange={(v) => setDevice((d) => ({ ...d, relay: v }))}
                />
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.stepTitle}>Vehicle Configuration</Text>
                <SelectField
                  label="Fuel Type"
                  required
                  placeholder="Select fuel type"
                  options={fuelTypes}
                  value={config.fuelType}
                  onChange={(v) => setConfig((c) => ({ ...c, fuelType: v }))}
                />
                <SelectField
                  label="Battery Voltage (V)"
                  placeholder="Select voltage"
                  options={batteryVoltages}
                  value={config.batteryVoltage}
                  onChange={(v) => setConfig((c) => ({ ...c, batteryVoltage: v }))}
                />

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    ACC Wire Connected <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <YesNoToggle
                    value={config.accWire}
                    onChange={(v) => setConfig((c) => ({ ...c, accWire: v }))}
                  />
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Relay Installed <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <YesNoToggle
                    value={config.relayInstalled}
                    onChange={(v) => setConfig((c) => ({ ...c, relayInstalled: v }))}
                  />
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Engine Cut-off Configured <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <YesNoToggle
                    value={config.engineCutoff}
                    onChange={(v) => setConfig((c) => ({ ...c, engineCutoff: v }))}
                  />
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    SOS Button Installed <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <YesNoToggle
                    value={config.sosButton}
                    onChange={(v) => setConfig((c) => ({ ...c, sosButton: v }))}
                  />
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.stepTitle}>Customer Confirmation</Text>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Customer Mobile Number <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <Input
                    value={prefilledMobile || ""}
                    editable={false}
                    style={{ backgroundColor: colors.slate50, color: colors.slate500 }}
                  />
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Customer Signature <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <SignaturePad
                    ref={signaturePadRef}
                    onChange={(has) => setHandover((h) => ({ ...h, hasSignature: has }))}
                  />
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Customer Photo <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  {handover.photo ? (
                    <View style={styles.photoWrap}>
                      <Image source={{ uri: handover.photo }} style={styles.photo} />
                      <Pressable
                        style={styles.retakeBtn}
                        onPress={() => setHandover((h) => ({ ...h, photo: null }))}
                      >
                        <RotateCcw size={14} color={colors.slate600} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.uploadBox} onPress={takePhoto}>
                      <Camera size={22} color={colors.slate400} />
                      <Text style={styles.uploadText}>Take Photo</Text>
                    </Pressable>
                  )}
                </View>

                <Input
                  label="Technician Remarks"
                  value={handover.remarks}
                  onChangeText={(v) => setHandover((h) => ({ ...h, remarks: v }))}
                  placeholder="Installation completed successfully."
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
              </>
            )}
          </View>
        </Card>
      </Screen>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 10 }]}>
        <Button variant="outline" onPress={goBack} style={{ flex: 1 }} disabled={isSaving}>
          Back
        </Button>
        {step < 3 ? (
          <Button onPress={goNext} style={{ flex: 1 }} disabled={isSaving}>
            {isSaving ? "Saving..." : "Next"}
          </Button>
        ) : (
          <Button onPress={handleComplete} style={{ flex: 1 }} disabled={isSaving}>
            {isSaving ? "Completing..." : "Complete Installation"}
          </Button>
        )}
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepTitle: { fontSize: 15, fontWeight: "700", color: colors.slate800 },
  hint: { fontSize: 11, color: colors.slate400, marginTop: -8 },
  label: { fontSize: 13, fontWeight: "500", color: colors.slate700 },
  photoWrap: { width: 96, height: 96 },
  photo: { width: 96, height: 96, borderRadius: 12 },
  retakeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadBox: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.slate300,
    backgroundColor: colors.slate50,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  uploadText: { fontSize: 11, color: colors.slate400 },
  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
    padding: 12,
  },
});
