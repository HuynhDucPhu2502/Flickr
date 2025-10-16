import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  Divider,
  Menu,
  IconButton,
  Card,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../../../types/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../types/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../../FirebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

type Props = BottomTabScreenProps<TabParamList, "Profile">;

export const ProfileScreen = ({}: Props) => {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const user = auth.currentUser;

  const handleLogout = async () => {
    setMenuVisible(false);

    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace("SignIn");
            } catch (e: any) {
              Alert.alert("Lỗi", e?.message ?? "Đăng xuất thất bại");
            }
          },
        },
      ]
    );
  };
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

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: user?.photoURL ?? "https://i.pravatar.cc/300?img=12",
              }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{user?.displayName ?? "User Name"}</Text>
            <Text style={styles.email}>
              {user?.email ?? "example@gmail.com"}
            </Text>

            <Button
              mode="outlined"
              textColor="#9C27B0"
              style={styles.editBtn}
              icon="pencil-outline"
            >
              Edit your profile
            </Button>
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

        {/* Premium Section (Gradient tím → hồng) */}
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
              Upgrade from $7.99
            </Button>
          </LinearGradient>
        </Card>

        {/* Compare Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.cellLeft, styles.headerText]}>
              What's included
            </Text>
            <Text style={[styles.cell, styles.headerText]}>Free</Text>
            <Text style={[styles.cell, styles.headerText]}>Premium</Text>
          </View>
          <Divider />

          {[
            "Unlimited swipes",
            "Advanced filters",
            "Remove ads",
            "Undo accidental left swipes",
            "Push your profile to more viewers",
          ].map((feature, index) => (
            <View key={index} style={styles.tableRow}>
              {/* Feature name */}
              <Text style={[styles.cell, styles.cellLeft, styles.featureText]}>
                {feature}
              </Text>

              {/* Free column */}
              <View style={styles.iconWrapper}>
                {index < 2 ? (
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                ) : (
                  <Text style={{ color: "#ccc", fontSize: 16 }}>—</Text>
                )}
              </View>

              {/* Premium column */}
              <View style={styles.iconWrapper}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
              </View>
            </View>
          ))}
        </View>
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
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 25,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: "#777",
    marginBottom: 8,
  },
  editBtn: {
    borderColor: "#9C27B0",
    marginTop: 6,
  },
  verifyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F0FA",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 12,
  },
  verifyTitle: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
  },
  verifyLink: {
    color: "#9C27B0",
    fontSize: 13,
  },
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
  upgradeBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  table: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 25,
    marginHorizontal: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
  cellLeft: {
    flex: 1.5,
    textAlign: "left",
  },
  headerText: {
    fontWeight: "700",
    color: "#555",
  },
  featureText: {
    color: "#333",
    fontSize: 14,
  },
  iconWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProfileScreen;
