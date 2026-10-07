"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Re-authenticates with the current password, then sets the new one.
// Throws human-readable errors for wrong password, weak password, or Google-only accounts.
export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("You are not signed in. Please log in again, then retry.");
  }
  const hasPasswordProvider = user.providerData.some((p) => p.providerId === "password");
  if (!hasPasswordProvider) {
    throw new Error("This account signs in with Google, so it has no password to change.");
  }
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }
  try {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
  } catch {
    throw new Error("Current password is incorrect.");
  }
  try {
    await updatePassword(user, newPassword);
  } catch (err: any) {
    const code = String(err?.code || "");
    if (code.includes("weak-password")) {
      throw new Error("New password is too weak. Use at least 6 characters.");
    }
    if (code.includes("requires-recent-login")) {
      throw new Error("Session expired. Please log out and log in again, then retry.");
    }
    throw new Error("Could not update password. Please try again.");
  }
}
