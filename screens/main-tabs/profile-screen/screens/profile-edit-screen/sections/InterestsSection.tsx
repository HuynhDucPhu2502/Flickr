import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Section } from "../components/Section";
import { RNInput } from "../components/RNInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { Pill } from "../components/Pill";
import { TEXT_MUTE } from "../components/theme";

export const InterestsSection: React.FC<{
  interests: string[];
  newInterest: string;
  onChangeNewInterest: (t: string) => void;
  onAddInterest: () => void;
  onRemoveInterest: (it: string) => void;
}> = ({
  interests,
  newInterest,
  onChangeNewInterest,
  onAddInterest,
  onRemoveInterest,
}) => (
  <Section>
    <Text style={styles.title}>I enjoy</Text>
    <Text style={styles.subText}>
      Adding your interest is a great way to find like-minded connections.
    </Text>

    <View style={styles.chipsWrap}>
      {interests.map((it) => (
        <Pill key={it} label={it} onClose={() => onRemoveInterest(it)} />
      ))}
    </View>

    <View style={styles.inline}>
      <RNInput
        placeholder="Add an interest"
        value={newInterest}
        onChangeText={onChangeNewInterest}
        style={{ marginTop: 0, width: "100%" }}
        returnKeyType="done"
        onSubmitEditing={onAddInterest}
      />
      <PrimaryButton
        title="Add"
        onPress={onAddInterest}
        style={{ alignSelf: "flex-start" }}
      />
    </View>
  </Section>
);

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
  subText: { color: TEXT_MUTE, marginTop: 6 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  inline: {
    marginTop: 10,
    alignItems: "stretch",
    gap: 8,
  },
});
