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
  deletedAt?: any | null;
};

// Upload ảnh từ URI local lên Storage, tạo doc trong Firestore.
// Nếu opts.makeMain = true thì đặt làm ảnh chính ngay sau khi upload.
export async function uploadPhotoFromUri(
  uid: string,
  localUri: string,
  opts: { makeMain?: boolean; width?: number; height?: number } = {}
): Promise<PhotoDoc> {
  const id = uuidv4();
  const storagePath = `users/${uid}/photos/${id}.jpg`;
  const fileRef = ref(storage, storagePath);

  // 1) Đọc file và upload lên Storage
  const blob = await (await fetch(localUri)).blob();
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });

  // 2) Lấy downloadURL để hiển thị
  const url = await getDownloadURL(fileRef);

  // 3) Ghi doc ảnh vào Firestore (deletedAt = null để có thể query filter)
  const photo: PhotoDoc = {
    id,
    url,
    storagePath,
    width: opts.width ?? 0,
    height: opts.height ?? 0,
    isMain: !!opts.makeMain,
    order: Date.now(),
    uploadedAt: serverTimestamp(),
    deletedAt: null,
  };
  await setDoc(doc(db, "users", uid, "photos", id), photo);

  // 4) Nếu yêu cầu set main thì cập nhật main photo
  if (opts.makeMain) {
    await setMainPhoto(uid, id, url);
  }

  return photo;
}

// Đặt 1 ảnh làm "main": bỏ cờ main của ảnh cũ, cập nhật user.photoURL (kèm bust cache) + đồng bộ Auth.
export async function setMainPhoto(uid: string, photoId: string, url: string) {
  // Thêm tham số thời gian để bust cache hình ảnh trên client/CDN
  const bustUrl = url.includes("?")
    ? `${url}&t=${Date.now()}`
    : `${url}?t=${Date.now()}`;

  // 1) Tìm các ảnh đang là main để unset
  const photosCol = collection(db, "users", uid, "photos");
  const qMain = query(photosCol, where("isMain", "==", true));
  const snap = await getDocs(qMain);

  const batch = writeBatch(db);

  // 2) Unset tất cả ảnh main cũ (trừ ảnh đang set)
  snap.forEach((d) => {
    if (d.id !== photoId) {
      batch.set(d.ref, { isMain: false }, { merge: true });
    }
  });

  // 3) Set ảnh mới là main
  batch.set(
    doc(db, "users", uid, "photos", photoId),
    { isMain: true },
    { merge: true }
  );

  // 4) Cập nhật user: photoURL + mainPhotoId + updatedAt (để UI bust cache theo Firestore)
  batch.set(
    doc(db, "users", uid),
    { photoURL: bustUrl, mainPhotoId: photoId, updatedAt: serverTimestamp() },
    { merge: true }
  );

  await batch.commit();

  // 5) Đồng bộ Firebase Auth (để nơi nào còn dùng user.photoURL cũng cập nhật)
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await fbUpdateProfile(auth.currentUser, { photoURL: bustUrl });
    await auth.currentUser.reload(); // đảm bảo state Auth local được làm mới
  }
}

// HARD-DELETE: xóa file trên Storage + xóa hẳn doc ảnh trên Firestore.
// Nếu đang xóa ảnh main thì dọn user.mainPhotoId/photoURL và reload Auth.
export async function deletePhoto(
  uid: string,
  storagePath: string,
  photoId: string
) {
  // 1) Xóa file trên Storage (bỏ qua nếu không tồn tại)
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (e: any) {
    if (e?.code !== "storage/object-not-found") {
      throw e; // lỗi khác thì ném ra
    }
  }

  // 2) Xóa doc ảnh; nếu là ảnh main thì clear mainPhotoId + photoURL (chạy trong 1 batch)
  const userRef = doc(db, "users", uid);
  const photoRef = doc(db, "users", uid, "photos", photoId);
  const userSnap = await getDoc(userRef);
  const isMain = userSnap.exists() && userSnap.data()?.mainPhotoId === photoId;

  const batch = writeBatch(db);
  batch.delete(photoRef); // xóa hẳn doc ảnh

  if (isMain) {
    batch.set(
      userRef,
      { mainPhotoId: null, photoURL: null, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  await batch.commit();

  // 3) Nếu vừa xóa ảnh main, đồng bộ Auth về null và reload
  if (isMain && auth.currentUser && auth.currentUser.uid === uid) {
    await fbUpdateProfile(auth.currentUser, { photoURL: null });
    await auth.currentUser.reload();
  }
}
