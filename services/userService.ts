import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  signOut as fbSignOut,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { auth, db } from "../FirebaseConfig";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  roles: string[];
  onboarded: boolean;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;

  // extra fields
  username?: string | null;
  bio?: string;
  gender?:
    | "male"
    | "female"
    | "nonbinary"
    | "prefer_not_to_say"
    | "custom"
    | null;
  birthday?: string | null; // dùng sau cũng được
  interests?: string[];
  languages?: string[];
  occupation?: { title?: string; company?: string };
  education?: {
    level?: "high_school" | "bachelor" | "master" | "phd" | "other";
    school?: string;
  };
  location?: {
    city?: string;
    region?: string;
  };
  preferences?: {
    genders?: Array<"male" | "female" | "nonbinary">;
  };
};

function humanizeAuthError(err: any): string {
  const code = err?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "Email đã được sử dụng.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Tài khoản hoặc mật khẩu không đúng.";
    case "auth/too-many-requests":
      return "Bạn thao tác quá nhanh, thử lại sau.";
    default:
      return err?.message ?? "Có lỗi xác thực xảy ra.";
  }
}

function defaultProfile(
  u: User,
  extra?: Partial<UserProfile>
): Partial<UserProfile> {
  return {
    uid: u.uid,
    email: u.email ?? "",
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    roles: ["user"],
    onboarded: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    interests: [],
    languages: [],
    preferences: {
      genders: ["female", "male", "nonbinary"],
    },
    ...extra,
  };
}

async function upsertUserProfile(
  user: User,
  extra?: Partial<UserProfile>,
  opts?: { isNew?: boolean; touchLogin?: boolean }
) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const base: Partial<UserProfile> = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    updatedAt: serverTimestamp(),
    ...(opts?.touchLogin ? { lastLoginAt: serverTimestamp() } : {}),
    ...extra,
  };

  const payload = snap.exists() ? base : defaultProfile(user, base);
  await setDoc(ref, payload, { merge: true });
}

/* ============ USERNAME ============ */
function normalizeUsername(raw: string) {
  const u = raw.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,20}$/.test(u)) {
    throw new Error("Username 3–20 ký tự, a-z, 0-9, ., _, -");
  }
  return u;
}

export async function claimUsername(uid: string, rawUsername: string) {
  const username = normalizeUsername(rawUsername);
  const unameRef = doc(db, "usernames", username);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const taken = await tx.get(unameRef);
    if (taken.exists() && taken.data()?.uid !== uid) {
      throw new Error("Username đã tồn tại, hãy chọn tên khác.");
    }
    tx.set(unameRef, { uid, createdAt: serverTimestamp() });
    tx.set(
      userRef,
      { username, updatedAt: serverTimestamp() },
      { merge: true }
    );
  });

  return username;
}

/* ============ PUBLIC API ============ */

export async function registerWithEmailAndName(
  name: string,
  email: string,
  password: string,
  options?: { username?: string | null } // hỗ trợ tham số thứ 4
) {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

    if (name?.trim()) {
      await fbUpdateProfile(cred.user, { displayName: name.trim() });
    }

    if (options?.username && options.username.trim()) {
      await claimUsername(cred.user.uid, options.username);
    }

    await upsertUserProfile(
      cred.user,
      {
        displayName: name?.trim() || cred.user.displayName || null,
        username: options?.username?.trim()?.toLowerCase?.() ?? null,
      },
      { isNew: true, touchLogin: true }
    );
    return cred.user;
  } catch (err) {
    throw new Error(humanizeAuthError(err));
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    await upsertUserProfile(cred.user, undefined, { touchLogin: true });
    return cred.user;
  } catch (err) {
    throw new Error(humanizeAuthError(err));
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

export function subscribeAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateProfileFields(
  uid: string,
  patch: Partial<UserProfile>
) {
  const ref = doc(db, "users", uid);
  const clean = stripUndefinedDeep(patch);
  await setDoc(
    ref,
    { ...clean, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ============ HELPER ============ */
function stripUndefinedDeep<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .filter((v) => v !== undefined)
      .map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const out: any = {};
    Object.entries(input as any).forEach(([k, v]) => {
      if (v === undefined) return; // bỏ undefined
      out[k] = stripUndefinedDeep(v as any);
    });
    return out;
  }
  return input;
}
