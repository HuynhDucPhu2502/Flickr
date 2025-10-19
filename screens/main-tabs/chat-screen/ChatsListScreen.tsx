import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { useAuth } from "../../../contexts/auth";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChatStackParamList } from ".";

// Fallback local
const AVATAR_FALLBACK = require("../../../assets/blank_user_img.png");

// Kiểu nguồn ảnh hợp lệ cho <Image />
type ImgSource = { uri: string } | number;
const toImgSource = (v?: string | number | null): ImgSource =>
  typeof v === "number" ? v : v ? { uri: v } : AVATAR_FALLBACK;

type ChatThread = {
  id: string;
  participants: string[];
  members?: Record<string, { displayName?: string; photoURL?: string }>;
  lastMessage?: { text?: string; createdAt?: any; senderId: string } | null;
  updatedAt?: any;
};

// ===== Bubble "New matches"
const MatchBubble: React.FC<{
  name: string;
  photo?: string | number | null;
  onPress: () => void;
}> = ({ name, photo, onPress }) => (
  <TouchableOpacity style={styles.matchBubble} onPress={onPress}>
    <Image
      source={toImgSource(photo)}
      defaultSource={AVATAR_FALLBACK}
      style={styles.matchAvatar}
    />
    <Text numberOfLines={1} style={styles.matchName}>
      {name}
    </Text>
  </TouchableOpacity>
);

const ChatsListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const { user } = useAuth();
  const uid = user?.uid!;
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>([]);

  // Safe navigate helper
  const goToConversation = (
    chatId: string,
    peer: { uid: string; name?: string; photoURL?: string }
  ) => {
    console.log("[ChatsList] goToConversation()", { chatId, peer });
    try {
      nav.navigate("Conversation", { chatId, peer });
    } catch (e) {
      console.warn("[ChatsList] navigate fallback via parent", e);
      const parent = nav.getParent();
      if (parent) {
        (parent as any).navigate("Chat", {
          screen: "Conversation",
          params: { chatId, peer },
        });
      }
    }
  };

  useEffect(() => {
    if (!uid) return;
    console.log("[ChatsList] subscribe chats for uid:", uid);

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        console.log("[ChatsList] snapshot size:", snap.size);

        const items: ChatThread[] = [];
        for (const d of snap.docs) {
          const data = d.data() as any;
          const item: ChatThread = {
            id: d.id,
            participants: data.participants || [],
            members: data.members,
            lastMessage: data.lastMessage ?? null,
            updatedAt: data.updatedAt,
          };

          // Nếu thiếu members -> lấy peer từ users/{peer}
          if (!item.members && Array.isArray(item.participants)) {
            const peerId = item.participants.find((x: string) => x !== uid);
            if (peerId) {
              const us = await getDoc(doc(db, "users", peerId));
              if (us.exists()) {
                item.members = {
                  [peerId]: {
                    displayName: us.data().displayName,
                    photoURL: us.data().photoURL,
                  },
                };
              }
            }
          }
          items.push(item);
        }

        setThreads(items);
        setLoading(false);
      },
      (err) => {
        console.error("[ChatsList] snapshot error:", err);
        setLoading(false);
      }
    );
    return () => {
      console.log("[ChatsList] unsubscribe chats");
      unsub();
    };
  }, [uid]);

  const newMatches = threads.filter((t) => !t.lastMessage);
  const messages = threads.filter((t) => !!t.lastMessage);

  const renderMessageItem = ({ item }: { item: ChatThread }) => {
    const peerId =
      item.participants.find((x) => x !== uid) || item.participants[0];
    const peerName = item.members?.[peerId]?.displayName || "Unknown";
    const peerAvatarUrl = item.members?.[peerId]?.photoURL; // có thể undefined
    const peerAvatarSrc = toImgSource(peerAvatarUrl);
    const snippet = item.lastMessage?.text || "Start the conversation";

    // key để ép remount khi url đổi (chỉ khi remote)
    const imgKey =
      typeof peerAvatarSrc === "object"
        ? (peerAvatarSrc as any).uri
        : `local-${item.id}`;

    return (
      <TouchableOpacity
        style={styles.thread}
        onPress={() =>
          goToConversation(item.id, {
            uid: peerId,
            name: peerName,
            photoURL: peerAvatarUrl,
          })
        }
      >
        <Image
          key={imgKey}
          source={peerAvatarSrc}
          defaultSource={AVATAR_FALLBACK}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{peerName}</Text>
          <Text numberOfLines={1} style={styles.snippet}>
            {snippet}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9aa0b4" />
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
          <Text style={styles.loadingText}>No chats yet</Text>
          <Text style={styles.loadingText}>
            Match someone to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(t) => t.id}
          renderItem={renderMessageItem}
          ListHeaderComponent={
            newMatches.length ? (
              <View style={{ paddingBottom: 8 }}>
                <Text style={styles.sectionTitle}>New matches</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 12,
                    paddingBottom: 8,
                  }}
                  data={newMatches}
                  keyExtractor={(t) => t.id}
                  renderItem={({ item }) => {
                    const peerId =
                      item.participants.find((x) => x !== uid) ||
                      item.participants[0];
                    const peerName =
                      item.members?.[peerId]?.displayName || "Unknown";
                    const peerAvatar = item.members?.[peerId]?.photoURL || null;

                    return (
                      <MatchBubble
                        name={peerName}
                        photo={peerAvatar}
                        onPress={() =>
                          goToConversation(item.id, {
                            uid: peerId,
                            name: peerName,
                            photoURL: peerAvatar || undefined,
                          })
                        }
                      />
                    );
                  }}
                />
                <Text style={styles.sectionTitle}>Messages</Text>
              </View>
            ) : (
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
                Messages
              </Text>
            )
          }
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: insets.bottom + 20,
          }}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#fff", marginTop: 6 },

  sectionTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    paddingHorizontal: 12,
    marginBottom: 6,
    marginTop: 6,
  },

  // New matches bubble
  matchBubble: { width: 78, alignItems: "center", marginRight: 10 },
  matchAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eee",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    objectFit: "contain",
  },
  matchName: { color: "#fff", fontSize: 12, textAlign: "center" },

  // Message item
  thread: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eee" },
  name: { fontWeight: "700", color: "#1b1b1f" },
  snippet: { color: "#6b7280", marginTop: 2 },
});

export default ChatsListScreen;
