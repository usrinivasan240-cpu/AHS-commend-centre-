import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const REQUIRED_PUBLIC_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

// Client Firebase config must come from env. Never hardcode credentials
// as fallbacks, which prevents key rotation.
// We warn (never throw at import) so `next build` / static collection without
// env vars still succeeds; API routes and auth fail visibly at runtime until
// env vars are set. Rotate keys by setting NEXT_PUBLIC_* in Vercel / .env.local.
function readPublicConfig() {
  const missing = REQUIRED_PUBLIC_KEYS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `[firebase/config] Missing ${missing.join(", ")} — using placeholder config. Set env vars in .env.local / Vercel.`
    );
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "MISSING_API_KEY_ROTATE_ME",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "missing.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "missing",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

const firebaseConfig = readPublicConfig();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
