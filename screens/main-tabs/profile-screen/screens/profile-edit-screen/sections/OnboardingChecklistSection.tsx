import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Section } from "../components/Section";
import { PURPLE, TEXT_MUTE } from "../components/theme";

export type OnboardingCheck = {
  key: "mainPhoto" | "name" | "gender" | "birthday";
  label: string;
  done: boolean;
  onPress?: () => void;
};

export const OnboardingChecklistSection: React.FC<{
  checks: OnboardingCheck[];
}> = ({ checks }) => {
  const missing = checks.filter((c) => !c.done);

  return (
    <Section>
      <Text style={styles.title}>Get your profile ready</Text>
      {missing.length === 0 ? (
        <View style={styles.successBanner}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>All set!</Text>
            <Text style={styles.successDesc}>
              Your profile can be shown to others.
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.subText}>
            Complete the items below to get your profile ready to display:
          </Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {checks.map((c) => (
              <View key={c.key} style={styles.row}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name={c.done ? "checkmark-circle" : "alert-circle"}
                    size={18}
                    color={c.done ? "#2B9348" : PURPLE}
                  />
                  <Text
                    style={[
                      styles.rowText,
                      c.done && {
                        textDecorationLine: "line-through",
                        color: "#7C8A9A",
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </View>

                {!c.done && c.onPress ? (
                  <TouchableOpacity
                    style={styles.fixBtn}
                    onPress={c.onPress}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fixBtnText}>Fix</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </>
      )}
    </Section>
  );
};

const styles = StyleSheet.create({
  title: { fontWeight: "800", fontSize: 16, color: "#2B2B3D" },
  subText: { color: TEXT_MUTE, marginTop: 6 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E6F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  rowText: { color: "#2B2B3D", fontWeight: "600" },
  fixBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  fixBtnText: { color: "#fff", fontWeight: "700" },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EAF9F1",
    borderColor: "#C9F0DB",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  successIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#2B9348",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    color: "#1E7A45",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 2,
  },
  successDesc: {
    color: "#2B2B3D",
    opacity: 0.85,
    fontSize: 13,
  },
});
