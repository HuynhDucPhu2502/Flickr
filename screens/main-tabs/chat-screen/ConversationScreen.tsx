"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { useAuth } from "../../../contexts/auth";
import type { ChatStackParamList } from ".";

type RouteProps = RouteProp<ChatStackParamList, "Conversation">;
type NavProps = NativeStackNavigationProp<ChatStackParamList, "Conversation">;

type ChatMessage = {
  id: string;
  text?: string;
  senderId: string;
  createdAt?: any;
  type?: "text";
};

const AVATAR_FALLBACK = require("../../../assets/blank_user_img.png");

const BG_GRADIENT = ["#0E0C1F", "#1A1040", "#2A145A"] as const;

type ImgSource = { uri: string } | number;
const toImgSource = (v?: string | number | null): ImgSource =>
  typeof v === "number" ? v : v ? { uri: v } : AVATAR_FALLBACK;

const ConversationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NavProps>();
  const { user } = useAuth();
  const me = user?.uid!;
  const { params } = useRoute<RouteProps>();
  const { chatId, peer } = params || ({} as any);

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  const [peerImgErr, setPeerImgErr] = useState(false);
  const peerAvatarSrc: ImgSource = peerImgErr
    ? AVATAR_FALLBACK
    : toImgSource(peer?.photoURL);
  const peerImageKey =
    typeof peerAvatarSrc === "object"
      ? (peerAvatarSrc as any).uri
      : "local-peer";

  const toDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (typeof ts.toDate === "function") return ts.toDate();
    if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
    return null;
  };
  const formatTime = (d?: Date | null) => {
    if (!d) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };
  const isSameDay = (a?: Date | null, b?: Date | null) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const handleCallPress = () => {
    if (!chatId || !peer) {
      console.warn("[Conversation] Missing chatId or peer for call");
      return;
    }
    nav.navigate("VoiceCall", { chatId, peer });
  };

  useEffect(() => {
    console.log("[Conversation] mounted with chatId:", chatId, "peer:", peer);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) {
      console.log("[Conversation] Missing chatId");
      return;
    }
    console.log("[Conversation] subscribe messages:", chatId);
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: ChatMessage[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setMsgs(items);
      },
      (err) => console.error("[Conversation] snapshot error:", err)
    );
    return () => {
      console.log("[Conversation] unsubscribe messages");
      unsub();
    };
  }, [chatId]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      const ref = await addDoc(collection(db, "chats", chatId, "messages"), {
        text: content,
        senderId: me,
        createdAt: serverTimestamp(),
        type: "text",
      });
      console.log("[Conversation] message added:", ref.id);

      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: {
            text: content,
            senderId: me,
            createdAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("[Conversation] send error:", e);
    }
  };

  const getNextItem = (index: number) => msgs[index + 1];
  const shouldShowAvatar = (item: ChatMessage, next?: ChatMessage) => {
    if (item.senderId === me) return false;
    if (!next) return true;
    const nextSameSender = next.senderId === item.senderId;
    const t1 = toDate(item.createdAt);
    const t2 = toDate(next.createdAt);
    const sameDay = isSameDay(t1, t2);
    return !(nextSameSender && sameDay);
  };
  const shouldShowTime = (item: ChatMessage, next?: ChatMessage) => {
    const t1 = toDate(item.createdAt);
    if (!next) return true;
    const t2 = toDate(next.createdAt);
    if (item.senderId !== next.senderId) return true;
    if (!t1 || !t2) return false;
    if (!isSameDay(t1, t2)) return true;
    const diff = Math.abs(+t1 - +t2) / (1000 * 60);
    return diff >= 10;
  };
  const shouldShowDaySeparator = (item: ChatMessage, index: number) => {
    const prev = msgs[index - 1];
    const d1 = toDate(item.createdAt);
    const d2 = toDate(prev?.createdAt);
    if (!d1) return false;
    if (!prev) return true;
    return !isSameDay(d1, d2);
  };
  const dayLabel = (d?: Date | null) => {
    if (!d) return "";
    const now = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dayOnly = (x: Date) =>
      new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = (dayOnly(now) - dayOnly(d)) / (1000 * 60 * 60 * 24);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${yyyy}-${mm}-${dd}`;
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const mine = item.senderId === me;
    const next = getNextItem(index);
    const showAvatar = shouldShowAvatar(item, next);
    const showTime = shouldShowTime(item, next);
    const showDay = shouldShowDaySeparator(item, index);
    const created = toDate(item.createdAt);

    return (
      <>
        {showDay ? (
          <View style={styles.dayWrap}>
            <Text style={styles.dayText}>{dayLabel(created)}</Text>
          </View>
        ) : null}

        <View style={[styles.row, mine ? styles.rowMe : styles.rowPeer]}>
          {!mine && (
            <View style={styles.avatarSlot}>
              {showAvatar ? (
                <Image
                  key={peerImageKey + "-list"}
                  source={peerAvatarSrc}
                  defaultSource={AVATAR_FALLBACK}
                  onError={() => setPeerImgErr(true)}
                  style={styles.avatar}
                />
              ) : (
                <View style={{ width: 32 }} />
              )}
            </View>
          )}

          <View
            style={[styles.bubble, mine ? styles.bubbleMe : styles.bubblePeer]}
          >
            <Text style={[styles.bubbleText, mine && { color: "#fff" }]}>
              {item.text}
            </Text>
            {showTime ? (
              <Text
                style={[
                  styles.timeText,
                  mine && { color: "rgba(255,255,255,0.85)" },
                ]}
              >
                {formatTime(created)}
              </Text>
            ) : null}
          </View>

          {mine && <View style={styles.avatarSlot} />}
        </View>
      </>
    );
  };

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            key={peerImageKey}
            source={peerAvatarSrc}
            defaultSource={AVATAR_FALLBACK}
            onError={() => setPeerImgErr(true)}
            style={styles.headerAvatar}
          />
          <Text numberOfLines={1} style={styles.headerTitle}>
            {peer?.name || "Chat"}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleCallPress}>
            <Ionicons name="call-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => {}}>
            <Ionicons name="alert-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <FlatList
            ref={listRef}
            data={msgs}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={{
              padding: 12,
              paddingTop: 6,
              paddingBottom: 6,
            }}
          />
        </TouchableWithoutFeedback>

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            placeholder="Type a message"
            placeholderTextColor="#9aa0b4"
            style={styles.input}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && { opacity: 0.4 }]}
            onPress={send}
            disabled={!canSend}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    maxWidth: "85%",
  },
  headerRight: { flexDirection: "row", alignItems: "center" },

  row: {
    flexDirection: "row",
    paddingHorizontal: 6,
    marginVertical: 2,
    alignItems: "flex-end",
  },
  rowMe: { justifyContent: "flex-end" },
  rowPeer: { justifyContent: "flex-start" },

  avatarSlot: { width: 32, alignItems: "center", marginRight: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#eee" },

  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: "#6C63FF",
    borderTopRightRadius: 6,
    marginLeft: 50,
  },
  bubblePeer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 6,
  },
  bubbleText: { color: "#1b1b1f", fontSize: 15, lineHeight: 20 },
  timeText: {
    marginTop: 4,
    fontSize: 11,
    color: "#c9cbe1",
    alignSelf: "flex-end",
  },

  dayWrap: { alignItems: "center", marginVertical: 6 },
  dayText: {
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    fontSize: 12,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 140,
    color: "#1b1b1f",
  },
  sendBtn: {
    backgroundColor: "#6C63FF",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ConversationScreen;
