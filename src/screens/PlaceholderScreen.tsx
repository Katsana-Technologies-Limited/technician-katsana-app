import { View, Text, StyleSheet } from "react-native";
import { TopBar } from "@/components/TopBar";
import { colors } from "@/theme/colors";

export function PlaceholderScreen({
  title,
  onMenuPress,
}: {
  title: string;
  onMenuPress?: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title={title} onMenuPress={onMenuPress} />
      <View style={styles.center}>
        <Text style={styles.text}>{title} coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.slate50 },
  text: { color: colors.slate400, fontSize: 13 },
});
