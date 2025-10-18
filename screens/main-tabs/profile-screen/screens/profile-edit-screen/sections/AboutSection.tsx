import React from "react";
import { Text, StyleSheet } from "react-native";
import { Section } from "../components/Section";
import { RNInput } from "../components/RNInput";
import { TEXT_MUTE } from "../components/theme";

export const AboutSection: React.FC<{
  about: string;
  onChangeAbout: (t: string) => void;
}> = ({ about, onChangeAbout }) => (
  <Section>
    <Text style={styles.title}>About me</Text>
    <Text style={styles.subText}>
      Make it easy for others to get a sense of who you are.
    </Text>
    <RNInput
      placeholder="Share a few words about yourself..."
      value={about}
      onChangeText={onChangeAbout}
      multiline
      numberOfLines={5}
    />
  </Section>
);

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
  subText: { color: TEXT_MUTE, marginTop: 6 },
});
