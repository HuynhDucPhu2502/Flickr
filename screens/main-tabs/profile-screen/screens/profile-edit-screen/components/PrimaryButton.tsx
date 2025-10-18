import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PURPLE } from "./theme";

export const PrimaryButton: React.FC<{
  title: string;
  onPress?: () => void;
  style?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ title, onPress, style, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.btn, style]}
  >
    {icon ? (
      <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 6 }} />
    ) : null}
    <Text style={styles.btnText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
