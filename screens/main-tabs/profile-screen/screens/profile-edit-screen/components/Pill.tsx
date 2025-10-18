import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const Pill: React.FC<{ label: string; onClose?: () => void }> = ({
  label,
  onClose,
}) => (
  <View style={styles.pill}>
    <Text style={{ color: "#333" }}>{label}</Text>
    {onClose ? (
      <TouchableOpacity onPress={onClose} style={{ marginLeft: 6 }}>
        <Ionicons name="close" size={14} color="#666" />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
