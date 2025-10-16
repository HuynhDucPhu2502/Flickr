import { Image, StyleSheet, View } from "react-native";

export const Header = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  logo: {
    width: 180,
    height: 180,
  },
});
