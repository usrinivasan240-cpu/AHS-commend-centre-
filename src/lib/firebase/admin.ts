import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let adminApp: App;

function getServiceAccount() {
  // Try multiple file locations in order
  const candidates = [
    join(process.cwd(), "ptpm-bf265-firebase-adminsdk-fbsvc-864612a126.json"),
    join(process.cwd(), "web token .json"),
    join(process.cwd(), "serviceAccountKey.json"),
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8"));
    } catch {}
  }
  // Fallback to env vars (for Vercel)
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ptpm-bf265",
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@ptpm-bf265.iam.gserviceaccount.com",
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
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
export const getAdminAuth = () => getAuth(getAdminApp());

// Back-compat exports: null until first lazy init. Do NOT init here.
export const adminDb = null as unknown as ReturnType<typeof getFirestore>;
export const adminAuth = null as unknown as ReturnType<typeof getAuth>;
