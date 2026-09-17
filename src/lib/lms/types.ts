export type LmsStatus = "draft" | "published";

export type LmsCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  track: string;
  order: number;
  status: LmsStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LmsModule = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description: string;
  status: LmsStatus;
  createdAt: string;
  updatedAt: string;
};

export type LmsLesson = {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  order: number;
  body: string;
  videoUrl?: string;
  resources?: { label: string; url: string }[];
  estimatedMinutes: number;
  status: LmsStatus;
  createdAt: string;
  updatedAt: string;
};

export type LmsPractice = {
  id: string;
  courseId: string;
  moduleId: string;
  lessonId?: string;
  title: string;
  prompt: string;
  starterCode?: string;
  language?: string;
  order: number;
  status: LmsStatus;
  createdAt: string;
  updatedAt: string;
};

export type LmsHandson = {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  brief: string;
  checklist: string[];
  order: number;
  status: LmsStatus;
  createdAt: string;
  updatedAt: string;
};

export type LmsQuestionKind = "mcq" | "msq" | "short" | "code";

export type LmsQuestion = {
  id: string;
  kind: LmsQuestionKind;
  prompt: string;
  options?: string[];
  /** Server-only. Never sent to student clients. */
  answerKeys?: string[];
  points: number;
};

export type LmsTest = {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  mode: "practice" | "exam";
  timeLimitMinutes: number;
  passPercent: number;
  order: number;
  status: LmsStatus;
  questions: LmsQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type LmsAttemptStatus = "in_progress" | "submitted" | "scored";

export type LmsAttempt = {
  id: string;
  testId: string;
  courseId: string;
  studentEmail: string;
  status: LmsAttemptStatus;
  answers: Record<string, string[]>;
  scorePercent?: number;
  needsReview?: boolean;
  startedAt: string;
  submittedAt?: string;
  scoredAt?: string;
  updatedAt: string;
};

export type LmsEventKind =
  | "start"
  | "heartbeat"
  | "focus"
  | "blur"
  | "copy"
  | "paste"
  | "tab"
  | "nav"
  | "submit";

export type LmsEvent = {
  id: string;
  attemptId?: string;
  actorEmail: string;
  kind: LmsEventKind;
  at: string;
  meta?: Record<string, string>;
};

export type LmsSubmission = {
  id: string;
  courseId: string;
  practiceId?: string;
  handsonId?: string;
  studentEmail: string;
  content: string;
  language?: string;
  status: "submitted" | "reviewed";
  feedback?: string;
  score?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  updatedAt: string;
};

export type LmsProgress = {
  id: string;
  courseId: string;
  studentEmail: string;
  completedLessonIds: string[];
  percentComplete: number;
  updatedAt: string;
};

export const LMS_ACTOR_ROLES = [
  "super-admin",
  "trainer",
  "student",
] as const;

export type LmsActorRole = (typeof LMS_ACTOR_ROLES)[number];
