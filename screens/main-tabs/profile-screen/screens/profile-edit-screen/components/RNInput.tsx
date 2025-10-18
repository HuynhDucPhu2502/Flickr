import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export const RNInput: React.FC<
  React.ComponentProps<typeof TextInput> & { errorText?: string }
> = ({ style, errorText, ...props }) => (
  <View style={{ marginTop: 10 }}>
    <TextInput
      {...props}
      style={[styles.input, style]}
      placeholderTextColor="#9AA0B4"
    />
    {errorText ? <Text style={styles.inputError}>{errorText}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E6F0",
  },
  inputError: { marginTop: 4, color: "#e53935", fontSize: 12 },
});
