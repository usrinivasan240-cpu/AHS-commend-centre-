import type {
  User,
  Team,
  Project,
  Task,
  Course,
  Assessment,
  Lead,
  Client,
  Meeting,
  Invoice,
  Notification,
  AIBusinessInsight,
  Sprint,
} from "@/types";

export const members: User[] = [
  { id: "1", name: "Arjun Krishnamurthy", email: "arjun@ahs.dev", role: "super-admin", status: "active", performanceScore: 95, joinDate: "2024-01-15", skills: ["Leadership", "Strategy", "Full Stack"], team: "Core" },
  { id: "2", name: "Priya Venkatesh", email: "priya@ahs.dev", role: "core-admin", status: "active", performanceScore: 88, joinDate: "2024-02-01", skills: ["Project Management", "React", "Node.js"], team: "Core", avatar: "" },
  { id: "3", name: "Karthik Subramanian", email: "karthik@ahs.dev", role: "team-lead", status: "active", performanceScore: 91, joinDate: "2024-03-10", skills: ["React", "TypeScript", "Next.js"], team: "Frontend" },
  { id: "4", name: "Divya Ramachandran", email: "divya@ahs.dev", role: "team-lead", status: "active", performanceScore: 87, joinDate: "2024-03-15", skills: ["Python", "AI/ML", "Data Science"], team: "AI" },
  { id: "5", name: "Vikram Rajesh", email: "vikram@ahs.dev", role: "developer", status: "active", performanceScore: 82, joinDate: "2024-04-01", skills: ["Node.js", "PostgreSQL", "AWS"], team: "Backend" },
  { id: "6", name: "Meera Sharma", email: "meera@ahs.dev", role: "developer", status: "active", performanceScore: 79, joinDate: "2024-04-15", skills: ["React", "Tailwind CSS", "Framer Motion"], team: "Frontend" },
  { id: "7", name: "Adithya Ravi", email: "adithya@ahs.dev", role: "developer", status: "active", performanceScore: 85, joinDate: "2024-05-01", skills: ["Python", "FastAPI", "Docker"], team: "Backend" },
  { id: "8", name: "Nisha Patel", email: "nisha@ahs.dev", role: "intern", status: "active", performanceScore: 74, joinDate: "2024-06-01", skills: ["HTML", "CSS", "JavaScript"], team: "Frontend" },
  { id: "9", name: "Rahul Verma", email: "rahul@ahs.dev", role: "intern", status: "active", performanceScore: 71, joinDate: "2024-06-15", skills: ["Python", "SQL"], team: "AI" },
  { id: "10", name: "Sneha Krishnan", email: "sneha@ahs.dev", role: "trainee", status: "active", performanceScore: 65, joinDate: "2024-07-01", skills: ["React Basics"], team: "Frontend" },
  { id: "11", name: "Deepak Murugan", email: "deepak@ahs.dev", role: "trainee", status: "active", performanceScore: 60, joinDate: "2024-07-15", skills: ["Python Basics"], team: "Backend" },
  { id: "12", name: "Kavya Nair", email: "kavya@ahs.dev", role: "trainee", status: "pending", performanceScore: 55, joinDate: "2024-08-01", skills: ["UI/UX Basics"], team: "AI" },
];

export const teams: Team[] = [
  { id: "core", name: "Core Team", leadId: "1", memberCount: 3, projectCount: 5, performance: 91 },
  { id: "frontend", name: "Frontend Team", leadId: "3", memberCount: 4, projectCount: 4, performance: 84 },
  { id: "backend", name: "Backend Team", leadId: "5", memberCount: 3, projectCount: 3, performance: 82 },
  { id: "ai", name: "AI/ML Team", leadId: "4", memberCount: 3, projectCount: 3, performance: 78 },
];

export const projects: Project[] = [
  { id: "1", name: "AHS Command Center", description: "Internal startup operating system", status: "in-progress", priority: "critical", teamId: "core", progress: 68, startDate: "2024-06-01", endDate: "2024-12-31", budget: 500000, clientName: "Internal" },
  { id: "2", name: "E-Commerce Platform", description: "Full-stack e-commerce for retail client", status: "in-progress", priority: "high", teamId: "frontend", progress: 45, startDate: "2024-07-15", endDate: "2024-11-30", budget: 350000, clientName: "RetailCorp" },
  { id: "3", name: "AI Chatbot Integration", description: "NLP-powered customer support bot", status: "review", priority: "high", teamId: "ai", progress: 82, startDate: "2024-05-01", endDate: "2024-09-30", budget: 200000, clientName: "TechServe" },
  { id: "4", name: "CRM Dashboard", description: "Client relationship management portal", status: "completed", priority: "medium", teamId: "frontend", progress: 100, startDate: "2024-03-01", endDate: "2024-07-31", budget: 180000, clientName: "GrowthHub" },
  { id: "5", name: "Cloud Migration", description: "AWS infrastructure migration", status: "delayed", priority: "critical", teamId: "backend", progress: 35, startDate: "2024-06-15", endDate: "2024-10-15", budget: 420000, clientName: "DataFlow" },
  { id: "6", name: "Mobile App MVP", description: "React Native mobile application", status: "new", priority: "medium", teamId: "frontend", progress: 10, startDate: "2024-09-01", endDate: "2025-02-28", budget: 300000, clientName: "FitLife" },
];

export const tasks: Task[] = [
  { id: "1", projectId: "1", title: "Design system setup", status: "completed", priority: "high", assigneeId: "6", dueDate: "2024-07-01", description: "Create design tokens and component library" },
  { id: "2", projectId: "1", title: "Authentication module", status: "completed", priority: "critical", assigneeId: "5", dueDate: "2024-07-15", description: "Implement Clerk auth with RBAC" },
  { id: "3", projectId: "1", title: "Dashboard widgets", status: "in-progress", priority: "high", assigneeId: "3", dueDate: "2024-08-15", description: "Build all dashboard components" },
  { id: "4", projectId: "1", title: "People module", status: "in-progress", priority: "high", assigneeId: "6", dueDate: "2024-08-30", description: "Member management and team features" },
  { id: "5", projectId: "1", title: "Learning module", status: "todo", priority: "medium", assigneeId: "8", dueDate: "2024-09-15", description: "LMS with courses and assignments" },
  { id: "6", projectId: "1", title: "AI Center integration", status: "backlog", priority: "high", assigneeId: "4", dueDate: "2024-10-01", description: "AI-powered business assistant features" },
  { id: "7", projectId: "2", title: "Product catalog", status: "in-progress", priority: "high", assigneeId: "3", dueDate: "2024-08-30", description: "Product listing and detail pages" },
  { id: "8", projectId: "2", title: "Payment gateway", status: "todo", priority: "critical", assigneeId: "5", dueDate: "2024-09-15", description: "Stripe integration for payments" },
  { id: "9", projectId: "3", title: "NLP model training", status: "review", priority: "high", assigneeId: "4", dueDate: "2024-08-15", description: "Train chatbot on client data" },
  { id: "10", projectId: "5", title: "AWS VPC setup", status: "in-progress", priority: "critical", assigneeId: "7", dueDate: "2024-07-30", description: "Configure virtual private cloud" },
];

export const courses: Course[] = [
  { id: "1", title: "React Fundamentals", description: "Master React hooks, components, and patterns", track: "frontend", progress: 75, totalLessons: 24, completedLessons: 18, difficulty: "intermediate" },
  { id: "2", title: "TypeScript Mastery", description: "Advanced TypeScript patterns and type safety", track: "frontend", progress: 60, totalLessons: 20, completedLessons: 12, difficulty: "advanced" },
  { id: "3", title: "Node.js Backend", description: "Build scalable APIs with Node.js and Express", track: "backend", progress: 85, totalLessons: 18, completedLessons: 15, difficulty: "intermediate" },
  { id: "4", title: "Python for AI/ML", description: "Python programming for machine learning", track: "ai", progress: 40, totalLessons: 30, completedLessons: 12, difficulty: "beginner" },
  { id: "5", title: "System Design", description: "Architecture patterns for scalable systems", track: "backend", progress: 30, totalLessons: 16, completedLessons: 5, difficulty: "advanced" },
  { id: "6", title: "Figma & UI Design", description: "Design principles and prototyping", track: "ui-ux", progress: 55, totalLessons: 22, completedLessons: 12, difficulty: "beginner" },
  { id: "7", title: "AWS Cloud Essentials", description: "Cloud infrastructure and deployment", track: "cloud", progress: 20, totalLessons: 28, completedLessons: 6, difficulty: "intermediate" },
  { id: "8", title: "Next.js Full Stack", description: "Server-side rendering and API routes", track: "frontend", progress: 45, totalLessons: 20, completedLessons: 9, difficulty: "advanced" },
];

export const assessments: Assessment[] = [
  { id: "1", title: "React Advanced Concepts", type: "coding", duration: 120, totalMarks: 100, passingMarks: 60, scheduledDate: "2024-08-20", status: "upcoming", attempts: 12 },
  { id: "2", title: "System Design Fundamentals", type: "essay", duration: 90, totalMarks: 100, passingMarks: 50, scheduledDate: "2024-08-25", status: "upcoming", attempts: 10 },
  { id: "3", title: "JavaScript Deep Dive", type: "mcq", duration: 60, totalMarks: 50, passingMarks: 25, scheduledDate: "2024-07-15", status: "completed", attempts: 15 },
  { id: "4", title: "API Design Patterns", type: "viva", duration: 30, totalMarks: 100, passingMarks: 60, scheduledDate: "2024-07-20", status: "completed", attempts: 8 },
  { id: "5", title: "TypeScript Generics Quiz", type: "mcq", duration: 45, totalMarks: 50, passingMarks: 30, scheduledDate: "2024-08-10", status: "completed", attempts: 14 },
];

export const leads: Lead[] = [
  { id: "1", name: "Rajesh Kumar", company: "InnovateTech", email: "rajesh@innovatetech.com", phone: "+91 98765 43210", source: "website", status: "qualified", value: 450000, createdAt: "2024-07-01" },
  { id: "2", name: "Anitha S", company: "HealthFirst", email: "anitha@healthfirst.in", phone: "+91 87654 32109", source: "referral", status: "proposal", value: 320000, createdAt: "2024-07-10" },
  { id: "3", name: "Mohammed Farooq", company: "LogiTrans", email: "farooq@logitrans.com", phone: "+91 76543 21098", source: "linkedin", status: "new", value: 280000, createdAt: "2024-07-20" },
  { id: "4", name: "Priyanka Desai", company: "EduLearn", email: "priyanka@edulearn.in", phone: "+91 65432 10987", source: "social-media", status: "contacted", value: 150000, createdAt: "2024-07-25" },
  { id: "5", name: "Suresh Babu", company: "ManuPro", email: "suresh@manupro.in", phone: "+91 54321 09876", source: "cold-outreach", status: "closed-won", value: 520000, createdAt: "2024-06-15" },
  { id: "6", name: "Lakshmi Narayan", company: "FinServe", email: "lakshmi@finserve.com", phone: "+91 43210 98765", source: "referral", status: "qualified", value: 380000, createdAt: "2024-08-01" },
];

export const clients: Client[] = [
  { id: "1", name: "RetailCorp", company: "RetailCorp India", email: "info@retailcorp.in", phone: "+91 12345 67890", projects: ["E-Commerce Platform"], totalRevenue: 350000, since: "2024-07-15", status: "active" },
  { id: "2", name: "TechServe", company: "TechServe Solutions", email: "contact@techserve.com", phone: "+91 23456 78901", projects: ["AI Chatbot Integration"], totalRevenue: 200000, since: "2024-05-01", status: "active" },
  { id: "3", name: "GrowthHub", company: "GrowthHub Pvt Ltd", email: "hello@growthhub.in", phone: "+91 34567 89012", projects: ["CRM Dashboard"], totalRevenue: 180000, since: "2024-03-01", status: "active" },
  { id: "4", name: "DataFlow", company: "DataFlow Systems", email: "support@dataflow.in", phone: "+91 45678 90123", projects: ["Cloud Migration"], totalRevenue: 420000, since: "2024-06-15", status: "active" },
  { id: "5", name: "FitLife", company: "FitLife Fitness", email: "team@fitlife.in", phone: "+91 56789 01234", projects: ["Mobile App MVP"], totalRevenue: 150000, since: "2024-08-01", status: "active" },
];

export const meetings: Meeting[] = [
  { id: "1", title: "Sprint Review - Command Center", clientId: "", date: "2024-08-16T10:00:00", type: "meeting", status: "scheduled" },
  { id: "2", title: "E-Commerce Demo", clientId: "1", date: "2024-08-18T14:00:00", type: "meeting", status: "scheduled" },
  { id: "3", title: "Chatbot UAT Feedback", clientId: "2", date: "2024-08-15T11:00:00", type: "call", status: "completed", notes: "Client happy with NLP accuracy. Minor UI tweaks needed." },
  { id: "4", title: "Cloud Migration Status", clientId: "4", date: "2024-08-20T09:00:00", type: "call", status: "scheduled" },
  { id: "5", title: "FitLife Kickoff", clientId: "5", date: "2024-08-10T15:00:00", type: "meeting", status: "completed", notes: "Project scope finalized. MVP timeline confirmed." },
];

export const invoices: Invoice[] = [
  { id: "INV-001", clientId: "1", amount: 175000, status: "paid", issuedDate: "2024-07-15", dueDate: "2024-08-15", items: [{ description: "E-Commerce Phase 1", quantity: 1, rate: 175000, amount: 175000 }] },
  { id: "INV-002", clientId: "2", amount: 100000, status: "sent", issuedDate: "2024-08-01", dueDate: "2024-08-31", items: [{ description: "Chatbot Development", quantity: 1, rate: 100000, amount: 100000 }] },
  { id: "INV-003", clientId: "4", amount: 210000, status: "overdue", issuedDate: "2024-07-01", dueDate: "2024-07-31", items: [{ description: "Cloud Migration Phase 1", quantity: 1, rate: 210000, amount: 210000 }] },
  { id: "INV-004", clientId: "3", amount: 180000, status: "paid", issuedDate: "2024-06-01", dueDate: "2024-07-01", items: [{ description: "CRM Dashboard Full", quantity: 1, rate: 180000, amount: 180000 }] },
  { id: "INV-005", clientId: "5", amount: 75000, status: "draft", issuedDate: "2024-08-10", dueDate: "2024-09-10", items: [{ description: "Mobile App Discovery", quantity: 1, rate: 75000, amount: 75000 }] },
];

export const notifications: Notification[] = [
  { id: "1", title: "Project Delayed", message: "Cloud Migration is 4 days behind schedule", type: "project", read: false, createdAt: "2024-08-15T09:00:00" },
  { id: "2", title: "Assessment Scheduled", message: "React Advanced Concepts test on Aug 20", type: "assessment", read: false, createdAt: "2024-08-14T10:30:00" },
  { id: "3", title: "New Lead", message: "Lakshmi Narayan from FinServe submitted inquiry", type: "lead", read: true, createdAt: "2024-08-13T14:00:00" },
  { id: "4", title: "Task Completed", message: "Design system setup marked as completed", type: "team", read: true, createdAt: "2024-08-12T16:00:00" },
  { id: "5", title: "Assignment Due", message: "Nisha Patel's React assignment due tomorrow", type: "assignment", read: false, createdAt: "2024-08-15T08:00:00" },
  { id: "6", title: "Invoice Overdue", message: "INV-003 for DataFlow is 15 days overdue", type: "system", read: false, createdAt: "2024-08-15T07:00:00" },
];

export const aiInsights: AIBusinessInsight[] = [
  { id: "1", type: "warning", title: "Project Delayed", description: "Cloud Migration is delayed by 4 days. Consider reallocating resources.", metric: "4 days" },
  { id: "2", type: "success", title: "Internship Ready", description: "3 trainees (Sneha, Deepak, Kavya) are ready for internship promotion.", metric: "3 trainees" },
  { id: "3", type: "recommendation", title: "Revenue Opportunity", description: "FinServe lead is highly qualified. Schedule a demo this week.", metric: "₹3,80,000" },
  { id: "4", type: "info", title: "Team Performance", description: "Frontend team leads with 84% average performance this quarter.", metric: "84%" },
  { id: "5", type: "warning", title: "Overdue Invoice", description: "INV-003 from DataFlow (₹2,10,000) is 15 days overdue.", metric: "₹2,10,000" },
];

export const sprints: Sprint[] = [
  { id: "1", projectId: "1", name: "Sprint 5 - Core Modules", startDate: "2024-08-01", endDate: "2024-08-15", status: "completed", completedTasks: 8, totalTasks: 10 },
  { id: "2", projectId: "1", name: "Sprint 6 - Dashboard & People", startDate: "2024-08-16", endDate: "2024-08-31", status: "active", completedTasks: 3, totalTasks: 12 },
  { id: "3", projectId: "1", name: "Sprint 7 - Learning & Assessments", startDate: "2024-09-01", endDate: "2024-09-15", status: "planned", completedTasks: 0, totalTasks: 8 },
];

export const financeSummary = {
  totalRevenue: 1380000,
  totalExpenses: 890000,
  profit: 490000,
  pendingInvoices: 3,
  monthlyRevenue: [120000, 180000, 220000, 280000, 150000, 430000],
  monthlyExpenses: [80000, 120000, 140000, 160000, 180000, 210000],
};
