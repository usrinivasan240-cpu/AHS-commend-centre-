import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/types";
import type { LmsQuestion, LmsTest } from "@/lib/lms/types";

export type LmsActor = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AdminDb = Firestore;

/** Resolve actorEmail -> users doc. All LMS API routes must call this first. */
export async function resolveActor(
  db: AdminDb,
  actorEmail: string
): Promise<LmsActor | null> {
  const email = String(actorEmail || "").toLowerCase().trim();
  if (!email) return null;
  const snap = await db
    .collection(COLLECTIONS.USERS)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as Record<string, string>;
  return {
    id: doc.id,
    name: data.name || email,
    email: data.email || email,
    role: data.role || "",
  };
}

export function requireLmsRoles(actor: LmsActor | null, roles: string[]): LmsActor {
  if (!actor) throw new Error("Unauthorized: unknown actor");
  if (!roles.includes(actor.role)) {
    throw new Error(`Forbidden: role '${actor.role}' cannot perform this action`);
  }
  return actor;
}

export function isPrivilegedRole(role: string): boolean {
  return role === "super-admin" || role === "trainer";
}

/** Strip answer keys before sending a test to a student client. */
export function stripTestForStudent(test: LmsTest): Omit<LmsTest, "questions"> & { questions: Omit<LmsQuestion, "answerKeys">[] } {
  return {
    ...test,
    questions: test.questions.map((q) => {
      const { answerKeys: _removed, ...rest } = q;
      return rest;
    }),
  };
}

function normalizeShort(value: string): string {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, " ");
}

/** Server-side scoring. Code questions always need manual review. */
export function scoreAttempt(
  questions: LmsQuestion[],
  answers: Record<string, string[]>
): { scorePercent: number; needsReview: boolean; earned: number; total: number } {
  let earned = 0;
  let total = 0;
  let needsReview = false;
  for (const q of questions) {
    total += q.points;
    const given = answers[q.id] || [];
    if (q.kind === "code") {
      needsReview = true;
      continue;
    }
    const keys = q.answerKeys || [];
    if (q.kind === "mcq" || q.kind === "short") {
      const g = q.kind === "short" ? given.map(normalizeShort) : given;
      const k = q.kind === "short" ? keys.map(normalizeShort) : keys;
      if (g.length === 1 && k.includes(g[0])) earned += q.points;
    } else if (q.kind === "msq") {
      const gSet = new Set(given);
      const kSet = new Set(keys);
      if (gSet.size === kSet.size && [...gSet].every((v) => kSet.has(v))) {
        earned += q.points;
      }
    }
  }
  const scorePercent = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { scorePercent, needsReview, earned, total };
}

export function computePercentComplete(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}
