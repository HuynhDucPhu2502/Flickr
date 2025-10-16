import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { auth } from "../../FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { AuthForm } from "./components/auth-form";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export const SignInScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async () => {
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("🎉 Đăng ký thành công!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("✅ Đăng nhập thành công!");
        navigation.replace("MainTabs");
      }
    } catch (error: any) {
      alert(
        (isRegister ? "Đăng ký" : "Đăng nhập") + " thất bại: " + error.message
      );
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
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
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.formWrapper}>
            <AuthForm
              email={email}
              password={password}
              isRegister={isRegister}
              setEmail={setEmail}
              setPassword={setPassword}
              onSubmit={handleAuth}
              onToggleMode={toggleMode}
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
  container: {
    flex: 1,
  },
  headerWrapper: {
    alignItems: "center",
    marginTop: 50,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  formWrapper: {
    width: "100%",
    maxWidth: 360,
  },
  footerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
});
