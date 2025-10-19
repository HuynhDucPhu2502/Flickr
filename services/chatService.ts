import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";

/** Stable 1–1 chatId from 2 uids (sorted) */
export function chatIdFor(u1: string, u2: string) {
  const [a, b] = [u1, u2].sort();
  const id = `${a}_${b}`;
  console.log("[chatService] chatIdFor:", { u1, u2, id });
  return id;
}

/**
 * Ensure a 1–1 thread exists (idempotent).
 * Cache members {displayName, photoURL} for fast list.
 */
export async function ensure1to1Chat(uidA: string, uidB: string) {
  const chatId = chatIdFor(uidA, uidB);
  console.log("[chatService] ensure1to1Chat: start", { uidA, uidB, chatId });

  const chatRef = doc(db, "chats", chatId);
  const userARef = doc(db, "users", uidA);
  const userBRef = doc(db, "users", uidB);

  await runTransaction(db, async (tx) => {
    const chatSnap = await tx.get(chatRef);
    if (chatSnap.exists()) {
      console.log("[chatService] ensure1to1Chat: already exists", chatId);
      return;
    }

    const [aSnap, bSnap] = await Promise.all([
      tx.get(userARef),
      tx.get(userBRef),
    ]);
    const a = aSnap.exists() ? aSnap.data() : {};
    const b = bSnap.exists() ? bSnap.data() : {};
    console.log("[chatService] ensure1to1Chat: members resolved", {
      A: { uidA, displayName: a.displayName, photoURL: a.photoURL },
      B: { uidB, displayName: b.displayName, photoURL: b.photoURL },
    });

    tx.set(chatRef, {
      participants: [uidA, uidB],
      members: {
        [uidA]: {
          displayName: a.displayName ?? "User",
          photoURL: a.photoURL ?? null,
        },
        [uidB]: {
          displayName: b.displayName ?? "User",
          photoURL: b.photoURL ?? null,
        },
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    });
    console.log("[chatService] ensure1to1Chat: created", chatId);
  });

  return chatId;
}

/** Send text + update chats/{chatId}.lastMessage (temp client-side) */
export async function sendTextMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  const trimmed = text.trim();
  console.log("[chatService] sendTextMessage: try", {
    chatId,
    senderId,
    text: trimmed,
  });
  if (!trimmed) {
    console.log("[chatService] sendTextMessage: skip empty");
    return;
  }

  const ref = await addDoc(collection(db, "chats", chatId, "messages"), {
    text: trimmed,
    senderId,
    createdAt: serverTimestamp(),
    type: "text",
  });
  console.log("[chatService] sendTextMessage: message added", { id: ref.id });

  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: { text: trimmed, senderId, createdAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  console.log("[chatService] sendTextMessage: lastMessage updated");
}
