import type { NextRequest } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/types";

export interface ApiActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

type AdminDb = Firestore;

/**
 * Central server-side auth helper.
 * All /api/* routes (except public webhook/unsubscribe with secrets) must call
 * requireActor() first. The client sends its Firebase Auth email in
 * `x-actor-email` (or `actorEmail` in body/query for backwards compat).
 * We resolve it against the `users` collection via AdminSDK and enforce roles.
 */

function superAdminEmails(): string[] {
  const raw =
    process.env.SUPER_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL ||
    "";
  return raw
    .split(",")
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);
}

export async function resolveApiActor(db: AdminDb, rawEmail: string): Promise<ApiActor | null> {
  const email = String(rawEmail || "").toLowerCase().trim();
  if (!email) return null;
  if (superAdminEmails().includes(email)) {
    return { id: "env-admin", name: "Admin User", email, role: "super-admin" };
  }
  const snap = await db.collection(COLLECTIONS.USERS).where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as Record<string, unknown>;
  if (String(data.status || "active") !== "active") return null;
  return {
    id: doc.id,
    name: String(data.name || email),
    email: String(data.email || email),
    role: String(data.role || ""),
  };
}

export function getActorEmailFromRequest(req: NextRequest, body?: Record<string, unknown>): string {
  const header = req.headers.get("x-actor-email") || "";
  if (header) return header;
  if (body && typeof body.actorEmail === "string" && body.actorEmail) return body.actorEmail;
  const qp = req.nextUrl.searchParams.get("actorEmail") || req.nextUrl.searchParams.get("actor_email") || "";
  return qp;
}

export async function requireActor(
  req: NextRequest,
  db: AdminDb,
  allowedRoles: string[],
  body?: Record<string, unknown>
): Promise<ApiActor> {
  const email = getActorEmailFromRequest(req, body);
  const actor = await resolveApiActor(db, email);
  if (!actor) {
    throw Object.assign(new Error("Unauthorized: unknown or missing actor. Send x-actor-email of an active users doc."), {
      status: 401,
    });
  }
  if (!allowedRoles.includes(actor.role)) {
    throw Object.assign(
      new Error(`Forbidden: role '${actor.role}' cannot perform this action`),
      { status: 403 }
    );
  }
  return actor;
}

export function actorErrorResponse(err: unknown) {
  const anyErr = err as { message?: string; status?: number };
  const msg = anyErr?.message || "Unauthorized";
  const status =
    anyErr?.status || (/Forbidden/.test(msg) ? 403 : /Unauthorized/.test(msg) ? 401 : 500);
  return { msg, status };
}
