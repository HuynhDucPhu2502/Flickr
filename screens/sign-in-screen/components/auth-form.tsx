import React from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Text, Button } from "react-native-paper";

interface AuthFormProps {
  username: string;
  email: string;
  password: string;
  isRegister: boolean;
  setUsername: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
  loading?: boolean;
}

export const AuthForm = ({
  username,
  email,
  password,
  isRegister,
  setUsername,
  setEmail,
  setPassword,
  onSubmit,
  onToggleMode,
  loading,
}: AuthFormProps) => {
  return (
    <View style={styles.form}>
      <Text style={styles.title}>{isRegister ? "Đăng ký" : "Đăng nhập"}</Text>

      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Username (không dấu, không khoảng trắng)"
          placeholderTextColor="#ddd"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          returnKeyType="next"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Tài khoản (Email)"
        placeholderTextColor="#ddd"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        returnKeyType="next"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#ddd"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <Button
        mode="contained"
        onPress={onSubmit}
        buttonColor="#6C63FF"
        textColor="#fff"
        style={styles.btn}
        labelStyle={styles.btnText}
        disabled={loading}
        loading={!!loading}
      >
        {isRegister ? "Đăng ký" : "Đăng nhập"}
      </Button>

      <Text style={styles.switchText} onPress={onToggleMode}>
        {isRegister
          ? "Đã có tài khoản? Đăng nhập ngay"
          : "Chưa có tài khoản? Đăng ký ngay"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { width: "100%", maxWidth: 360, gap: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  btn: { borderRadius: 12, height: 52, justifyContent: "center", marginTop: 4 },
  btnText: { fontSize: 16, fontWeight: "600" },
  switchText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 8,
    textDecorationLine: "underline",
  },
});
