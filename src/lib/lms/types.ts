export type LmsStatus = "draft" | "published";

export type LmsCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  track: string;
  level?: string;
  learningStyle?: string;
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
  isCapstone?: boolean;
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
  topics: string[];
  videoUrl?: string;
  resources?: { label: string; url: string }[];
  estimatedMinutes: number;
  status: LmsStatus;
  createdAt: string;
  updatedAt: string;
};

export type LmsSubmissionType = "TEXT" | "FILE" | "LINK" | "CODE" | "QUIZ";

export type LmsPractice = {
  id: string;
  courseId: string;
  moduleId: string;
  lessonId?: string;
  title: string;
  prompt: string;
  starterCode?: string;
  language?: string;
  submissionType: LmsSubmissionType;
  maxMarks: number;
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
  deliverables: string[];
  maxMarks: number;
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

export type LmsStrictConfig = {
  fullscreen: boolean;
  tabMonitoring: boolean;
  focusMonitoring: boolean;
  activityLogging: boolean;
  confirmSubmission: boolean;
};

export const DEFAULT_STRICT: LmsStrictConfig = {
  fullscreen: true,
  tabMonitoring: true,
  focusMonitoring: true,
  activityLogging: true,
  confirmSubmission: true,
};

export type LmsTest = {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  mode: "practice" | "exam";
  timeLimitMinutes: number;
  passPercent: number;
  /** Configured total questions (bank may grow toward this via admin edits). */
  questionCount: number;
  /** Max submitted attempts. Default 1. */
  maxAttempts: number;
  strict: LmsStrictConfig;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
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
  /** Server-side deadline. Frontend timers are advisory only. */
  expiresAt: string;
  timeExpired?: boolean;
  submittedAt?: string;
  scoredAt?: string;
  durationSeconds?: number;
  activitySummary?: Record<string, number>;
  updatedAt: string;
};

/** Lowercase kinds are legacy; uppercase kinds match the master TEST SECURITY spec. */
export type LmsEventKind =
  | "start"
  | "heartbeat"
  | "focus"
  | "blur"
  | "copy"
  | "paste"
  | "tab"
  | "nav"
  | "submit"
  | "TEST_STARTED"
  | "TEST_SUBMITTED"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_ENTER"
  | "FULLSCREEN_EXIT"
  | "BACK_ATTEMPT"
  | "EXIT_ATTEMPT"
  | "TIME_WARNING"
  | "TIME_EXPIRED"
  | "SUBMISSION_CONFIRMED";

export type LmsEvent = {
  id: string;
  attemptId?: string;
  studentId?: string;
  testId?: string;
  actorEmail: string;
  kind: LmsEventKind;
  at: string;
  timestamp?: string;
  durationSeconds?: number;
  meta?: Record<string, string>;
};

export type LmsSubmissionStatus =
  | "submitted"
  | "under_review"
  | "reviewed"
  | "resubmit_required";

export type LmsSubmission = {
  id: string;
  courseId: string;
  practiceId?: string;
  handsonId?: string;
  studentEmail: string;
  content: string;
  submissionType?: LmsSubmissionType;
  githubUrl?: string;
  liveUrl?: string;
  language?: string;
  status: LmsSubmissionStatus | "submitted" | "reviewed";
  feedback?: string;
  score?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  updatedAt: string;
};

export type LmsCourseStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PASSED"
  | "FAILED"
  | "RESUBMIT_REQUIRED";

export type LmsSkillLevel =
  | "NOT_STARTED"
  | "BEGINNER"
  | "DEVELOPING"
  | "GOOD"
  | "ADVANCED";

export const MASTER_SKILLS = [
  "Generative AI",
  "Prompt Engineering",
  "AI API Integration",
  "Frontend Development",
  "JavaScript",
  "Firebase",
  "Authentication",
  "Firestore",
  "Git/GitHub",
  "Deployment",
  "Debugging",
] as const;

/** Which skills each module develops (drives automatic skill tracking). */
export const MODULE_SKILLS: Record<string, string[]> = {
  "AHS-AI-M01": ["Generative AI"],
  "AHS-AI-M02": ["Generative AI"],
  "AHS-AI-M03": ["Prompt Engineering", "Generative AI"],
  "AHS-AI-M04": ["Prompt Engineering", "JavaScript"],
  "AHS-AI-M05": ["AI API Integration", "Frontend Development", "JavaScript"],
  "AHS-AI-M06": ["Frontend Development", "JavaScript"],
  "AHS-AI-M07": ["Git/GitHub"],
  "AHS-AI-M08": ["Firebase", "Authentication", "Firestore"],
  "AHS-AI-M09": ["Deployment"],
  "AHS-AI-M10": ["Debugging", "JavaScript"],
  "AHS-AI-M11": [
    "Generative AI",
    "Prompt Engineering",
    "AI API Integration",
    "Frontend Development",
    "Firebase",
    "Git/GitHub",
    "Deployment",
  ],
};

/** Legacy module ids (previous seed) mapped to the same skill sets. */
export const LEGACY_MODULE_SKILLS: Record<string, string[]> = {
  m01: ["Generative AI"],
  m02: ["Prompt Engineering"],
  m03: ["AI API Integration"],
  m04: ["Generative AI"],
  m05: ["AI API Integration"],
  m06: ["Frontend Development", "JavaScript"],
  m07: ["Firebase", "Authentication", "Firestore"],
  m08: ["Generative AI"],
  m09: ["Deployment", "Debugging"],
  m10: ["Generative AI", "AI API Integration", "Deployment"],
};

export type LmsProgress = {
  id: string;
  courseId: string;
  studentEmail: string;
  enrolledAt?: string;
  status?: LmsCourseStatus;
  currentModuleId?: string;
  completedLessonIds: string[];
  completedPracticeIds?: string[];
  completedHandsonIds?: string[];
  passedTestIds?: string[];
  capstoneProgress?: number;
  skills?: Record<string, LmsSkillLevel>;
  percentComplete: number;
  updatedAt: string;
};

export type LmsProjectStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PASSED"
  | "RESUBMIT_REQUIRED";

export type LmsProject = {
  id: string;
  courseId: string;
  moduleId: string;
  studentEmail: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  screenshots?: string[];
  status: LmsProjectStatus;
  marks?: number;
  feedback?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
  updatedAt: string;
};

export type LmsCertificateStatus = "NOT_ELIGIBLE" | "ELIGIBLE" | "ISSUED";

export type LmsCertificate = {
  id: string;
  courseId: string;
  studentEmail: string;
  status: LmsCertificateStatus;
  issuedAt?: string;
  issuedBy?: string;
  criteria?: Record<string, boolean>;
  updatedAt: string;
};

export const LMS_ACTOR_ROLES = [
  "super-admin",
  "trainer",
  "student",
] as const;

export type LmsActorRole = (typeof LMS_ACTOR_ROLES)[number];
