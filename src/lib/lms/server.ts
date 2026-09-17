import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/types";
import type {
  LmsQuestion,
  LmsSkillLevel,
  LmsTest,
} from "@/lib/lms/types";
import {
  LEGACY_MODULE_SKILLS,
  MASTER_SKILLS,
  MODULE_SKILLS,
} from "@/lib/lms/types";

export type LmsActor = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AdminDb = Firestore;

/** Hardcoded super-admin (mirrors src/lib/auth-context.tsx). No users doc exists for this login. */
const HARDCODED_ADMIN_EMAIL = "sriadmin@ahs.com";

/** Resolve actorEmail -> users doc. All LMS API routes must call this first. */
export async function resolveActor(
  db: AdminDb,
  actorEmail: string
): Promise<LmsActor | null> {
  const email = String(actorEmail || "").toLowerCase().trim();
  if (!email) return null;
  // Hardcoded admin fallback: auth-context logs this user in without a users doc.
  if (email === HARDCODED_ADMIN_EMAIL) {
    return { id: "hardcoded-admin", name: "Admin User", email, role: "super-admin" };
  }
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

/** Deterministic hash for per-student shuffling (stable across resume). */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = hashSeed(seed) || 1;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Randomize question + option order for a student.
 * Deterministic per (testId + studentEmail) so resume is stable.
 * Answer keys are remapped to the shuffled option order.
 */
export function shuffleTestForStudent(
  test: LmsTest,
  studentEmail: string
): LmsTest {
  const seedBase = `${test.id}__${studentEmail.toLowerCase()}`;
  let questions = test.shuffleQuestions === false ? [...test.questions] : seededShuffle(test.questions, seedBase);
  questions = questions.map((q) => {
    if (test.shuffleOptions === false || !q.options || q.options.length < 2) return { ...q };
    const order = seededShuffle(q.options.map((_, i) => i), `${seedBase}__${q.id}`);
    const options = order.map((i) => q.options![i]);
    // Remap answer keys that reference option text (unchanged text still matches).
    return { ...q, options };
  });
  return { ...test, questions };
}

/** Skills developed by a module (supports both master + legacy ids). */
export function skillsForModule(moduleId: string): string[] {
  return MODULE_SKILLS[moduleId] || LEGACY_MODULE_SKILLS[moduleId] || [];
}

function levelForScore(scorePercent: number): LmsSkillLevel {
  if (scorePercent >= 85) return "ADVANCED";
  if (scorePercent >= 70) return "GOOD";
  if (scorePercent >= 60) return "DEVELOPING";
  return "BEGINNER";
}

const LEVEL_RANK: Record<LmsSkillLevel, number> = {
  NOT_STARTED: 0,
  BEGINNER: 1,
  DEVELOPING: 2,
  GOOD: 3,
  ADVANCED: 4,
};

/** Merge new skill evidence into existing levels (never downgrades). */
export function mergeSkillLevels(
  existing: Record<string, LmsSkillLevel> | undefined,
  skills: string[],
  scorePercent: number
): Record<string, LmsSkillLevel> {
  const next: Record<string, LmsSkillLevel> = { ...(existing || {}) };
  const level = levelForScore(scorePercent);
  for (const s of skills) {
    const cur = next[s] || "NOT_STARTED";
    if (LEVEL_RANK[level] > LEVEL_RANK[cur]) next[s] = level;
  }
  return next;
}

export function emptySkills(): Record<string, LmsSkillLevel> {
  const out: Record<string, LmsSkillLevel> = {};
  for (const s of MASTER_SKILLS) out[s] = "NOT_STARTED";
  return out;
}

/** Write a notification doc (matches notifications page shape). */
export async function notifyUser(
  db: AdminDb,
  input: {
    title: string;
    message: string;
    type?: string;
    targetEmail?: string;
    courseId?: string;
  }
): Promise<void> {
  try {
    const id = `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).set({
      id,
      title: input.title,
      message: input.message,
      type: input.type || "assignment",
      read: false,
      targetEmail: input.targetEmail || "",
      courseId: input.courseId || "",
      createdAt: serverTimestamp(),
    });
  } catch {
    // Notifications are best-effort; never fail the primary operation.
  }
}

export type AuditAction =
  | "COURSE_CREATED"
  | "COURSE_UPDATED"
  | "STUDENT_ENROLLED"
  | "TEST_CREATED"
  | "TEST_UPDATED"
  | "TEST_STARTED"
  | "TEST_SUBMITTED"
  | "MARKS_UPDATED"
  | "FEEDBACK_ADDED"
  | "TEST_ATTEMPT_RESET"
  | "CERTIFICATE_ISSUED";

/** Append an audit log entry (master AUDIT LOG spec). */
export async function auditLog(
  db: AdminDb,
  input: {
    actorId: string;
    actorRole: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.collection(COLLECTIONS.ACTIVITY_LOG).doc(id).set({
      id,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      timestamp: serverTimestamp(),
      metadata: input.metadata || {},
    });
  } catch {
    // Audit is best-effort; never fail the primary operation.
  }
}
