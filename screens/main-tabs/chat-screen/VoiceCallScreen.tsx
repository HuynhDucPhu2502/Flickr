import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { useAuth } from "../../../contexts/auth";
import { ChatStackParamList } from ".";
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../FirebaseConfig";

// WebRTC
import {
  RTCPeerConnection,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
} from "react-native-webrtc";

const turnServer = {
  url: process.env.EXPRESSTURN_TURN_SERVER_URL,
  username: process.env.EXPRESSTURN_TURN_SERVER_USERNAME,
  password: process.env.EXPRESSTURN_TURN_SERVER_PASSWORD,
};
const TURN_URL = turnServer.url;
const TURN_USERNAME = turnServer.username;
const TURN_CREDENTIAL = turnServer.password;

type RouteProps = RouteProp<ChatStackParamList, "VoiceCall">; // register this route
type CallDocRef = ReturnType<typeof doc>;

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: TURN_URL,
    username: TURN_USERNAME,
    credential: TURN_CREDENTIAL,
  },
];

const pcConfig = { iceServers };

const VoiceCallScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const me = user?.uid!;
  const route = useRoute<RouteProps>();
  const nav = useNavigation();

  // params from navigation: { chatId, peer }
  const { chatId, peer } = route.params as any;

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Firestore refs
  const callDocRef = useRef<CallDocRef | null>(null);
  const offerCandidatesRef = useRef<any>(null);
  const answerCandidatesRef = useRef<any>(null);

  const unsubCallSnapshot = useRef<(() => void) | null>(null);
  const unsubOfferCandidates = useRef<(() => void) | null>(null);
  const unsubAnswerCandidates = useRef<(() => void) | null>(null);

  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId) {
      console.error("Missing chatId");
      ToastAndroid.showWithGravity(
        "Missing chatId",
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM
      );
      nav.goBack();
      return;
    }
    // prepare callDocRef
    callDocRef.current = doc(db, "chats", chatId, "webrtc", "call");
    offerCandidatesRef.current = collection(
      callDocRef.current,
      "offerCandidates"
    );
    answerCandidatesRef.current = collection(
      callDocRef.current,
      "answerCandidates"
    );

    return () => {
      cleanup();
    };
  }, [chatId]);

  // -------------------------------------
  // helpers: create peer connection
  // -------------------------------------
  const createPeerConnection = async (isOfferer: boolean) => {
    const pc = new RTCPeerConnection(pcConfig);

    // --- Lắng nghe ICE candidates ---
    (pc as any).onicecandidate = (event: any) => {
      if (!event.candidate) return;
      const c = event.candidate.toJSON();
      const ref = isOfferer
        ? offerCandidatesRef.current
        : answerCandidatesRef.current;
      addDoc(ref, c).catch((e) => console.warn("addCandidate error:", e));
    };

    // --- Lắng nghe remote stream ---
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    (pc as any).ontrack = (event: any) => {
      event.streams[0].getTracks().forEach((track: any) => {
        remoteStream.addTrack(track);
      });
      console.log("[VoiceCall] ontrack -> remote stream updated");
      setIsInCall(true);
    };

    // --- Lấy local audio stream ---
    const localStream = await mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = localStream;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    return pc;
  };

  // -------------------------------------
  // Start outgoing call (offerer)
  // -------------------------------------
  const startCall = async () => {
    setLoading(true);
    try {
      const pc = await createPeerConnection(true);
      pcRef.current = pc;

      // create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // write offer to Firestore
      await setDoc(callDocRef.current!, {
        offer: {
          type: offer.type,
          sdp: offer.sdp ?? "", // 👈 thêm fallback ""
          from: me,
          to: peer?.uid,
        },
        createdAt: new Date(),
      });

      // listen for answer
      unsubCallSnapshot.current = onSnapshot(
        callDocRef.current!,
        (snap: any) => {
          const data = snap.data() as any;
          if (!data) return;
          if (
            data.answer &&
            pcRef.current &&
            !pcRef.current.remoteDescription
          ) {
            const answerDesc = {
              type: data.answer.type,
              sdp: data.answer.sdp ?? "", // 👈 fix lỗi undefined
            } as RTCSessionDescriptionInit;
            (pcRef.current as any)
              .setRemoteDescription(answerDesc)
              .catch((e: any) => {
                console.warn(
                  "[VoiceCall] setRemoteDescription(answer) failed",
                  e
                );
              });
          }
        }
      );

      // listen for remote ICE candidates (answerCandidates)
      unsubAnswerCandidates.current = onSnapshot(
        answerCandidatesRef.current,
        (snap: any) => {
          snap.docChanges().forEach((change: any) => {
            if (change.type === "added") {
              const c = change.doc.data();
              const candidate = new RTCIceCandidate(c);
              (pcRef.current as any)
                ?.addIceCandidate(candidate)
                .catch((e: any) => {
                  console.warn("[VoiceCall] addIceCandidate(answer) failed", e);
                });
            }
          });
        }
      );

      setIsCalling(true);
    } catch (err) {
      console.error("[VoiceCall] startCall error", err);
      Alert.alert("Call failed", String(err));
      cleanup();
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // Answer incoming call
  // -------------------------------------
  const answerCall = async () => {
    setLoading(true);
    try {
      const callSnap = await getDoc(callDocRef.current!);
      const callData = callSnap.data() as any;
      if (!callData || !callData.offer) {
        Alert.alert("No incoming offer");
        setLoading(false);
        return;
      }

      const pc = await createPeerConnection(false);
      pcRef.current = pc;

      // set remote (offer)
      const offerDesc = {
        type: callData.offer.type,
        sdp: callData.offer.sdp ?? "", // 👈 fallback để TS không kêu
      } as RTCSessionDescriptionInit;
      await (pc as any).setRemoteDescription(offerDesc);

      // create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // write answer to Firestore
      await updateDoc(callDocRef.current!, {
        answer: {
          type: answer.type,
          sdp: answer.sdp ?? "", // 👈 fallback fix TS
          from: me,
          to: callData.offer.from,
        },
        answeredAt: new Date(),
      });

      // listen for offerCandidates
      unsubOfferCandidates.current = onSnapshot(
        offerCandidatesRef.current,
        (snap: any) => {
          snap.docChanges().forEach((change: any) => {
            if (change.type === "added") {
              const c = change.doc.data();
              const candidate = new RTCIceCandidate(c);
              (pcRef.current as any)
                ?.addIceCandidate(candidate)
                .catch((e: any) => {
                  console.warn("[VoiceCall] addIceCandidate(offer) failed", e);
                });
            }
          });
        }
      );

      setIsInCall(true);
    } catch (err) {
      console.error("[VoiceCall] answerCall error", err);
      Alert.alert("Answer failed", String(err));
      cleanup();
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // Hang up & cleanup
  // -------------------------------------
  const hangup = async () => {
    try {
      // remove call doc (optional)
      try {
        await setDoc(
          callDocRef.current!,
          { endedAt: new Date() },
          { merge: true }
        );
      } catch (e) {
        console.warn("set endedAt failed", e);
      }
    } catch (e) {
      console.warn("hangup set endedAt", e);
    }
    cleanup();
    nav.goBack();
  };

  const cleanup = () => {
    console.log("[VoiceCall] cleanup");
    try {
      unsubCallSnapshot.current && unsubCallSnapshot.current();
      unsubOfferCandidates.current && unsubOfferCandidates.current();
      unsubAnswerCandidates.current && unsubAnswerCandidates.current();
    } catch (e) {
      console.warn("unsubscribe error", e);
    }

    // stop local tracks
    try {
      localStreamRef.current?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      localStreamRef.current = null;
    } catch (e) {}

    // close pc
    try {
      pcRef.current?.close();
    } catch (e) {}
    pcRef.current = null;
    remoteStreamRef.current = null;
    setIsCalling(false);
    setIsInCall(false);
    setIsMuted(false);
    setLoading(false);
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((m) => !m);
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{peer?.name ?? "Calling"}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={96} color="#fff" />
        <Text style={styles.peerName}>{peer?.name ?? "Unknown"}</Text>
        <Text style={styles.status}>
          {loading
            ? "Connecting…"
            : isInCall
            ? "In call"
            : isCalling
            ? "Calling…"
            : "Ready"}
        </Text>

        {isInCall ? (
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={toggleMute} style={styles.controlBtn}>
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={22}
                color="#fff"
              />
              <Text style={styles.controlText}>
                {isMuted ? "Unmute" : "Mute"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={hangup}
              style={[styles.controlBtn, { backgroundColor: "#FF5A5F" }]}
            >
              <Ionicons name="call" size={22} color="#fff" />
              <Text style={styles.controlText}>Hang up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={startCall}
              style={styles.callBtn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="call-outline" size={20} color="#fff" />
              )}
              <Text style={styles.callText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={answerCall}
              style={styles.callBtn}
              disabled={loading}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.callText}>Answer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default VoiceCallScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1040" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  iconBtn: { padding: 6 },
  title: { color: "#fff", fontWeight: "700", fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  peerName: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 8 },
  status: { color: "#d1cfff", marginTop: 6 },
  controlsRow: { flexDirection: "row", marginTop: 18, gap: 12 },
  controlBtn: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#333366",
    borderRadius: 12,
    minWidth: 110,
  },
  controlText: { color: "#fff", marginTop: 6, fontSize: 12 },
  callBtn: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    minWidth: 110,
  },
  callText: { color: "#fff", marginTop: 6, fontSize: 12 },
});
