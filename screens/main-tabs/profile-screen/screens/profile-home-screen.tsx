import React, { useMemo, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Text, Button, Menu, Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../../contexts/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../../../types/navigation";

const ProfileHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, profile, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleLogout = async () => {
    setMenuVisible(false);
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message ?? "Đăng xuất thất bại");
          }
        },
      },
    ]);
  };

  const avatarUrl =
    profile?.photoURL ?? user?.photoURL ?? "https://i.pravatar.cc/300?img=12";

  // ===== Kiểm tra điều kiện onboard (để hiển thị banner nhắc nhở) =====
  const { showOnboardNotice, missingLabels } = useMemo(() => {
    // Các điều kiện cơ bản để hồ sơ sẵn sàng hiển thị
    const hasMainPhoto = !!profile?.photoURL;
    const hasName = !!profile?.displayName?.trim();
    const hasGender = !!profile?.gender;
    const hasBirthday = !!profile?.birthday;

    // Danh sách mục còn thiếu (để liệt kê đẹp trên UI)
    const missing: string[] = [];
    if (!hasMainPhoto) missing.push("Main photo");
    if (!hasName) missing.push("Display name");
    if (!hasGender) missing.push("Gender");
    if (!hasBirthday) missing.push("Birthday");

    // Quyết định hiện banner khi: (1) profile đã load, và (2) chưa onboard hoặc còn thiếu mục
    const shouldShow = !!profile && (!profile.onboarded || missing.length > 0);

    return { showOnboardNotice: shouldShow, missingLabels: missing };
  }, [profile]);

  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={styles.gradient}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={{ padding: 6 }}
              >
                <Ionicons name="exit-outline" size={24} color="#fff" />
              </TouchableOpacity>
            }
          >
            <Menu.Item title="Đăng xuất" onPress={handleLogout} />
          </Menu>
        </View>

        {/* ===== Banner nhắc hoàn tất hồ sơ (chỉ hiện khi chưa onboard) ===== */}
        {showOnboardNotice ? (
          <View style={styles.noticeBox}>
            <View style={styles.noticeIcon}>
              <Ionicons name="alert" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Complete your profile</Text>
              {missingLabels.length > 0 ? (
                <Text style={styles.noticeDesc}>
                  You still need: {missingLabels.join(", ")}.
                </Text>
              ) : (
                <Text style={styles.noticeDesc}>
                  Your profile isn’t ready to be shown yet.
                </Text>
              )}
            </View>
            <Button
              mode="contained"
              compact
              onPress={() => nav.navigate("ProfileEdit")}
              style={styles.noticeBtn}
              labelStyle={{ fontWeight: "700" }}
            >
              Fix now
            </Button>
          </View>
        ) : null}

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileSection}>
            <Image
              key={avatarUrl || "fallback"} // 👈 ép remount khi URL đổi
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
            <Text style={styles.name}>
              {profile?.displayName ?? user?.displayName ?? "User Name"}
            </Text>
            <Text style={styles.email}>
              {user?.email ?? "example@gmail.com"}
            </Text>

            {/* 2 nút điều hướng */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <Button
                mode="outlined"
                textColor="#9C27B0"
                style={styles.navBtn}
                icon="pencil-outline"
                onPress={() => nav.navigate("ProfileEdit")}
              >
                Profile
              </Button>
              <Button
                mode="contained"
                buttonColor="#9C27B0"
                style={styles.navBtn}
                icon="crown-outline"
                onPress={() => nav.navigate("Subscription")}
              >
                Subscription
              </Button>
            </View>
          </View>

          {/* Verification */}
          <View style={styles.verifyBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#9C27B0"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.verifyTitle}>
                Verification adds trust and authenticity.
              </Text>
              <Text style={styles.verifyLink}>Verify your account now!</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </View>
        </Card>

        {/* Premium */}
        <Card style={styles.premiumBox}>
          <LinearGradient
            colors={["#9C27B0", "#E91E63"]}
            style={styles.premiumGradient}
          >
            <Text style={styles.premiumTitle}>Flickr Premium</Text>
            <Text style={styles.premiumSubtitle}>
              Unlock exclusive features and supercharge your dating experience.
            </Text>
            <Button
              mode="contained"
              textColor="#9C27B0"
              style={styles.upgradeBtn}
              labelStyle={{ fontWeight: "bold" }}
            >
              UPGRADE NOW
            </Button>
          </LinearGradient>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },

  // ===== Notice banner styles =====
  noticeBox: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#F1EDFF", // tím nhạt (match theme)
    borderColor: "#D6CEFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // shadow nhẹ
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noticeIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTitle: {
    color: "#2B2B3D",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 2,
  },
  noticeDesc: {
    color: "#4B4B63",
    fontSize: 13,
  },
  noticeBtn: {
    borderRadius: 999,
    backgroundColor: "#6C63FF",
  },

  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileSection: { alignItems: "center", paddingVertical: 25 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  name: { fontSize: 22, fontWeight: "700", color: "#222", marginTop: 10 },
  email: { fontSize: 14, color: "#777", marginBottom: 8 },
  navBtn: { borderRadius: 12 },

  verifyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F0FA",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 12,
  },
  verifyTitle: { color: "#333", fontWeight: "600", fontSize: 13 },
  verifyLink: { color: "#9C27B0", fontSize: 13 },

  premiumBox: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  premiumGradient: {
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  premiumTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 6,
  },
  premiumSubtitle: {
    color: "#f0faff",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 12,
  },
  upgradeBtn: { backgroundColor: "#fff", borderRadius: 20 },
});

export default ProfileHomeScreen;
