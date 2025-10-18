// services/profilePhoto.ts
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { updateProfile as fbUpdateProfile } from "firebase/auth";
import { db, storage, auth } from "../FirebaseConfig";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export type PhotoDoc = {
  id: string;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  isMain: boolean;
  order: number;
  uploadedAt: any;
  deletedAt?: any;
};

export async function uploadPhotoFromUri(
  uid: string,
  localUri: string,
  opts: { makeMain?: boolean; width?: number; height?: number } = {}
): Promise<PhotoDoc> {
  const id = uuidv4();
  const storagePath = `users/${uid}/photos/${id}.jpg`;
  const fileRef = ref(storage, storagePath);

  const blob = await (await fetch(localUri)).blob();
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(fileRef);

  const photo: PhotoDoc = {
    id,
    url,
    storagePath,
    width: opts.width ?? 0,
    height: opts.height ?? 0,
    isMain: !!opts.makeMain,
    order: Date.now(),
    uploadedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid, "photos", id), photo);
  if (opts.makeMain) await setMainPhoto(uid, id, url);
  return photo;
}

// Đồng bộ Firestore + Auth user + dọn isMain cũ + bust cache
export async function setMainPhoto(uid: string, photoId: string, url: string) {
  const bustUrl = url.includes("?")
    ? `${url}&t=${Date.now()}`
    : `${url}?t=${Date.now()}`;

  // Unset tất cả ảnh main cũ (nếu có)
  const photosCol = collection(db, "users", uid, "photos");
  const q = query(photosCol, where("isMain", "==", true));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.forEach((d) => {
    if (d.id !== photoId) {
      batch.set(d.ref, { isMain: false }, { merge: true });
    }
  });

  // Set ảnh mới là main + cập nhật user
  batch.set(
    doc(db, "users", uid, "photos", photoId),
    { isMain: true },
    { merge: true }
  );
  batch.set(
    doc(db, "users", uid),
    { photoURL: bustUrl, mainPhotoId: photoId, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();

  // Đồng bộ Auth user để user?.photoURL cũng đổi (ProfileHomeScreen dùng cả 2 nguồn)
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await fbUpdateProfile(auth.currentUser, { photoURL: bustUrl });
  }
}

export async function deletePhoto(
  uid: string,
  storagePath: string,
  photoId: string
) {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (e: any) {
    if (e?.code !== "storage/object-not-found") {
      throw e;
    }
  }

  await setDoc(
    doc(db, "users", uid, "photos", photoId),
    { deletedAt: serverTimestamp(), isMain: false },
    { merge: true }
  );

  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists() && userSnap.data()?.mainPhotoId === photoId) {
    await setDoc(
      doc(db, "users", uid),
      { mainPhotoId: null, photoURL: null, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // Đồng bộ Auth user nếu đang dùng ảnh vừa xóa
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await fbUpdateProfile(auth.currentUser, { photoURL: null });
    }
  }
}
