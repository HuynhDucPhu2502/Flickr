import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../../contexts/auth";
import {
  Candidate,
  fetchCandidates,
  swipeLeft,
  swipeRight,
} from "../../../../services/swipeService";

// Components
import { Header } from "./components/Header";
import { SwipeCard } from "./components/SwipeCard";
import { RoundButton } from "./components/RoundButton";
import { MatchModal } from "./components/MatchModal";
import { PURPLE_DARK, GRAY_TEXT } from "./components/constants";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "..";

type Props = NativeStackScreenProps<HomeStackParamList, "SwipeFeed">;

export const SwipeFeedScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const uid = user?.uid!;

  const [cards, setCards] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchModal, setMatchModal] = useState<{
    me?: Candidate;
    them?: Candidate;
    visible: boolean;
  }>({ visible: false });

  // ===== Load feed
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const list = await fetchCandidates(uid);
        if (mounted) {
          setCards(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ [HomeScreen] Fetch error:", err);
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid, profile?.preferences?.genders?.join(",")]);

  // ===== Swipe engine
  const pan = useRef(new Animated.ValueXY()).current;
  const [history, setHistory] = useState<Candidate[]>([]);
  const isAnimating = useRef(false); // Ngăn chặn việc kéo nhiều lần khi animation đang chạy

  const rotate = pan.x.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: ["-10deg", "0deg", "10deg"],
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const nopeOpacity = pan.x.interpolate({
    inputRange: [-120, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const topCard = cards[0];
  const nextCard = cards[1];

  /**
   * Sử dụng forceSwipe dưới dạng useCallback để không bị xung đột và ổn định.
   */
  const forceSwipe = useCallback(
    (dir: "left" | "right") => {
      //Nếu không có card hoặc animation đang chạy, không làm gì cả (để tránh xung đột)
      if (!topCard || isAnimating.current) return;

      isAnimating.current = true;

      Animated.timing(pan, {
        toValue: { x: dir === "right" ? 1000 : -1000, y: 0 },
        duration: 180,
        useNativeDriver: false,
      }).start(() => {
        (async () => {
          const swiped = topCard;
          // Reset lại animation cho card phía sau
          pan.setValue({ x: 0, y: 0 });

          // Cập nhật nội bộ (các useState)
          setHistory((h) => [swiped, ...h]);
          setCards((c) => c.slice(1));

          try {
            if (dir === "right") {
              const res = await swipeRight(uid, swiped.uid);
              if (res.matched) {
                setMatchModal({
                  visible: true,
                  me: {
                    uid: profile?.uid ?? uid,
                    displayName: profile?.displayName ?? "You",
                    photoURL: profile?.photoURL ?? null,
                    birthday: profile?.birthday ?? null,
                    bio: profile?.bio,
                    occupation: profile?.occupation,
                    gender: profile?.gender,
                    age: undefined,
                  },
                  them: swiped,
                });
              }
            } else {
              await swipeLeft(uid, swiped.uid);
            }
          } catch (err) {
            console.error("❌ [forceSwipe] Swipe error:", err);
            //Nếu bị lỗi, trả thẻ đó trở lại (roll back thẻ lại)
            setCards((c) => [swiped, ...c]);
          } finally {
            //Xác nhận animation chạy xong, để cho phép chạy các animation của các card khác
            isAnimating.current = false;
          }
        })();
      });
    },

    [pan, topCard, uid, profile]
  );

  /**
   * PanResponder: phát hiện người dùng kéo, lướt và thả ngón tay
   */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          //Hằng số swipeThreshold là độ xa người dùng kéo thẻ. Nếu người dùng kéo vượt quá swipeThreshold thì sẽ thực thi chức năng.
          //Nếu nhỏ hơn swipeThreshold thì card sẽ bị snap back lại
          const swipeThreshold = 120;
          if (isAnimating.current) {
            // Nếu animation đang chạy thì snap back
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
            return;
          }

          if (g.dx > swipeThreshold) {
            forceSwipe("right");
          } else if (g.dx < -swipeThreshold) {
            forceSwipe("left");
          } else {
            //Không đủ xa, card bị snap back lại
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [pan, forceSwipe]
  );

  // ===== UI
  return (
    <LinearGradient colors={["#B993D6", "#8CA6DB"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }}>
        <Header onPressOptions={() => {}} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
        {loading ? (
          <Text
            style={{ textAlign: "center", color: GRAY_TEXT, marginTop: 24 }}
          >
            Đang tải danh sách…
          </Text>
        ) : !topCard ? (
          <Text
            style={{ textAlign: "center", color: GRAY_TEXT, marginTop: 24 }}
          >
            Hết ứng viên rồi 💔 Hãy quay lại sau nhé!
          </Text>
        ) : (
          <View style={{ flex: 1 }}>
            {nextCard && (
              <SwipeCard
                candidate={nextCard}
                style={{ position: "absolute", top: 0, left: 0, right: 0 }}
                elevation={1}
                onPress={() =>
                  navigation.navigate("CandidateDetails", {
                    uid: nextCard.uid,
                    photoURL: nextCard.photoURL ?? undefined,
                  })
                }
              />
            )}

            <Animated.View
              style={[
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate },
                  ],
                },
                { position: "absolute", left: 0, right: 0 },
              ]}
              {...panResponder.panHandlers}
            >
              <SwipeCard
                candidate={topCard}
                onPress={() =>
                  navigation.navigate("CandidateDetails", {
                    uid: topCard.uid,
                    photoURL: topCard.photoURL ?? undefined,
                  })
                }
              />

              {/* Badges */}
              <Animated.View
                style={[styles.badgeLike, { opacity: likeOpacity }]}
              >
                <Ionicons name="heart" size={70} color={PURPLE_DARK} />
              </Animated.View>
              <Animated.View
                style={[styles.badgeNope, { opacity: nopeOpacity }]}
              >
                <Ionicons name="close-circle" size={70} color="#F87171" />
              </Animated.View>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Bottom actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <RoundButton
          onPress={() => forceSwipe("left")}
          bg="#fff"
          // disabled={!topCard || isAnimating.current}
        >
          <Ionicons name="close" size={30} color="#F04D78" />
        </RoundButton>
        <RoundButton
          onPress={() => forceSwipe("right")}
          bg={PURPLE_DARK}
          // disabled={!topCard || isAnimating.current}
        >
          <Ionicons name="heart" size={28} color="#fff" />
        </RoundButton>
      </View>

      {/* Match modal */}
      <MatchModal
        visible={matchModal.visible}
        me={matchModal.me}
        them={matchModal.them}
        onClose={() => setMatchModal({ visible: false })}
        onSayHi={() => setMatchModal({ visible: false })}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badgeLike: {
    position: "absolute",
    top: 20,
    right: 20,
    transform: [{ rotate: "8deg" }],
  },
  badgeNope: {
    position: "absolute",
    top: 20,
    left: 20,
    transform: [{ rotate: "-8deg" }],
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
});

export default SwipeFeedScreen;
