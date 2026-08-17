import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "outline" && styles.outline,
        variant === "danger" && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.brand700 : colors.white} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              variant === "outline" && styles.textOutline,
              variant === "danger" && styles.textDanger,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  primary: {
    backgroundColor: colors.brand700,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  danger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rose100,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  textOutline: {
    color: colors.slate700,
  },
  textDanger: {
    color: colors.rose600,
  },
});
