// services/swipe.ts
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
import type { UserProfile } from "./auth";

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

/** Lấy danh sách id đã swipe */
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

/** Lấy danh sách ứng viên cho HomeScreen */
export async function fetchCandidates(
  myUid: string,
  prefs?: UserProfile["preferences"],
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
      if (u.uid === myUid) return;
      if (right.has(u.uid) || left.has(u.uid)) return;
      out.push({
        uid: u.uid,
        displayName: u.displayName ?? "User",
        photoURL: u.photoURL ?? null,
        birthday: u.birthday ?? null,
        bio: u.bio,
        occupation: u.occupation,
        gender: u.gender,
        age: undefined,
      });
    });

    console.log("✅ [fetchCandidates] Done, returning:", out.length);
    return out.slice(0, take);
  } catch (err) {
    console.error("❌ [fetchCandidates] Lỗi:", err);
    throw err;
  }
}

/** Swipe phải: ghi log + kiểm tra match */
export async function swipeRight(
  myUid: string,
  targetUid: string
): Promise<{ matched: boolean; matchId?: string }> {
  console.log("❤️ [swipeRight] start:", myUid, "→", targetUid);

  const myRightRef = doc(db, "users", myUid, "swipes_right", targetUid);
  const theyRightRef = doc(db, "users", targetUid, "swipes_right", myUid);

  // matchId có thể tính luôn, không phụ thuộc nhánh
  const [a, b] = [myUid, targetUid].sort();
  const matchId = `${a}_${b}`;
  const matchRef = doc(db, "matches", matchId);

  try {
    const result = await runTransaction(db, async (tx) => {
      // ✅ 1) ĐỌC TẤT CẢ trước
      const [alreadySnap, theySnap, matchSnap] = await Promise.all([
        tx.get(myRightRef),
        tx.get(theyRightRef),
        tx.get(matchRef), // đọc luôn, dù có thể không cần ghi
      ]);

      const alreadyExists = alreadySnap.exists();
      const theyLikedYou = theySnap.exists();

      console.log(
        "📄 [swipeRight] alreadyExists:",
        alreadyExists,
        "| theyLikedYou:",
        theyLikedYou
      );

      // ✅ 2) SAU KHI đã đọc hết → mới bắt đầu GHI
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

    console.log("✅ [swipeRight] done:", result);
    return result;
  } catch (err) {
    console.error("❌ [swipeRight] error:", err);
    throw err;
  }
}

/** Swipe trái: chỉ lưu dấu */
export async function swipeLeft(myUid: string, targetUid: string) {
  const ref = doc(db, "users", myUid, "swipes_left", targetUid);
  await setDoc(ref, { createdAt: serverTimestamp() }, { merge: true });
}
