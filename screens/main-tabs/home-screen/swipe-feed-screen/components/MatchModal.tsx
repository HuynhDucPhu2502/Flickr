import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./Avatar";
import { GRAY_TEXT, PURPLE_DARK } from "./constants";
import type { Candidate } from "../../../../../services/swipeService";

export const MatchModal: React.FC<{
  visible: boolean;
  me?: Candidate;
  them?: Candidate;
  onClose: () => void;
  onSayHi?: () => void;
}> = ({ visible, me, them, onClose, onSayHi }) => {
  // ===== UI: tiếng Anh (comment tiếng Việt)
  const peerName = them?.displayName?.trim() || "this user";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Chạm nền mờ để đóng */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.modalBox}>
          {/* Tiêu đề */}
          <Text style={styles.title}>It’s a match! 💞</Text>

          {/* Cụm avatar (2 ảnh cạnh nhau) */}
          <View style={styles.avatarsRow}>
            <Avatar uri={me?.photoURL || undefined} />
            <Avatar uri={them?.photoURL || undefined} />
          </View>

          {/* Mô tả ngắn */}
          <Text style={styles.subtitle}>
            You and <Text style={styles.peerName}>{peerName}</Text> like each
            other. Say hello and start a conversation!
          </Text>

          {/* Nút primary: Say hi */}
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={onSayHi ?? onClose}
            activeOpacity={0.9}
          >
            <Ionicons name="send" color="#fff" size={16} />
            <Text style={styles.btnPrimaryText}>Say hi</Text>
          </TouchableOpacity>

          {/* Nút secondary: Keep swiping */}
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" color={PURPLE_DARK} size={16} />
            <Text style={styles.btnGhostText}>Keep swiping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Nền mờ
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  // Hộp modal
  modalBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    // bóng nhẹ
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  title: {
    color: PURPLE_DARK,
    fontWeight: "800",
    fontSize: 22,
    textAlign: "center",
  },

  avatarsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  subtitle: {
    color: GRAY_TEXT,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  peerName: { color: PURPLE_DARK, fontWeight: "800" },

  // Nút chung
  btn: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "stretch",
    justifyContent: "center",
  },

  // Primary button
  btnPrimary: {
    backgroundColor: PURPLE_DARK,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },

  // Ghost/secondary button
  btnGhost: {
    backgroundColor: "rgba(108, 99, 255, 0.08)",
  },
  btnGhostText: {
    color: PURPLE_DARK,
    fontWeight: "700",
  },
});

export default MatchModal;
