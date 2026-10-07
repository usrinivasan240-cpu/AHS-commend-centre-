import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// NOTE: firebase-admin/auth is intentionally NOT imported here.
// It pulls jwks-rsa -> jose (ESM-only), which crashes at runtime under
// Next.js/Vercel with: "require() of ES Module jose/dist/webapi/index.js
// not supported". No route uses Admin Auth today (Firestore only).
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let adminApp: App;

function getServiceAccount() {
  // 1. Try local JSON files (dev only — never commit these files).
  // Set FIREBASE_ADMIN_KEY_PATH to override the default lookup.
  const candidates = [
    process.env.FIREBASE_ADMIN_KEY_PATH || "",
    join(process.cwd(), "serviceAccountKey.json"),
    join(process.cwd(), "firebase-adminsdk.json"),
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        const parsed = JSON.parse(readFileSync(p, "utf-8"));
        if (parsed.private_key && parsed.client_email) return parsed;
      }
    } catch {}
  }
  // 2. Try env vars (required in production / Vercel).
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    // Normalize: dashboard pastes commonly arrive with surrounding quotes,
    // literal \n sequences (sometimes double-escaped), or stray whitespace.
    let key = String(process.env.FIREBASE_ADMIN_PRIVATE_KEY).trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1).trim();
    }
    let prev = "";
    while (prev !== key) {
      prev = key;
      // One or more backslashes + n -> newline (covers \n, \\n, \\\n ...).
      // PEM/base64 never contains a literal backslash, so any backslash
      // present is an escaping artifact: strip leftovers entirely.
      key = key.replace(/\\+n/g, "\n").replace(/\\/g, "");
    }
    if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
      throw new Error(
        "FIREBASE_ADMIN_PRIVATE_KEY is malformed (missing PEM header). Re-copy the full private_key from serviceAccountKey.json."
      );
    }
    return {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL.trim(),
      private_key: key,
    };
  }
  // 3. Fail closed — never fall back to an embedded key.
  // The previous version shipped a hardcoded private_key in source control.
  // That key must be treated as compromised: revoke it in
  // Firebase Console → Project Settings → Service Accounts, then set env vars above.
  throw new Error(
    "Firebase Admin credentials missing. Set FIREBASE_ADMIN_PRIVATE_KEY + FIREBASE_ADMIN_CLIENT_EMAIL (+FIREBASE_ADMIN_PROJECT_ID), or provide serviceAccountKey.json locally (dev only, gitignored)."
  );
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = getServiceAccount();
  adminApp = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  });
  return adminApp;
}

// NOTE: fully lazy - NEVER init at import time (Vercel has no service JSON,
// only env vars). Importing this module must never throw.
export const getAdminDb = () => getFirestore(getAdminApp());

// Back-compat exports: null until first lazy init. Do NOT init here.
export const adminDb = null as unknown as ReturnType<typeof getFirestore>;
// getAdminAuth/adminAuth removed: firebase-admin/auth pulls an ESM-only
// chain (jwks-rsa -> jose) that crashes at runtime on Vercel. Re-add with a
// dynamic `await import("firebase-admin/auth")` inside the caller if needed.
export const getAdminAuth = () => {
  throw new Error("Admin Auth disabled (ESM-only jose crash risk); use dynamic import if needed.");
};
export const adminAuth = null as unknown as never;
