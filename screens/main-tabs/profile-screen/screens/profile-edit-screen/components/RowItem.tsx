import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PURPLE, TEXT_MUTE } from "./theme";

export const RowItem = ({
  icon,
  title,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
}) => {
  const isAdd = !value;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={PURPLE} />
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, isAdd && { color: PURPLE }]}>
          {isAdd ? "Add" : value}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#9A9AAF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowTitle: { fontWeight: "600", color: "#2B2B3D" },
  rowRight: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: { color: TEXT_MUTE },
});
