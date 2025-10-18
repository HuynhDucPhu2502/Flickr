import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Section } from "../components/Section";
import { RNInput } from "../components/RNInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { Pill } from "../components/Pill";

export const LanguagesSection: React.FC<{
  languages: string[];
  newLanguage: string;
  onChangeNewLanguage: (t: string) => void;
  onAddLanguage: () => void;
  onRemoveLanguage: (lg: string) => void;
}> = ({
  languages,
  newLanguage,
  onChangeNewLanguage,
  onAddLanguage,
  onRemoveLanguage,
}) => (
  <Section>
    <Text style={styles.title}>I communicate in</Text>

    <View style={styles.chipsWrap}>
      {languages.map((lg) => (
        <Pill key={lg} label={lg} onClose={() => onRemoveLanguage(lg)} />
      ))}
    </View>

    <View style={styles.inline}>
      <RNInput
        placeholder="Add a language"
        value={newLanguage}
        onChangeText={onChangeNewLanguage}
        style={{ marginTop: 0, width: "100%" }}
        returnKeyType="done"
        onSubmitEditing={onAddLanguage}
      />
      <PrimaryButton
        title="Add"
        onPress={onAddLanguage}
        style={{ alignSelf: "flex-start" }}
      />
    </View>
  </Section>
);

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  inline: {
    marginTop: 10,
    alignItems: "stretch",
    gap: 8,
  },
});
