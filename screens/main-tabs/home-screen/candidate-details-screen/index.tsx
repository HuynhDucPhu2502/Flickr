// screens/home/CandidateDetailsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { PhotoCarousel } from "./components/PhotoCarousel";
import { db } from "../../../../FirebaseConfig";
import type { HomeStackParamList } from "..";

// ===== Màu & style dùng chung =====
const PURPLE = "#6C63FF";
const CARD_BG = "#EFE8FF"; // tím rất nhạt giống UI mẫu
const TEXT_HEADING = "#2B2B3D";
const TEXT_BODY = "#4B4B63";
const TEXT_MUTE = "#8A8FA6";

type Candidate = {
  displayName?: string;
  birthday?: string; // YYYY-MM-DD
  bio?: string;
  gender?: string;
  location?: { city?: string; region?: string };
  occupation?: { title?: string; company?: string };
  education?: { level?: string; school?: string };
  interests?: string[];
  languages?: string[];
  photoURL?: string | null;
  updatedAt?: any;
};

type RouteProps = RouteProp<HomeStackParamList, "CandidateDetails">;

// ===== Component thẻ (card) dùng lại =====
const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  children?: any;
}> = ({ title, subtitle, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
    <View style={{ marginTop: 12 }}>{children}</View>
  </View>
);

// ===== Một dòng detail với icon + label + value =====
const RowItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}> = ({ icon, label, value, last }) => (
  <View style={[styles.row, !last && styles.rowDivider]}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={18} color={PURPLE} />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text numberOfLines={1} style={styles.rowValue}>
      {value || "Not provided"}
    </Text>
  </View>
);

// ===== Chip đơn giản =====
const Chip: React.FC<{ text: string; alt?: boolean }> = ({ text, alt }) => (
  <View style={[styles.chip, alt && styles.chipAlt]}>
    <Text style={[styles.chipText, alt && { color: TEXT_HEADING }]}>
      {text}
    </Text>
  </View>
);

export const CandidateDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { params } = useRoute<RouteProps>();
  const { uid, photoURL } = params ?? ({} as any);

  // ===== State
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Ảnh khởi tạo để hiển thị ngay trong khi chờ Firestore
  const initialUrls = useMemo(() => (photoURL ? [photoURL] : []), [photoURL]);

  // Helper tính tuổi
  const calcAge = (s?: string) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split("-").map(Number);
    const birth = new Date(y, (m ?? 1) - 1, d ?? 1);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  // Lắng nghe profile người dùng
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setProfile((snap.data() as Candidate) ?? null);
        setLoadingProfile(false);
      },
      () => setLoadingProfile(false)
    );
    return () => unsub();
  }, [uid]);

  // Lắng nghe thư viện ảnh (ẩn ảnh đã xóa)
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "photos"),
      where("deletedAt", "==", null),
      orderBy("order", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: string[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.url) list.push(data.url);
        });
        const merged = initialUrls.length
          ? Array.from(new Set([...initialUrls, ...list]))
          : list;
        setUrls(merged);
        setLoadingPhotos(false);
      },
      () => {
        setUrls(initialUrls);
        setLoadingPhotos(false);
      }
    );
    return () => unsub();
  }, [uid, initialUrls]);

  // ===== Giá trị hiển thị
  const name = profile?.displayName || "Unknown";
  const age = calcAge(profile?.birthday);
  const headerLine = age != null ? `${name}, ${age}` : name;

  const about = (profile?.bio || "").trim() || "Not provided";
  const interests = profile?.interests ?? [];
  const languages = profile?.languages ?? [];

  const location =
    [profile?.location?.city, profile?.location?.region]
      .filter(Boolean)
      .join(", ") || "Not provided";
  const occupation =
    profile?.occupation?.title || profile?.occupation?.company
      ? [profile?.occupation?.title, profile?.occupation?.company]
          .filter(Boolean)
          .join(" • ")
      : "Not provided";
  const education =
    (profile?.education?.level &&
      profile?.education?.level !== "other" &&
      [profile?.education?.level, profile?.education?.school]
        .filter(Boolean)
        .join(" • ")) ||
    profile?.education?.school ||
    "Not provided";
  const gender = profile?.gender || "Not provided";
  const birthday = profile?.birthday || "Not provided";

  // ===== Loading khi chưa có gì
  if ((loadingPhotos || loadingProfile) && !urls.length) {
    return (
      <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator color="#fff" />
          <Text style={{ color: "#fff", marginTop: 8 }}>Loading…</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Carousel ảnh */}
        <PhotoCarousel uris={urls} height={460} showIndicators showArrows />

        {/* Tên + tuổi + vị trí ngắn */}
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <Text style={styles.headline}>{headerLine}</Text>
          {location !== "Not provided" ? (
            <Text style={styles.subline}>{location}</Text>
          ) : null}
        </View>

        {/* About me */}
        <SectionCard
          title="About me"
          subtitle="Make it easy for others to get a sense of who you are."
        >
          <Text style={styles.body}>{about}</Text>
        </SectionCard>

        {/* My details (giống bố cục ảnh bạn gửi: icon + label + value) */}
        <SectionCard title="My details">
          <RowItem icon="person-outline" label="Name" value={name} />
          <RowItem icon="calendar-outline" label="Birthday" value={birthday} />
          <RowItem
            icon="briefcase-outline"
            label="Occupation"
            value={occupation}
          />
          <RowItem icon="male-female-outline" label="Gender" value={gender} />
          <RowItem icon="school-outline" label="Education" value={education} />
          <RowItem
            icon="location-outline"
            label="Location"
            value={location}
            last
          />
        </SectionCard>

        {/* Interests */}
        <SectionCard title="I enjoy">
          {interests.length ? (
            <View style={styles.chipsWrap}>
              {interests.map((it, i) => (
                <Chip key={`${it}-${i}`} text={it} />
              ))}
            </View>
          ) : (
            <Text style={styles.body}>Not provided</Text>
          )}
        </SectionCard>

        {/* Languages */}
        <SectionCard title="Languages">
          {languages.length ? (
            <View style={styles.chipsWrap}>
              {languages.map((lg, i) => (
                <Chip key={`${lg}-${i}`} text={lg} alt />
              ))}
            </View>
          ) : (
            <Text style={styles.body}>Not provided</Text>
          )}
        </SectionCard>

        <View style={{ height: 24 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },

  // Headline dưới ảnh
  headline: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 24,
  },
  subline: { color: "#f0f0ff", marginTop: 2 },

  // Card style (giống ảnh mẫu)
  card: {
    backgroundColor: CARD_BG,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    // bóng nhẹ
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    color: TEXT_HEADING,
    fontWeight: "800",
    fontSize: 16,
  },
  cardSub: {
    color: TEXT_MUTE,
    marginTop: 6,
  },

  // Body text trong card
  body: {
    color: TEXT_BODY,
    lineHeight: 20,
  },

  // Rows trong "My details"
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  rowDivider: {
    borderBottomColor: "rgba(0,0,0,0.06)",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#F1EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    color: TEXT_HEADING,
    fontWeight: "700",
    flex: 0,
    minWidth: 88,
  },
  rowValue: {
    color: TEXT_BODY,
    flex: 1,
    textAlign: "right",
  },

  // Chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#fff",
    borderColor: "#D4D7E2",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipAlt: {
    backgroundColor: "#fff",
  },
  chipText: {
    color: TEXT_BODY,
    fontWeight: "600",
  },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
});

export default CandidateDetailsScreen;
