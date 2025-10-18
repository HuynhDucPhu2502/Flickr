import React from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { Candidate } from "../../../../../services/swipe";
import { CARD_W, CARD_H } from "./constants";

export const SwipeCard: React.FC<{
  candidate: Candidate;
  elevation?: number;
  style?: any;
  onPress?: () => void; // <= thêm
}> = ({ candidate, elevation = 3, style, onPress }) => {
  const photo = candidate.photoURL || "https://i.pravatar.cc/400";
  const ageLabel =
    typeof candidate.age === "number" ? `, ${candidate.age}` : "";

  // Dùng Container có thể bấm được nếu truyền onPress
  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { elevation }, style]}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <Image source={{ uri: photo }} style={styles.cardImg} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {candidate.displayName}
          {ageLabel}
        </Text>

        {candidate.occupation?.title ? (
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
          >
            <Ionicons name="briefcase-outline" size={14} color="#EDE9FE" />
            <Text style={{ color: "#EDE9FE", marginLeft: 6 }}>
              {candidate.occupation.title}
              {candidate.occupation.company
                ? ` @ ${candidate.occupation.company}`
                : ""}
            </Text>
          </View>
        ) : null}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#ddd",
  },
  cardImg: { width: "100%", height: "100%" },
  cardInfo: { position: "absolute", left: 16, right: 16, bottom: 18 },
  cardName: { color: "#fff", fontWeight: "800", fontSize: 24 },
});
