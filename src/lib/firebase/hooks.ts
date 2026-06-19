"use client";

import { useState, useEffect, useCallback } from "react";
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
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

export function useFirestoreQuery(
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  const [data, setData] = useState<(DocumentData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(result);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, ...constraints]);

  return { data, loading, error };
}

export function useFirestoreDoc(collectionName: string, docId: string | null) {
  const [data, setData] = useState<(DocumentData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

export function useFirestoreActions(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitize = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(sanitize).filter(v => v !== undefined);
    if (obj !== null && typeof obj === "object") {
      const clean: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) clean[k] = sanitize(v);
      }
      return clean;
    }
    return obj;
  };

  const add = useCallback(
    async (data: DocumentData) => {
      setLoading(true);
      setError(null);
      try {
        const clean = sanitize(data);
        const docRef = await addDoc(collection(db, collectionName), {
          ...clean,
          createdAt: new Date(),
        });
        setLoading(false);
        return docRef.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
        throw err;
      }
    },
    [collectionName]
  );

  const update = useCallback(
    async (id: string, data: Partial<DocumentData>) => {
      setLoading(true);
      setError(null);
      try {
        const clean = sanitize(data);
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, clean);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
        throw err;
      }
    },
    [collectionName]
  );

  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
        throw err;
      }
    },
    [collectionName]
  );

  return { add, update, remove, loading, error };
}

export { collection, doc, where, orderBy, getDocs, getDoc };
