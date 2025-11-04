// screens/sign-in-screen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ToastAndroid,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { AuthForm } from "./components/auth-form";
import { useAuth } from "../../contexts/auth";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export const SignInScreen = (_: Props) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async () => {
    try {
      setSubmitting(true);
      if (isRegister) {
        const uname = username.trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,20}$/.test(uname)) {
          throw new Error("Username 3–20 ký tự, a-z 0-9 . _ -");
        }
        await register(uname, email.trim().toLowerCase(), password);
        ToastAndroid.showWithGravity(
          "Đăng ký thành công! 🎉",
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM
        );
      } else {
        await login(email.trim().toLowerCase(), password);
        ToastAndroid.showWithGravity(
          "Đăng nhập thành công! ✅",
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM
        );
      }
    } catch (e: any) {
      // Alert.alert(
      //   isRegister ? "Đăng ký thất bại" : "Đăng nhập thất bại",
      //   e?.message ?? String(e)
      // );
      console.log(
        isRegister ? "Đăng ký thất bại" : "Đăng nhập thất bại",
        ", error: ",
        e?.message ?? String(e)
      );
      ToastAndroid.showWithGravity(
        "Sai mật khẩu hoặc tên đăng nhập. Vui lòng thử lại",
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((v) => !v);
    setUsername("");
    setEmail("");
    setPassword("");
    Keyboard.dismiss();
  };

  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={styles.container}>
      <View style={styles.headerWrapper}>
        <Header />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={styles.scrollContainer}
        extraScrollHeight={60}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.formWrapper}>
            <AuthForm
              username={username}
              email={email}
              password={password}
              isRegister={isRegister}
              setUsername={setUsername}
              setEmail={setEmail}
              setPassword={setPassword}
              onSubmit={handleAuth}
              onToggleMode={toggleMode}
              loading={submitting}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      <View style={styles.footerContainer}>
        <Footer />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { alignItems: "center", marginTop: 50 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formWrapper: { width: "100%", maxWidth: 360 },
  footerContainer: { alignItems: "center", marginBottom: 40 },
});
