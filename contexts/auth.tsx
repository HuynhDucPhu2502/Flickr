// contexts/auth.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../FirebaseConfig";
import {
  UserProfile,
  registerWithEmailAndName,
  loginWithEmail,
  signOut as signOutSvc,
} from "../services/auth";

type AuthContextType = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProf: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      // Hủy sub profile cũ nếu có
      if (unsubProf) {
        unsubProf();
        unsubProf = null;
      }

      setUser(u);
      setProfile(null);

      if (!u) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const ref = doc(db, "users", u.uid);
      unsubProf = onSnapshot(
        ref,
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubAuth();
      if (unsubProf) unsubProf();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      login: async (email, password) => {
        await loginWithEmail(email, password);
      },
      register: async (username, email, password) => {
        // giữ nguyên logic cũ: dùng "username" làm displayName ban đầu + claim username
        await registerWithEmailAndName(username, email, password, { username });
      },
      logout: async () => {
        await signOutSvc();
      },
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
