import React from "react";
import { Text, StyleSheet } from "react-native";
import { Section } from "../components/Section";
import { RowItem } from "../components/RowItem";
import type { Panel } from "../components/types";

export const DetailsSection: React.FC<{
  name?: string;
  birthday?: string;
  occupation?: string;
  gender?: string;
  education?: string;
  location?: string;
  onOpen: (p: Panel) => void;
}> = ({ name, birthday, occupation, gender, education, location, onOpen }) => (
  <Section>
    <Text style={styles.title}>My details</Text>

    <RowItem
      icon="person-circle-outline"
      title="Name"
      value={name}
      onPress={() => onOpen("name")}
    />

    <RowItem
      icon="calendar-outline"
      title="Birthday"
      value={birthday}
      onPress={() => onOpen("birthday")}
    />

    <RowItem
      icon="briefcase-outline"
      title="Occupation"
      value={occupation}
      onPress={() => onOpen("occupation")}
    />

    <RowItem
      icon="person-outline"
      title="Gender"
      value={gender}
      onPress={() => onOpen("gender")}
    />

    <RowItem
      icon="school-outline"
      title="Education"
      value={education}
      onPress={() => onOpen("education")}
    />

    <RowItem
      icon="location-outline"
      title="Location"
      value={location}
      onPress={() => onOpen("location")}
    />
  </Section>
);

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
});
