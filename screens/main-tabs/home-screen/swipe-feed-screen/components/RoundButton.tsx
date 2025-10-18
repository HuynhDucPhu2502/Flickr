import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";

export const RoundButton: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  bg?: string;
}> = ({ children, onPress, bg = "#fff" }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.round, { backgroundColor: bg }]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  round: {
    width: 70,
    height: 70,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
