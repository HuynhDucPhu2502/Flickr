import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./Avatar";
import { GRAY_TEXT, PURPLE_DARK } from "./constants";
import type { Candidate } from "../../../../../services/swipe";

export const MatchModal: React.FC<{
  visible: boolean;
  me?: Candidate;
  them?: Candidate;
  onClose: () => void;
  onSayHi?: () => void;
}> = ({ visible, me, them, onClose, onSayHi }) => {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalWrap}>
        <View style={styles.modalBox}>
          <Text style={styles.matchTitle}>💞 Match Found!</Text>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Avatar uri={me?.photoURL} />
            <Avatar uri={them?.photoURL} />
          </View>

          <Text style={{ color: GRAY_TEXT, textAlign: "center", marginTop: 8 }}>
            Hai bạn đã thích nhau! Hãy gửi lời chào đầu tiên 💬
          </Text>

          <TouchableOpacity
            style={[styles.chatBtn, { marginTop: 14 }]}
            onPress={onSayHi ?? onClose}
          >
            <Ionicons name="send" color="#fff" size={16} />
            <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>
              Say hi
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
  },
  matchTitle: { color: PURPLE_DARK, fontWeight: "800", fontSize: 22 },
  chatBtn: {
    backgroundColor: PURPLE_DARK,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
});
