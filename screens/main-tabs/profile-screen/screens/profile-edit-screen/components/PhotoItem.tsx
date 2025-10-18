import React, { memo } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  uri?: string;
  label?: string;
  big?: boolean;
  onAdd: () => void;
  onDelete?: () => void;
  onMakeMain?: () => void;
};

export const PhotoItem = memo(
  ({ uri, label, big, onAdd, onDelete, onMakeMain }: Props) => {
    const size = big ? 190 : 100;

    return (
      <View style={[styles.photoBox, { width: size, height: size }]}>
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={{ width: size, height: size, borderRadius: 16 }}
            />

            <View style={styles.photoActions}>
              {!!onMakeMain && (
                <TouchableOpacity style={styles.actionBtn} onPress={onMakeMain}>
                  <Ionicons name="star" size={16} color="#FFD54F" />
                </TouchableOpacity>
              )}
              {!!onDelete && (
                <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {!!label && (
              <View style={styles.photoLabel}>
                <Text style={styles.photoLabelText}>{label}</Text>
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={styles.addBox}
            onPress={onAdd}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#6C63FF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  photoBox: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  addBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoActions: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  photoLabel: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoLabelText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

export default PhotoItem;
