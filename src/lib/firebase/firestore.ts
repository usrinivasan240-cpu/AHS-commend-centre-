import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

export async function firestoreGetAll(collectionName: string, ...constraints: QueryConstraint[]) {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function firestoreGetById(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function firestoreAdd(collectionName: string, data: DocumentData) {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
}

export async function firestoreUpdate(collectionName: string, id: string, data: Partial<DocumentData>) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
}

export async function firestoreDelete(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

export async function firestoreQuery(collectionName: string, ...constraints: QueryConstraint[]) {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export function firestoreSubscribe(
  collectionName: string,
  callback: (data: { id: string; [key: string]: unknown }[]) => void,
  ...constraints: QueryConstraint[]
) {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data as { id: string; [key: string]: unknown }[]);
  });
}

export { collection, doc, where, orderBy, limit, writeBatch };
