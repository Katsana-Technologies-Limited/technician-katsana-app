import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { UserRound, Camera, Lock, ChevronRight } from "lucide-react-native";
import { TopBar } from "@/components/TopBar";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { useAuth } from "@/context/AuthContext";
import { api, getErrorMessage } from "@/lib/api";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { technician, refreshTechnician } = useAuth();
  const [uploading, setUploading] = useState(false);

  const changePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo library permission is required to change your profile photo");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("photo", {
      uri: asset.uri,
      name: asset.fileName || "profile.jpg",
      type: asset.mimeType || "image/jpeg",
    } as unknown as Blob);

    setUploading(true);
    try {
      await api.put("/api/technician/auth/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshTechnician();
    } catch (err: any) {
      Alert.alert(getErrorMessage(err, "Failed to update photo"));
    } finally {
      setUploading(false);
    }
  };

  const photoUri = technician?.photo ? `${API_URL}${technician.photo}` : null;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Profile" onBack={() => navigation.goBack()} />
      <Screen>
        <Card style={styles.card}>
          <Pressable onPress={changePhoto} disabled={uploading} style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserRound size={36} color={colors.brand800} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Camera size={14} color={colors.white} />
              )}
            </View>
          </Pressable>
          <Text style={styles.changePhotoText}>
            {uploading ? "Uploading..." : "Tap to change photo"}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.name}>{technician?.name ?? "Technician"}</Text>
          <Text style={styles.role}>{technician?.role ?? "Field Technician"}</Text>
          <Text style={styles.mobile}>{technician?.mobile}</Text>
        </Card>

        <Card style={{ padding: 0 }}>
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <View style={styles.rowLabel}>
              <Lock size={18} color={colors.slate500} />
              <Text style={styles.rowText}>Change Password</Text>
            </View>
            <ChevronRight size={18} color={colors.slate400} />
          </Pressable>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center" },
  avatarWrap: { alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand100,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand700,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: { fontSize: 12, color: colors.slate500, marginTop: 8 },
  divider: { width: "100%", height: 1, backgroundColor: colors.slate200, marginVertical: 14 },
  name: { fontSize: 17, fontWeight: "700", color: colors.slate800 },
  role: { fontSize: 13, color: colors.slate500, marginTop: 2 },
  mobile: { fontSize: 13, color: colors.slate400, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, fontWeight: "500", color: colors.slate700 },
});
