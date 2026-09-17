export const COLLECTIONS = {
  USERS: "users",
  TEAMS: "teams",
  PROJECTS: "projects",
  TASKS: "tasks",
  COURSES: "courses",
  ASSESSMENTS: "assessments",
  ASSESSMENT_RESULTS: "assessment_results",
  LEADS: "leads",
  CLIENTS: "clients",
  MEETINGS: "meetings",
  INVOICES: "invoices",
  QUOTATIONS: "quotations",
  NOTIFICATIONS: "notifications",
  ACTIVITY_LOG: "activity_log",
  LMS_COURSES: "lms_courses",
  LMS_MODULES: "lms_modules",
  LMS_LESSONS: "lms_lessons",
  LMS_PRACTICES: "lms_practices",
  LMS_HANDSONS: "lms_handsons",
  LMS_TESTS: "lms_tests",
  LMS_ATTEMPTS: "lms_attempts",
  LMS_EVENTS: "lms_events",
  LMS_SUBMISSIONS: "lms_submissions",
  LMS_PROGRESS: "lms_progress",
  LMS_PROJECTS: "lms_projects",
  LMS_CERTIFICATES: "lms_certificates",
} as const;

export type FirestoreUser = {
  id: string;
  name: string;
  email: string;
  role: "super-admin" | "core-admin" | "team-lead" | "developer" | "intern" | "trainee" | "client" | "marketing" | "trainer" | "student";
  team?: string;
  avatar?: string;
  status: "active" | "inactive" | "pending";
  performanceScore: number;
  joinDate: string;
  skills: string[];
  phone?: string;
  password?: string;
  createdAt?: Date;
};

export type FirestoreTeam = {
  id: string;
  name: string;
  leadId: string;
  memberCount: number;
  projectCount: number;
  performance: number;
};

export type FirestoreProject = {
  id: string;
  name: string;
  description: string;
  status: "new" | "in-progress" | "review" | "testing" | "completed" | "delayed" | "on-hold";
  priority: "low" | "medium" | "high" | "critical";
  teamId: string;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  clientName?: string;
};

export type FirestoreTask = {
  id: string;
  projectId: string;
  title: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "testing" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  assigneeId: string;
  dueDate: string;
  description: string;
};

export type FirestoreLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: "website" | "referral" | "linkedin" | "cold-outreach" | "social-media";
  status: "new" | "contacted" | "qualified" | "proposal" | "closed-won" | "closed-lost" | "manual";
  value: number;
  createdAt: string;
  assignedTo?: string;     // Firestore user doc ID of assigned marketing person
  assignedAt?: string;     // ISO timestamp when assigned
  assignedByName?: string; // Name of admin who assigned
  manualNote?: string;     // Call outcome description when marketing marks manual / proposal+manual
  manualUpdatedAt?: string;
  manualUpdatedBy?: string;
};

export type FirestoreClient = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  projects: string[];
  totalRevenue: number;
  since: string;
  status: "active" | "inactive";
};

export type FirestoreInvoice = {
  id: string;
  clientId: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issuedDate: string;
  dueDate: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
};
