import React from "react";
import { View, StyleSheet } from "react-native";
import { PURPLE_SOFT } from "./theme";

export const Section: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <View style={styles.section}>{children}</View>;

const styles = StyleSheet.create({
  section: {
    backgroundColor: PURPLE_SOFT,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
  },
});
