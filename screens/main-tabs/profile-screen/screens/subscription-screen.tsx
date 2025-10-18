import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton, Text, Card, Button, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const FEATURES: Array<{ label: string; free: boolean; premium: boolean }> = [
  { label: "Unlimited swipes", free: true, premium: true },
  { label: "Advanced filters", free: true, premium: true },
  { label: "Remove ads", free: false, premium: true },
  { label: "Undo accidental left swipes", free: false, premium: true },
  { label: "Boost profile visibility", free: false, premium: true },
];

export const SubscriptionScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();

  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          onPress={() => nav.goBack()}
        />
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        {/* Premium pitch */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Flickr Premium
            </Text>
            <Text style={styles.cardSubtitle}>
              Unlock exclusive features and supercharge your dating experience.
            </Text>

            <Divider style={{ marginVertical: 16 }} />

            {/* quick highlights */}
            {["No ads", "Advanced filters", "Profile boost"].map((f, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={{ marginLeft: 8 }}>{f}</Text>
              </View>
            ))}

            <Button
              mode="contained"
              style={{ marginTop: 16 }}
              onPress={() => {
                // TODO: start purchase flow
              }}
            >
              Upgrade $7.99 / month
            </Button>
          </Card.Content>
        </Card>

        {/* Benefits comparison table */}
        <Card style={[styles.card, { marginTop: 16 }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              What you get
            </Text>

            {/* table header */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.leftCell, styles.headerText]}>
                Benefit
              </Text>
              <Text style={[styles.cell, styles.headerText]}>Free</Text>
              <Text style={[styles.cell, styles.headerText]}>Premium</Text>
            </View>
            <Divider />

            {/* rows */}
            {FEATURES.map((f, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={[styles.cell, styles.leftCell]}>{f.label}</Text>
                <View style={styles.cellCenter}>
                  {f.free ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                  ) : (
                    <Text style={styles.dash}>—</Text>
                  )}
                </View>
                <View style={styles.cellCenter}>
                  {f.premium ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                  ) : (
                    <Text style={styles.dash}>—</Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 2,
  },

  body: { flex: 1, padding: 16 },

  card: { borderRadius: 16, overflow: "hidden" },
  cardTitle: { fontWeight: "700" },
  cardSubtitle: { marginTop: 6, color: "#666" },

  bulletRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },

  // table
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerRow: { paddingTop: 4, paddingBottom: 8 },
  cell: { flex: 1, textAlign: "center" },
  leftCell: { flex: 1.6, textAlign: "left" },
  cellCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerText: { fontWeight: "700", color: "#555" },
  dash: { color: "#bbb", fontSize: 16 },
});
