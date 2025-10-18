import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../../FirebaseConfig";
import { useAuth } from "../../../../contexts/auth";
import { swipeLeft, swipeRight } from "../../../../services/swipe";
import type { UserProfile } from "../../../../services/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "..";

const { width } = Dimensions.get("window");
const PHOTO_H = Math.round(width * 1.1);
const PURPLE = "#6C63FF";
const GRAY = "#6B7280";
const BG_SOFT = "#F6F0FA";

type PhotoDoc = {
  id: string;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  isMain: boolean;
  order: number;
  uploadedAt?: any;
};

type Props = NativeStackScreenProps<HomeStackParamList, "CandidateDetails">;

const CandidateDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const targetUid = route.params.uid;

  const { user } = useAuth();
  const myUid = user?.uid!;

  // ===== State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<PhotoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(0);

  // ===== Load profile + photos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // user doc
        const snap = await getDoc(doc(db, "users", targetUid));
        const data = (snap.data() as UserProfile) || null;

        // photos subcollection
        const q = query(
          collection(db, "users", targetUid, "photos"),
          orderBy("order", "desc")
        );
        const ps = await getDocs(q);
        const list: PhotoDoc[] = [];
        ps.forEach((d) => {
          const p = d.data() as PhotoDoc;
          if (!p?.url) return;
          list.push(p);
        });

        if (mounted) {
          setProfile(data);
          setPhotos(list.length ? list : []);
          setLoading(false);
        }
      } catch (e) {
        console.error("❌ [CandidateDetails] fetch error:", e);
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [targetUid]);

  // ===== Helpers
  const calcAge = (birthday?: string | null) => {
    if (!birthday) return undefined;
    const m = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return undefined;
    const [_, y, mo, d] = m;
    const dob = new Date(Number(y), Number(mo) - 1, Number(d));
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const beforeBirthday =
      now.getMonth() < dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
    if (beforeBirthday) age -= 1;
    return age;
  };

  const age = useMemo(() => calcAge(profile?.birthday), [profile?.birthday]);

  // ===== Action handlers
  const onLike = async () => {
    try {
      const res = await swipeRight(myUid, targetUid);
      if (res.matched) {
        Alert.alert(
          "💞 Match!",
          "Hai bạn đã thích nhau! Hãy bắt đầu trò chuyện nhé."
        );
      } else {
        Alert.alert("Đã thích", "Bạn đã bày tỏ sự quan tâm.");
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể thực hiện like.");
    }
  };

  const onNope = async () => {
    try {
      await swipeLeft(myUid, targetUid);
      Alert.alert("Đã ẩn", "Bạn sẽ không thấy hồ sơ này nữa.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể ẩn hồ sơ này.");
    }
  };

  // ===== UI
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: GRAY }}>Đang tải hồ sơ…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <Text>Không tìm thấy hồ sơ.</Text>
      </View>
    );
  }

  const displayName = profile.displayName ?? "User";
  const heroPhotos = photos.length
    ? photos
    : profile.photoURL
    ? [{ id: "main", url: profile.photoURL } as any]
    : [];
  const subtitleParts: string[] = [];
  if (typeof age === "number") subtitleParts.push(String(age));
  if (profile.gender) subtitleParts.push(profile.gender);
  const subtitle = subtitleParts.join(" • ");

  return (
    <LinearGradient colors={["#F3E8FF", "#EDE9FE"]} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header in-content */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#4B0082" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        {/* Photo carousel */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const p = Math.round(e.nativeEvent.contentOffset.x / width);
              if (p !== paging) setPaging(p);
            }}
            scrollEventThrottle={16}
          >
            {heroPhotos.map((p, idx) => (
              <Image
                key={p.id ?? idx}
                source={{ uri: p.url }}
                style={{ width, height: PHOTO_H }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dots}>
            {heroPhotos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === paging && { width: 18, backgroundColor: PURPLE },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Basic info */}
        <View style={styles.contentWrap}>
          <Text style={styles.name}>{displayName}</Text>
          {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}

          {/* Occupation */}
          {profile.occupation?.title ? (
            <InfoRow
              icon="briefcase-outline"
              label="Occupation"
              value={
                profile.occupation.company
                  ? `${profile.occupation.title} @ ${profile.occupation.company}`
                  : profile.occupation.title
              }
            />
          ) : null}

          {/* Education */}
          {profile.education?.level && profile.education.level !== "other" ? (
            <InfoRow
              icon="school-outline"
              label="Education"
              value={
                profile.education.school
                  ? `${profile.education.level} • ${profile.education.school}`
                  : profile.education.level
              }
            />
          ) : null}

          {/* Location */}
          {profile.location?.city ? (
            <InfoRow
              icon="location-outline"
              label="Location"
              value={[profile.location.city, profile.location.region]
                .filter(Boolean)
                .join(", ")}
            />
          ) : null}

          {/* Bio */}
          {profile.bio ? (
            <View style={styles.section}>
              <Text style={styles.secTitle}>About</Text>
              <Text style={styles.bodyText}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* Interests */}
          {Array.isArray(profile.interests) && profile.interests.length ? (
            <View style={styles.section}>
              <Text style={styles.secTitle}>Interests</Text>
              <View style={styles.chips}>
                {profile.interests.map((it) => (
                  <Chip key={it} label={it} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Languages */}
          {Array.isArray(profile.languages) && profile.languages.length ? (
            <View style={styles.section}>
              <Text style={styles.secTitle}>Languages</Text>
              <View style={styles.chips}>
                {profile.languages.map((lg) => (
                  <Chip key={lg} label={lg} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Round bg="#fff" onPress={onNope}>
          <Ionicons name="close" size={30} color="#F04D78" />
        </Round>
        <Round bg={PURPLE} onPress={onLike}>
          <Ionicons name="heart" size={28} color="#fff" />
        </Round>
      </View>
    </LinearGradient>
  );
};

export default CandidateDetailsScreen;

/* ====== Small UI bits ====== */
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={PURPLE} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const Round: React.FC<{
  children: React.ReactNode;
  bg?: string;
  onPress?: () => void;
}> = ({ children, bg = "#fff", onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.round, { backgroundColor: bg }]}
  >
    {children}
  </TouchableOpacity>
);

/* ====== Styles ====== */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  iconBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  contentWrap: {
    backgroundColor: "#fff",
    marginTop: -16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  name: { fontSize: 24, fontWeight: "800", color: "#2B2B3D" },
  sub: { color: GRAY, marginTop: 4 },

  section: {
    marginTop: 16,
    backgroundColor: BG_SOFT,
    borderRadius: 14,
    padding: 12,
  },
  secTitle: { fontWeight: "800", color: "#2B2B3D", marginBottom: 6 },
  bodyText: { color: "#333", lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    gap: 8,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  infoLabel: { fontWeight: "700", color: "#2B2B3D" },
  infoValue: { marginLeft: "auto", color: "#333", maxWidth: "65%" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#fff",
    borderColor: "#E2E6F0",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: "#333", fontWeight: "600" },

  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingHorizontal: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  round: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});
