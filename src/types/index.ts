export type Role =
  | "super-admin"
  | "core-admin"
  | "team-lead"
  | "developer"
  | "intern"
  | "trainee"
  | "client";

export type MemberStatus = "active" | "inactive" | "pending";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: string;
  avatar?: string;
  status: MemberStatus;
  performanceScore: number;
  joinDate: string;
  skills: string[];
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  memberCount: number;
  projectCount: number;
  performance: number;
}

export interface Project {
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
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "testing" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  assigneeId: string;
  dueDate: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  track: "frontend" | "backend" | "ai" | "ui-ux" | "cloud";
  progress: number;
  totalLessons: number;
  completedLessons: number;
  thumbnail?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface Assessment {
  id: string;
  title: string;
  type: "mcq" | "coding" | "essay" | "viva";
  duration: number;
  totalMarks: number;
  passingMarks: number;
  scheduledDate: string;
  status: "upcoming" | "ongoing" | "completed";
  attempts?: number;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  memberId: string;
  score: number;
  rank: number;
  completedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: "website" | "referral" | "linkedin" | "cold-outreach" | "social-media";
  status: "new" | "contacted" | "qualified" | "proposal" | "closed-won" | "closed-lost";
  value: number;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  projects: string[];
  totalRevenue: number;
  since: string;
  status: "active" | "inactive";
}

export interface Meeting {
  id: string;
  title: string;
  clientId: string;
  date: string;
  type: "call" | "meeting" | "follow-up";
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issuedDate: string;
  dueDate: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Quotation {
  id: string;
  clientId: string;
  title: string;
  amount: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  validUntil: string;
  items: InvoiceItem[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "assignment" | "project" | "lead" | "assessment" | "team" | "system";
  read: boolean;
  createdAt: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  pendingInvoices: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
}

export interface AIBusinessInsight {
  id: string;
  type: "warning" | "success" | "info" | "recommendation";
  title: string;
  description: string;
  metric?: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
  completedTasks: number;
  totalTasks: number;
}
