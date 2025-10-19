// ./components/Header.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MAIN_TITLE = "Flickr";
const SUB_TITLE = "Where Love Begins";

type Props = { onPressOptions?: () => void };

export const Header: React.FC<Props> = ({ onPressOptions }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {/* Trái: placeholder để giữ cân bằng khi center title */}
        <View style={styles.sideBox} />

        {/* Giữa: title + subtitle căn giữa tuyệt đối */}
        <View style={styles.centerBox} pointerEvents="none">
          <Text numberOfLines={1} style={styles.title}>
            {MAIN_TITLE}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {SUB_TITLE}
          </Text>
        </View>

        {/* Phải: nút options */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onPressOptions}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HEIGHT = 58;
const SIDE = 40;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  bar: {
    height: HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  sideBox: {
    width: SIDE,
    height: SIDE,
  },
  centerBox: {
    position: "absolute",
    left: 16 + SIDE, // chừa chỗ 2 bên
    right: 16 + SIDE,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
  },
  iconBtn: {
    width: SIDE,
    height: SIDE,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    ...Platform.select({
      ios: {
        // bóng rất nhẹ cho icon để dễ bấm, vẫn giữ tối giản
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 0 },
    }),
  },
});

export default Header;
