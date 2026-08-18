import { View, ScrollView, StyleSheet, type ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

export function Screen({
  children,
  scroll = true,
  scrollEnabled = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  // Lets a child (e.g. SignaturePad) temporarily lock the outer scroll
  // while a finger is actively drawing - without this, the ScrollView
  // intercepts touch-move after the initial touch-down and only a dot
  // ever gets drawn.
  scrollEnabled?: boolean;
  style?: ViewStyle;
}) {
  if (!scroll) {
    return <View style={[styles.screen, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, style]}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
});
