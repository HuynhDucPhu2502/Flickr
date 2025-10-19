import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  runTransaction,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";
import type { UserProfile } from "./userService";
import { ensure1to1Chat } from "./chatService";

/** Kiểu ứng viên hiển thị trên màn Home (rút gọn) */
export type Candidate = Pick<
  UserProfile,
  | "uid"
  | "displayName"
  | "photoURL"
  | "birthday"
  | "bio"
  | "occupation"
  | "gender"
> & { age?: number };

/** Tính tuổi từ chuỗi birthday YYYY-MM-DD */
function calcAge(birthday?: string | null): number | undefined {
  if (!birthday) return;
  const m = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return;
  const [_, y, mo, d] = m;
  const dob = new Date(Number(y), Number(mo) - 1, Number(d));
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasNotHadBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (hasNotHadBirthday) age -= 1;
  return age;
}

/** Lấy danh sách id đã swipe (phải/trái) của mình */
export async function getSwipedIds(uid: string): Promise<{
  right: Set<string>;
  left: Set<string>;
}> {
  const rightSnap = await getDocs(collection(db, "users", uid, "swipes_right"));
  const leftSnap = await getDocs(collection(db, "users", uid, "swipes_left"));
  const right = new Set<string>();
  const left = new Set<string>();
  rightSnap.forEach((d) => right.add(d.id));
  leftSnap.forEach((d) => left.add(d.id));
  return { right, left };
}

/**
 * Lấy danh sách ứng viên cho HomeScreen
 * - Ưu tiên updatedAt mới nhất
 * - Bỏ chính mình & những người đã swipe
 *
 * ⚠️ Cần index: users(onboarded Asc, updatedAt Desc)
 */
export async function fetchCandidates(
  myUid: string,
  take: number = 25
): Promise<Candidate[]> {
  console.log("🔥 [fetchCandidates] Start for:", myUid);
  try {
    const q = query(
      collection(db, "users"),
      where("onboarded", "==", true),
      orderBy("updatedAt", "desc"),
      limit(80)
    );
    const snap = await getDocs(q);
    console.log("📦 [fetchCandidates] Snap size:", snap.size);

    const { right, left } = await getSwipedIds(myUid);
    console.log(
      "📚 [fetchCandidates] Swiped right:",
      right.size,
      "left:",
      left.size
    );

    const out: Candidate[] = [];
    snap.forEach((d) => {
      const u = d.data() as UserProfile;
      if (u.uid === myUid) return; // bỏ chính mình
      if (right.has(u.uid) || left.has(u.uid)) return; // bỏ người đã swipe

      // Tính tuổi (nếu có)
      const age = calcAge(u.birthday ?? null);

      out.push({
        uid: u.uid,
        displayName: u.displayName ?? "User",
        photoURL: u.photoURL ?? null,
        birthday: u.birthday ?? null,
        bio: u.bio,
        occupation: u.occupation,
        gender: u.gender,
        age,
      });
    });

    console.log("✅ [fetchCandidates] Done, returning:", out.length);
    return out.slice(0, take);
  } catch (err) {
    console.error("❌ [fetchCandidates] Error:", err);
    throw err;
  }
}

/**
 * Swipe phải: ghi log + kiểm tra match
 * - Nếu mutual like → tạo matches/{matchId}
 * - Sau đó đảm bảo tạo chats/{uidA_uidB}
 */
export async function swipeRight(
  myUid: string,
  targetUid: string
): Promise<{ matched: boolean; matchId?: string }> {
  console.log("❤️ [swipeRight] start:", myUid, "→", targetUid);

  const myRightRef = doc(db, "users", myUid, "swipes_right", targetUid);
  const theyRightRef = doc(db, "users", targetUid, "swipes_right", myUid);

  const [a, b] = [myUid, targetUid].sort();
  const matchId = `${a}_${b}`;
  const matchRef = doc(db, "matches", matchId);

  try {
    const result = await runTransaction(db, async (tx) => {
      const [alreadySnap, theySnap, matchSnap] = await Promise.all([
        tx.get(myRightRef),
        tx.get(theyRightRef),
        tx.get(matchRef),
      ]);

      const alreadyExists = alreadySnap.exists();
      const theyLikedYou = theySnap.exists();

      console.log(
        "📄 [swipeRight] alreadyExists:",
        alreadyExists,
        "| theyLikedYou:",
        theyLikedYou
      );

      if (!alreadyExists) {
        tx.set(myRightRef, { createdAt: serverTimestamp() });
      }

      if (theyLikedYou && !matchSnap.exists()) {
        tx.set(matchRef, {
          users: [myUid, targetUid],
          createdAt: serverTimestamp(),
          lastMessageAt: null,
        });
        console.log("💞 [swipeRight] MATCH FOUND:", matchId);
        return { matched: true as const, matchId };
      }

      console.log("➡️ [swipeRight] No match yet, saved swipe_right.");
      return { matched: false as const };
    });

    if (result.matched) {
      await ensure1to1Chat(myUid, targetUid);
      console.log("💬 [swipeRight] Chat ensured for:", myUid, targetUid);
    }

    console.log("✅ [swipeRight] done:", result);
    return result;
  } catch (err) {
    console.error("❌ [swipeRight] error:", err);
    throw err;
  }
}

/** Swipe trái: chỉ lưu dấu để lần sau không hiện lại */
export async function swipeLeft(myUid: string, targetUid: string) {
  await setDoc(
    doc(db, "users", myUid, "swipes_left", targetUid),
    { createdAt: serverTimestamp() },
    { merge: true }
  );
}
