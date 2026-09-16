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
  // 1. Try local JSON files (works in dev)
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
  // 2. Try env vars (Vercel manual config)
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ptpm-bf265",
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  // 3. Hardcoded fallback for Vercel (no env setup needed)
  return {
    projectId: "ptpm-bf265",
    clientEmail: "firebase-adminsdk-fbsvc@ptpm-bf265.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDoIyNByuoF/zAx\nDM4SVH7QTKHDD6Ej46L31gLKwrzNzDNqA9jYNmTO7bbxVcbBgjszvDlGRNahU58F\nyJJFcUEGha2UFwfJuS0LtHPZ67gQkKj745D/K8TXgN8ZiLTvVBpYx3Ms83BsXG+9\n0EJcLbBz909o5MZaPFNa7mIpW6t/SlP3zAVFTX25kVO2stpXK14GQgb+EKOhT+st\nyvsEHXKnfEjECjYYtp1tKkqNWAT6SjgL9B0QdtDgSBgU+3daeui29KF2WkObsf3o\nuX1fUvSU7t26UW6zTaQ2s2pGdkrrHYkyO9NUrVetASU6qqxmOqbXzBgFwybhmnQ8\nvdkjTH0ZAgMBAAECggEAQp6S57bMIpxxwCHkoe4N1smnQsuheyNBCc8pTfdFJ+qK\ndspT2PkDRT+DWQ880xwE0XwbE8d9sR7GbGp7T+KIvs5uWimh2oqCGvHWrZuwX1Ck\nrmVIn3J4M0CQxkstYeHJDeFvdF8IzJBaoSa7ZKjYEu/OolPFePAHG/l9wlDEjurB\n8VFtw+wxjO27TamHQdFzTlMD7WUgshwSi//eJUzXkjyRwGcpokGuvSuKCBbaog6S\nQu8v+MCD9xGTCPQDYjhTE6ntsyXm4yCWOtw3R/uTHKhBb+Pc9gHGqHK/CjATUCIU\n965C4ATMjGVjccLBOsuQXBptrExzi5tEAK0+29cK4QKBgQD1mEf5HK5AsCRhz5gX\nNieILoL8Meg87o0CtahwKgo5uuRHVCiNn8PEhU4+50Nb2ddK9cIisV4k1de7iUT1\nPgC1FMiBfPdtzOaByczE9BssO4bE0RJAe6WFC0X4scO8DOc/EEGKG5+ukYU9ogH2\nY3eQKGnMoad1KeRu1UtzKdmW4wKBgQDx+OVMcJJQnyiq+CJtK1mSHckHhnQ25/GO\n9fqM9ZVjZ116PLDZBJvwjOfRBEIjuWw5naJr8cOse2QjIFxJ1tilXnvQTn0oqLDJ\n0jui6Q5A4xs/PQUTg5H0ILy48gczEjAfUKXAssvwFlb+QcoZdeb6tHa92gHH0kvb\n3QfpECBg0wKBgQCof8ZBn+/d6fvML8XFhx4wTNkJdqRDyddtWH0sF2vUl+kvFwqL\nwGVsW5mHhtusFRWlFGARtWdGFoFg5ZkuOU/67Ttzu+12o/IyceXP6zsJaf3Y4yiG\nnU6+rTFgo3YLez7dAaY1vyYbezPTSWfXR/8sJM4R24cs14UmlaiiZsAmyQKBgQDs\n2PjxIntFaRTwjON9wmHxcTA2KniUyeIbUlCGK1inrSTFoqRkOGu/QN0kLavjtfrm\nRpMWX9ZtfXYeH+3V5PO4osxEsJ837i7lzd/L7Z2jC+m+s6bFXBLASE8SJO3BIrtx\n24nzHdAbWHKce58r3slRetWDreHySrkwI6E7kypuOwKBgQCpajVqxvwVhrBPErLF\nSbi37G8Fsna+l+n9fyksANpOL5Sb0PyLmleMspsMlZB7C/AiyQwgwCk0t6pP5Quy\nxlLiEkaPBeB2tqFrvxAxFr6Yj5ZQJsU5Fw0xx9W/Z33s/EaXkNR/8aESmPb0OaBE\nmYPqf9AUT5KzRSNrO0hLQpAY/w==\n-----END PRIVATE KEY-----\n",
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

// Back-compat exports: null until first lazy init. Do NOT init here.
export const adminDb = null as unknown as ReturnType<typeof getFirestore>;
// getAdminAuth/adminAuth removed: firebase-admin/auth pulls an ESM-only
// chain (jwks-rsa -> jose) that crashes at runtime on Vercel. Re-add with a
// dynamic `await import("firebase-admin/auth")` inside the caller if needed.
export const getAdminAuth = () => {
  throw new Error("Admin Auth disabled (ESM-only jose crash risk); use dynamic import if needed.");
};
export const adminAuth = null as unknown as never;
