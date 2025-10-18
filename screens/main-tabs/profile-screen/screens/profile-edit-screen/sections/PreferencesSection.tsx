import React from "react";
import { Text, StyleSheet } from "react-native";
import { Section } from "../components/Section";
import { RowItem } from "../components/RowItem";

export const PreferencesSection: React.FC<{
  preview: string;
  onOpen: () => void;
}> = ({ preview, onOpen }) => (
  <Section>
    <Text style={styles.title}>Discovery preferences</Text>
    <RowItem
      icon="options-outline"
      title="Preferences"
      value={preview}
      onPress={onOpen}
    />
  </Section>
);

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
});
