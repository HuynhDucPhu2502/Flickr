import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAuth } from "../../../../../contexts/auth";
import { auth, db } from "../../../../../FirebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { updateProfileFields } from "../../../../../services/userService";
import { updateProfile as fbUpdateProfile } from "firebase/auth";
import {
  uploadPhotoFromUri,
  deletePhoto,
  setMainPhoto,
} from "../../../../../services/profilePhotoService";

// Sections
import {
  PhotosSection,
  AboutSection,
  DetailsSection,
  PreferencesSection,
  InterestsSection,
  LanguagesSection,
  OnboardingChecklistSection,
} from "./sections";

// Các component dùng trong bottom sheets
import { RNInput } from "./components/RNInput";
import { PrimaryButton } from "./components/PrimaryButton";
import { Stepper } from "./components/Stepper";
import { DetailSheet } from "./components/DetailSheet";
import { PURPLE, TEXT_MUTE } from "./components/theme";
import type { PhotoDoc, Panel } from "./components/types";

export const ProfileEditScreen = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { user, profile } = useAuth();
  const uid = user?.uid!;

  const [panel, setPanel] = useState<Panel>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photos, setPhotos] = useState<PhotoDoc[]>([]);
  const mainPhoto = useMemo(
    () => photos.find((p) => p.isMain) ?? photos[0],
    [photos]
  );

  // State nhập liệu cục bộ (không đồng bộ ngay lên Firestore)
  const [about, setAbout] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [langs, setLangs] = useState<string[]>([]);
  const [newLang, setNewLang] = useState("");

  // Date picker cho Birthday
  const [showBdayPicker, setShowBdayPicker] = useState(false);

  // Cờ “dirty” để tránh snapshot đè khi đang gõ
  const [dirty, setDirty] = useState({
    about: false,
    interests: false,
    langs: false,
  });

  // Android: tự mở date picker khi sheet Birthday hiển thị
  useEffect(() => {
    if (panel === "birthday" && Platform.OS === "android") {
      setShowBdayPicker(true);
    }
  }, [panel]);

  // Đồng bộ từ profile -> local state nếu field chưa dirty
  useEffect(() => {
    if (!profile) return;
    setAbout((prev) => (dirty.about ? prev : profile.bio ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.bio]);

  useEffect(() => {
    if (!profile) return;
    setInterests((prev) => (dirty.interests ? prev : profile.interests ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.interests]);

  useEffect(() => {
    if (!profile) return;
    setLangs((prev) => (dirty.langs ? prev : profile.languages ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.languages]);

  // Lắng nghe thay đổi Photo collection
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, `users/${uid}/photos`),
      orderBy("order", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PhotoDoc[] = [];
        snap.forEach((d) => {
          const data = d.data() as PhotoDoc;
          if (!data.deletedAt) list.push(data);
        });
        setPhotos(list);
        setLoadingPhotos(false);
      },
      () => setLoadingPhotos(false)
    );
    return () => unsub();
  }, [uid]);

  // Chọn ảnh từ thư viện & upload
  const pickAndUpload = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      await uploadPhotoFromUri(uid, asset.uri, {
        makeMain: photos.length === 0,
        width: asset.width,
        height: asset.height,
      });
    } catch (e: any) {
      Alert.alert("Photo upload failed", e?.message ?? String(e));
    }
  };

  // Xác nhận xoá ảnh
  const confirmDelete = (p: PhotoDoc) => {
    Alert.alert(
      "Delete photo?",
      "This photo will be removed from your profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePhoto(uid, p.storagePath, p.id);
            } catch (e: any) {
              Alert.alert("Failed to delete photo", e?.message ?? String(e));
            }
          },
        },
      ]
    );
  };

  // Đặt ảnh chính
  const setAsMain = async (p: PhotoDoc) => {
    try {
      await setMainPhoto(uid, p.id, p.url);
    } catch (e: any) {
      Alert.alert("Failed to set main photo", e?.message ?? String(e));
    }
  };

  // Tính % hoàn thiện hồ sơ
  const completion = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      !!(mainPhoto?.url || profile.photoURL),
      !!(about || profile.bio),
      !!profile.displayName,
      !!profile.birthday,
      !!profile.occupation?.title,
      !!profile.gender,
      !!profile.education?.level && profile.education?.level !== "other",
      (interests.length || (profile.interests?.length ?? 0)) > 0,
      (langs.length || (profile.languages?.length ?? 0)) > 0,
      !!profile.location?.city,
      profile.preferences?.genders?.length,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile, mainPhoto, about, interests, langs]);

  // Thêm item vào mảng nếu chưa tồn tại (so sánh case-insensitive)
  const pushIfNotExist = (arr: string[], item: string) => {
    const v = item.trim();
    if (!v) return arr;
    if (arr.some((x) => x.toLowerCase() === v.toLowerCase())) return arr;
    return [...arr, v];
  };

  // Lưu nhanh các field text (About/Interests/Languages) và kiểm tra onboard
  const saveQuickFields = async () => {
    try {
      const hasMainPhoto = !!(mainPhoto?.url || profile?.photoURL);
      const hasName = !!profile?.displayName?.trim();
      const hasGender = !!profile?.gender;
      const hasBirthday = !!profile?.birthday;

      const shouldOnboard =
        !profile?.onboarded &&
        hasMainPhoto &&
        hasName &&
        hasGender &&
        hasBirthday;

      await updateProfileFields(uid, {
        bio: about,
        interests,
        languages: langs,
        ...(shouldOnboard ? { onboarded: true } : {}),
      });

      // reset cờ dirty sau khi lưu
      setDirty({ about: false, interests: false, langs: false });

      // Thông báo các mục còn thiếu để đủ điều kiện hiển thị
      if (!shouldOnboard && missingOnboardLabels.length) {
        Alert.alert(
          "Not ready to be shown",
          `Please complete:\n• ${missingOnboardLabels.join("\n• ")}`
        );
      }

      Alert.alert(
        "Saved",
        shouldOnboard
          ? "Your profile is ready to be shown."
          : "Your profile has been updated."
      );
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? String(e));
    }
  };

  // Helper: Date -> YYYY-MM-DD
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  // Helper: YYYY-MM-DD -> Date (fallback 2000-01-01 nếu sai định dạng)
  const fromISODate = (s?: string) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(2000, 0, 1);
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  };

  // Tóm tắt Discovery Preferences
  const pref = profile?.preferences ?? {};
  const prefPreview = useMemo(() => {
    const aMin = pref.ageMin ?? 18;
    const aMax = pref.ageMax ?? 40;
    const gs =
      pref.genders && pref.genders.length ? pref.genders.join("/") : "all";
    return `${aMin}-${aMax} • ${gs}`;
  }, [profile?.preferences]);

  // Giá trị hiển thị cho phần Details
  const nameVal = profile?.displayName || user?.displayName || undefined;
  const birthdayVal = profile?.birthday || undefined;
  const occupationVal = profile?.occupation?.title;
  const genderVal = profile?.gender || undefined;
  const educationVal =
    profile?.education?.level && profile.education.level !== "other"
      ? profile.education.level
      : undefined;
  const locationVal =
    [profile?.location?.city, profile?.location?.region]
      .filter(Boolean)
      .join(", ") || undefined;

  // Checklist Onboarding (liệt kê các mục cần hoàn thành)
  const onboardingChecks = useMemo(
    () => [
      {
        key: "mainPhoto" as const,
        label: "Add a main photo",
        done: !!(mainPhoto?.url || profile?.photoURL),
        onPress: () => pickAndUpload(),
      },
      {
        key: "name" as const,
        label: "Add a display name",
        done: !!profile?.displayName?.trim(),
        onPress: () => setPanel("name"),
      },
      {
        key: "gender" as const,
        label: "Select a gender",
        done: !!profile?.gender,
        onPress: () => setPanel("gender"),
      },
      {
        key: "birthday" as const,
        label: "Select a birthday",
        done: !!profile?.birthday,
        onPress: () => setPanel("birthday"),
      },
    ],
    [
      profile?.photoURL,
      profile?.displayName,
      profile?.gender,
      profile?.birthday,
      mainPhoto,
    ]
  );
  const missingOnboardLabels = useMemo(
    () => onboardingChecks.filter((c) => !c.done).map((c) => c.label),
    [onboardingChecks]
  );

  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Thanh tiến độ hồ sơ */}
        <View style={{ marginHorizontal: 12, marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Profile completion</Text>
          <View style={styles.progressWrap}>
            <View style={[styles.progressBar, { width: `${completion}%` }]} />
          </View>
          <Text style={styles.progressText}>{completion}%</Text>
        </View>

        {/* Checklist Onboarding */}
        <OnboardingChecklistSection checks={onboardingChecks} />

        {/* Ảnh hồ sơ */}
        <PhotosSection
          loading={loadingPhotos}
          photos={photos}
          mainPhoto={mainPhoto}
          onAddPhoto={pickAndUpload}
          onDeletePhoto={confirmDelete}
          onMakeMainPhoto={setAsMain}
        />

        {/* About me */}
        <AboutSection
          about={about}
          onChangeAbout={(t) => {
            setAbout(t);
            setDirty((d) => ({ ...d, about: true }));
          }}
        />

        {/* Thông tin chi tiết */}
        <DetailsSection
          name={nameVal}
          birthday={birthdayVal}
          occupation={occupationVal}
          gender={genderVal}
          education={educationVal}
          location={locationVal}
          onOpen={setPanel}
        />

        {/* Tuỳ chọn khám phá */}
        <PreferencesSection
          preview={prefPreview}
          onOpen={() => setPanel("preferences")}
        />

        {/* Sở thích */}
        <InterestsSection
          interests={interests}
          newInterest={newInterest}
          onChangeNewInterest={setNewInterest}
          onAddInterest={() => {
            setInterests((a) => pushIfNotExist(a, newInterest));
            setDirty((d) => ({ ...d, interests: true }));
            setNewInterest("");
          }}
          onRemoveInterest={(it) => {
            setInterests((arr) => arr.filter((x) => x !== it));
            setDirty((d) => ({ ...d, interests: true }));
          }}
        />

        {/* Ngôn ngữ */}
        <LanguagesSection
          languages={langs}
          newLanguage={newLang}
          onChangeNewLanguage={setNewLang}
          onAddLanguage={() => {
            setLangs((a) => pushIfNotExist(a, newLang));
            setDirty((d) => ({ ...d, langs: true }));
            setNewLang("");
          }}
          onRemoveLanguage={(lg) => {
            setLangs((arr) => arr.filter((x) => x !== lg));
            setDirty((d) => ({ ...d, langs: true }));
          }}
        />

        {/* Nút lưu */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <PrimaryButton
            title="Save changes"
            onPress={saveQuickFields}
            icon="save-outline"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ======= Bottom Sheets chi tiết ======= */}
      {/* Name */}
      <DetailSheet
        visible={panel === "name"}
        title="Name"
        onClose={() => setPanel(null)}
        onSave={async (form) => {
          const name = (form.displayName as string)?.trim() || "";
          if (!name) {
            Alert.alert("Name missing", "Please enter your name.");
            return;
          }
          await updateProfileFields(uid, { displayName: name });
          if (auth.currentUser && auth.currentUser.uid === uid) {
            await fbUpdateProfile(auth.currentUser, { displayName: name });
          }
          setPanel(null);
        }}
        initial={{
          displayName: profile?.displayName ?? user?.displayName ?? "",
        }}
        fields={[
          { key: "displayName", label: "Your name", placeholder: "e.g. Alex" },
        ]}
      />

      {/* Birthday (calendar) */}
      <DetailSheet
        visible={panel === "birthday"}
        title="Birthday"
        onClose={() => {
          setShowBdayPicker(false);
          setPanel(null);
        }}
        onSave={async (form) => {
          const b = (form.birthday as string)?.trim() || "";
          if (b && !/^\d{4}-\d{2}-\d{2}$/.test(b)) {
            Alert.alert("Invalid format", "Use YYYY-MM-DD (e.g., 2000-12-31).");
            return;
          }
          await updateProfileFields(uid, { birthday: b || null });
          setShowBdayPicker(false);
          setPanel(null);
        }}
        initial={{ birthday: profile?.birthday ?? "" }}
        renderBody={(state, setState) => {
          const current = fromISODate(state.birthday as string);
          return (
            <View style={{ gap: 12 }}>
              <Text style={styles.sheetSubTitle}>Pick your birthday</Text>

              {/* Bọc RNInput bằng nút để đảm bảo Android nhận sự kiện chạm */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowBdayPicker(true)}
              >
                <RNInput
                  placeholder="YYYY-MM-DD"
                  value={(state.birthday as string) ?? ""}
                  editable={false} // chỉ hiển thị, không cho gõ trực tiếp
                />
              </TouchableOpacity>

              {showBdayPicker && (
                <DateTimePicker
                  mode="date"
                  value={current}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  display={Platform.select({
                    ios: "spinner",
                    android: "default",
                  })}
                  // Tuỳ biến nhẹ cho iOS (Android dùng theme hệ thống)
                  {...(Platform.OS === "ios"
                    ? { textColor: "#6C63FF", themeVariant: "light" }
                    : {})}
                  onChange={(event: any, selected?: Date) => {
                    // Android: cancel => selected = undefined
                    if (!selected) {
                      if (Platform.OS === "android") setShowBdayPicker(false);
                      return;
                    }
                    setState((s: any) => ({
                      ...s,
                      birthday: toISODate(selected),
                    }));
                    // Android: đóng dialog sau khi chọn
                    if (Platform.OS === "android") setShowBdayPicker(false);
                  }}
                />
              )}
            </View>
          );
        }}
      />

      {/* Occupation */}
      <DetailSheet
        visible={panel === "occupation"}
        title="Occupation"
        onClose={() => setPanel(null)}
        onSave={async (form) => {
          await updateProfileFields(uid, {
            occupation: {
              title: form.title?.trim() || undefined,
              company: form.company?.trim() || undefined,
            },
          });
          setPanel(null);
        }}
        initial={{
          title: profile?.occupation?.title ?? "",
          company: profile?.occupation?.company ?? "",
        }}
        fields={[
          {
            key: "title",
            label: "Title",
            placeholder: "e.g. Software Engineer",
          },
          { key: "company", label: "Company", placeholder: "e.g. ACME Inc." },
        ]}
      />

      {/* Gender */}
      <DetailSheet
        visible={panel === "gender"}
        title="Gender"
        onClose={() => setPanel(null)}
        onSave={async (form) => {
          await updateProfileFields(uid, {
            gender: form.gender || null,
          });
          setPanel(null);
        }}
        initial={{ gender: (profile?.gender as string) ?? "" }}
        renderBody={(state, setState) => (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["male", "female", "nonbinary", "prefer_not_to_say", "custom"].map(
              (g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setState((s: any) => ({ ...s, gender: g }))}
                  style={[
                    styles.chipBtn,
                    state.gender === g && {
                      backgroundColor: PURPLE,
                      borderColor: PURPLE,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      state.gender === g && { color: "#fff" },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      />

      {/* Education */}
      <DetailSheet
        visible={panel === "education"}
        title="Education"
        onClose={() => setPanel(null)}
        onSave={async (form) => {
          await updateProfileFields(uid, {
            education: {
              level: form.level || "other",
              school: form.school?.trim() || undefined,
            },
          });
          setPanel(null);
        }}
        initial={{
          level: (profile?.education?.level as string) ?? "other",
          school: profile?.education?.school ?? "",
        }}
        renderBody={(state, setState) => (
          <>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {["high_school", "bachelor", "master", "phd", "other"].map(
                (lv) => (
                  <TouchableOpacity
                    key={lv}
                    onPress={() => setState((s: any) => ({ ...s, level: lv }))}
                    style={[
                      styles.chipBtn,
                      state.level === lv && {
                        backgroundColor: PURPLE,
                        borderColor: PURPLE,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        state.level === lv && { color: "#fff" },
                      ]}
                    >
                      {lv}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            <RNInput
              placeholder="School / University"
              value={(state.school as string) ?? ""}
              onChangeText={(t) => setState((s: any) => ({ ...s, school: t }))}
            />
          </>
        )}
      />

      {/* Location */}
      <DetailSheet
        visible={panel === "location"}
        title="Location"
        onClose={() => setPanel(null)}
        onSave={async (form) => {
          await updateProfileFields(uid, {
            location: {
              city: (form.city as string)?.trim() || undefined,
              region: (form.region as string)?.trim() || undefined,
            },
          });
          setPanel(null);
        }}
        initial={{
          city: profile?.location?.city ?? "",
          region: profile?.location?.region ?? "",
        }}
        fields={[
          { key: "city", label: "City", placeholder: "e.g. Ho Chi Minh City" },
          { key: "region", label: "State/Region", placeholder: "e.g. HCMC" },
        ]}
      />

      {/* Discovery preferences */}
      <DetailSheet
        visible={panel === "preferences"}
        title="Discovery preferences"
        onClose={() => setPanel(null)}
        onSave={async (form) => {
          const clamp = (n: number, lo: number, hi: number) =>
            Math.max(lo, Math.min(hi, n));
          let ageMin = clamp(Number(form.ageMin) || 18, 18, 80);
          let ageMax = clamp(Number(form.ageMax) || 40, ageMin, 80);
          const genders =
            Array.isArray(form.genders) && form.genders.length
              ? form.genders
              : ["female", "male", "nonbinary"];

          await updateProfileFields(uid, {
            preferences: { ageMin, ageMax, genders },
          });
          setPanel(null);
        }}
        initial={{
          ageMin: profile?.preferences?.ageMin ?? 18,
          ageMax: profile?.preferences?.ageMax ?? 40,
          genders: profile?.preferences?.genders ?? [
            "female",
            "male",
            "nonbinary",
          ],
        }}
        renderBody={(state, setState) => {
          const set = (k: string, v: any) =>
            setState((s: any) => ({ ...s, [k]: v }));
          const genders: Array<"female" | "male" | "nonbinary"> = [
            "female",
            "male",
            "nonbinary",
          ];
          const selectedGenders: string[] = state.genders ?? [];

          return (
            <View style={{ gap: 12 }}>
              <Text style={styles.sheetSubTitle}>Age range</Text>
              <View style={{ gap: 8 }}>
                <Stepper
                  label="Min"
                  value={Number(state.ageMin) || 18}
                  min={18}
                  max={80}
                  onChange={(v: number) => {
                    const max = Math.max(v, Number(state.ageMax) || 40);
                    set("ageMin", v);
                    set("ageMax", max);
                  }}
                />
                <Stepper
                  label="Max"
                  value={Number(state.ageMax) || 40}
                  min={Number(state.ageMin) || 18}
                  max={80}
                  onChange={(v: number) => set("ageMax", v)}
                />
              </View>

              <Text style={styles.sheetSubTitle}>Show me</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {genders.map((g) => {
                  const sel = selectedGenders.includes(g);
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() =>
                        set(
                          "genders",
                          sel
                            ? selectedGenders.filter((x) => x !== g)
                            : [...selectedGenders, g]
                        )
                      }
                      style={[
                        styles.chipBtn,
                        sel && { backgroundColor: PURPLE, borderColor: PURPLE },
                      ]}
                    >
                      <Text
                        style={[styles.chipBtnText, sel && { color: "#fff" }]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  sectionTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "white",
  },
  progressWrap: {
    marginTop: 8,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#E6E2FF",
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: PURPLE, borderRadius: 10 },
  progressText: { marginTop: 6, color: "white", fontWeight: "600" },

  chipBtn: {
    borderWidth: 1,
    borderColor: "#D4D7E2",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  chipBtnText: { color: "#333" },
  sheetSubTitle: { fontWeight: "700", color: "#2B2B3D", marginTop: 6 },
});

export default ProfileEditScreen;
