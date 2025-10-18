import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PURPLE } from "./theme";

export const Stepper: React.FC<{
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}> = ({ label, value, onChange, min, max }) => (
  <View style={styles.stepper}>
    <Text style={{ fontWeight: "700", color: "#2B2B3D" }}>{label}</Text>
    <View style={styles.stepperControls}>
      <Pressable
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Ionicons name="remove" size={18} color="#fff" />
      </Pressable>
      <Text style={styles.stepNum}>{value}</Text>
      <Pressable
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Ionicons name="add" size={18} color="#fff" />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E6F0",
  },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    minWidth: 36,
    textAlign: "center",
    fontWeight: "700",
    color: "#333",
  },
});
