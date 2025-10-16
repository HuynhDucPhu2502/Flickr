import { Linking, StyleSheet, Text } from "react-native";

export const Footer = () => {
  return (
    <Text style={styles.footer}>
      Khi đăng ký, bạn đồng ý với{" "}
      <Text
        style={styles.link}
        onPress={() => Linking.openURL("https://example.com/terms")}
      >
        Điều khoản sử dụng
      </Text>{" "}
      và{" "}
      <Text
        style={styles.link}
        onPress={() => Linking.openURL("https://example.com/privacy")}
      >
        Chính sách bảo mật
      </Text>
      .
    </Text>
  );
};

const styles = StyleSheet.create({
  footer: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    width: "85%",
    lineHeight: 20,
    opacity: 0.9,
  },
  link: {
    color: "#fff",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});
