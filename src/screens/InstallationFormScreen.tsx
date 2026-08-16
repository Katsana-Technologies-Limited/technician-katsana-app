import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ScanLine, Camera, RotateCcw, CheckCircle2 } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/Button";
import { WizardStepper } from "@/components/WizardStepper";
import { YesNoToggle } from "@/components/YesNoToggle";
import { SignaturePad } from "@/components/SignaturePad";
import { Badge } from "@/components/Badge";
import {
  getAssignmentById,
  installLocations,
  ignConnectionOptions,
  relayOptions,
  fuelTypes,
  batteryVoltages,
  testingChecklist,
} from "@/lib/mockData";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

const STEPS = ["Device", "Configuration", "Testing", "Handover"];

type YN = "Yes" | "No" | "";

export default function InstallationFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "InstallationForm">>();
  const insets = useSafeAreaInsets();
  const assignment = getAssignmentById(route.params.id);
  const [step, setStep] = useState(1);

  const [device, setDevice] = useState({
    imei: "",
    iccid: "",
    location: "",
    ignConnection: "",
    relay: "",
    apn: "Internet",
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
    mobile: assignment?.customerMobile || "",
    otp: "",
    otpSent: false,
    hasSignature: false,
    photo: null as string | null,
    remarks: "",
  });

  if (!assignment) {
    navigation.goBack();
    return null;
  }

  const goBack = () => {
    if (step === 1) {
      navigation.goBack();
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const goNext = () => {
    if (step === 1) {
      if (
        !device.imei.trim() ||
        !device.iccid.trim() ||
        !device.location ||
        !device.ignConnection ||
        !device.relay
      ) {
        Alert.alert("Please complete all required device fields");
        return;
      }
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
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const handleComplete = () => {
    if (!handover.mobile.trim() || !handover.otp.trim() || !handover.hasSignature || !handover.photo) {
      Alert.alert("Mobile, OTP, signature, and photo are all required");
      return;
    }
    navigation.navigate("InstallationCompleted", { id: assignment.id });
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
    });
    if (!result.canceled && result.assets[0]) {
      setHandover((h) => ({ ...h, photo: result.assets[0].uri }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Installation Form" onBack={goBack} />
      <Screen style={{ paddingBottom: 100 }}>
        <Card>
          <WizardStepper steps={STEPS} current={step} />

          <View style={{ marginTop: 20, gap: 14 }}>
            {step === 1 && (
              <>
                <Text style={styles.stepTitle}>Device &amp; SIM Details</Text>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Scan GPS Device IMEI <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <View style={styles.scanRow}>
                    <Input
                      placeholder="Scan or enter IMEI"
                      value={device.imei}
                      onChangeText={(v) => setDevice((d) => ({ ...d, imei: v }))}
                      style={{ flex: 1 }}
                    />
                    <Pressable
                      style={styles.scanBtn}
                      onPress={() => {
                        setDevice((d) => ({ ...d, imei: "863829054821736" }));
                      }}
                    >
                      <ScanLine size={18} color={colors.slate600} />
                    </Pressable>
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Scan SIM ICCID <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <View style={styles.scanRow}>
                    <Input
                      placeholder="Scan or enter ICCID"
                      value={device.iccid}
                      onChangeText={(v) => setDevice((d) => ({ ...d, iccid: v }))}
                      style={{ flex: 1 }}
                    />
                    <Pressable
                      style={styles.scanBtn}
                      onPress={() => {
                        setDevice((d) => ({ ...d, iccid: "8988012345678901234" }));
                      }}
                    >
                      <ScanLine size={18} color={colors.slate600} />
                    </Pressable>
                  </View>
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
                <Input
                  label="APN"
                  value={device.apn}
                  onChangeText={(v) => setDevice((d) => ({ ...d, apn: v }))}
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
                <Text style={styles.stepTitle}>Testing Checklist</Text>
                <Text style={styles.hint}>All mandatory tests must be passed</Text>
                <View style={styles.table}>
                  {testingChecklist.map((item, idx) => (
                    <View
                      key={item}
                      style={[styles.tableRow, idx === testingChecklist.length - 1 && { borderBottomWidth: 0 }]}
                    >
                      <Text style={styles.tableLabel}>{item}</Text>
                      <Badge variant="completed">
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={11} color={colors.emerald600} />
                          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.emerald600 }}>
                            Passed
                          </Text>
                        </View>
                      </Badge>
                    </View>
                  ))}
                </View>
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.stepTitle}>Customer Confirmation</Text>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Customer Mobile Number <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <View style={styles.scanRow}>
                    <Input
                      value={handover.mobile}
                      onChangeText={(v) => setHandover((h) => ({ ...h, mobile: v }))}
                      placeholder="01XXX-XXXXXX"
                      style={{ flex: 1 }}
                    />
                    <Pressable
                      style={styles.otpBtn}
                      onPress={() => setHandover((h) => ({ ...h, otpSent: true }))}
                    >
                      <Text style={styles.otpBtnText}>Send OTP</Text>
                    </Pressable>
                  </View>
                </View>

                <Input
                  label="Enter OTP"
                  required
                  value={handover.otp}
                  onChangeText={(v) => setHandover((h) => ({ ...h, otp: v }))}
                  placeholder={handover.otpSent ? "e.g. 123456" : "Send OTP first"}
                  editable={handover.otpSent}
                  keyboardType="number-pad"
                />

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>
                    Customer Signature <Text style={{ color: colors.rose500 }}>*</Text>
                  </Text>
                  <SignaturePad onChange={(has) => setHandover((h) => ({ ...h, hasSignature: has }))} />
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
        <Button variant="outline" onPress={goBack} style={{ flex: 1 }}>
          Back
        </Button>
        {step < 4 ? (
          <Button onPress={goNext} style={{ flex: 1 }}>
            Next
          </Button>
        ) : (
          <Button onPress={handleComplete} style={{ flex: 1 }}>
            Complete Installation
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepTitle: { fontSize: 15, fontWeight: "700", color: colors.slate800 },
  hint: { fontSize: 11, color: colors.slate400, marginTop: -8 },
  label: { fontSize: 13, fontWeight: "500", color: colors.slate700 },
  scanRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  scanBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate300,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  otpBtnText: { fontSize: 13, fontWeight: "600", color: colors.slate700 },
  table: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 10, overflow: "hidden" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate100,
  },
  tableLabel: { fontSize: 13, color: colors.slate700, flexShrink: 1 },
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
