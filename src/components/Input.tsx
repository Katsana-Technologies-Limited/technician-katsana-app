import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";
import { colors } from "@/theme/colors";

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
}

export function Input({ label, required, style, ...props }: InputProps) {
  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.slate400}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.slate700,
  },
  required: { color: colors.rose500 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.slate800,
    backgroundColor: colors.white,
  },
});
