import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "../web token .json"), "utf-8")
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

const COLLECTIONS = {
  users: [
    { name: "Arjun Krishnamurthy", email: "arjun@ahs.dev", role: "super-admin", team: "Core", status: "active", performanceScore: 95, joinDate: "2024-01-15", skills: ["Leadership", "Strategy", "Full Stack"] },
    { name: "Priya Venkatesh", email: "priya@ahs.dev", role: "core-admin", team: "Core", status: "active", performanceScore: 88, joinDate: "2024-02-01", skills: ["Project Management", "React", "Node.js"] },
    { name: "Karthik Subramanian", email: "karthik@ahs.dev", role: "team-lead", team: "Frontend", status: "active", performanceScore: 91, joinDate: "2024-03-10", skills: ["React", "TypeScript", "Next.js"] },
    { name: "Divya Ramachandran", email: "divya@ahs.dev", role: "team-lead", team: "AI", status: "active", performanceScore: 87, joinDate: "2024-03-15", skills: ["Python", "AI/ML", "Data Science"] },
    { name: "Vikram Rajesh", email: "vikram@ahs.dev", role: "developer", team: "Backend", status: "active", performanceScore: 82, joinDate: "2024-04-01", skills: ["Node.js", "PostgreSQL", "AWS"] },
    { name: "Meera Sharma", email: "meera@ahs.dev", role: "developer", team: "Frontend", status: "active", performanceScore: 79, joinDate: "2024-04-15", skills: ["React", "Tailwind CSS", "Framer Motion"] },
    { name: "Adithya Ravi", email: "adithya@ahs.dev", role: "developer", team: "Backend", status: "active", performanceScore: 85, joinDate: "2024-05-01", skills: ["Python", "FastAPI", "Docker"] },
    { name: "Nisha Patel", email: "nisha@ahs.dev", role: "intern", team: "Frontend", status: "active", performanceScore: 74, joinDate: "2024-06-01", skills: ["HTML", "CSS", "JavaScript"] },
    { name: "Rahul Verma", email: "rahul@ahs.dev", role: "intern", team: "AI", status: "active", performanceScore: 71, joinDate: "2024-06-15", skills: ["Python", "SQL"] },
    { name: "Sneha Krishnan", email: "sneha@ahs.dev", role: "trainee", team: "Frontend", status: "active", performanceScore: 65, joinDate: "2024-07-01", skills: ["React Basics"] },
    { name: "Deepak Murugan", email: "deepak@ahs.dev", role: "trainee", team: "Backend", status: "active", performanceScore: 60, joinDate: "2024-07-15", skills: ["Python Basics"] },
    { name: "Kavya Nair", email: "kavya@ahs.dev", role: "trainee", team: "AI", status: "pending", performanceScore: 55, joinDate: "2024-08-01", skills: ["UI/UX Basics"] },
  ],
  teams: [
    { name: "Core Team", leadId: "", memberCount: 3, projectCount: 5, performance: 91 },
    { name: "Frontend Team", leadId: "", memberCount: 4, projectCount: 4, performance: 84 },
    { name: "Backend Team", leadId: "", memberCount: 3, projectCount: 3, performance: 82 },
    { name: "AI/ML Team", leadId: "", memberCount: 3, projectCount: 3, performance: 78 },
  ],
  projects: [
    { name: "AHS Command Center", description: "Internal startup operating system", status: "in-progress", priority: "critical", teamId: "core", progress: 68, startDate: "2024-06-01", endDate: "2024-12-31", budget: 500000, clientName: "Internal" },
    { name: "E-Commerce Platform", description: "Full-stack e-commerce for retail client", status: "in-progress", priority: "high", teamId: "frontend", progress: 45, startDate: "2024-07-15", endDate: "2024-11-30", budget: 350000, clientName: "RetailCorp" },
    { name: "AI Chatbot Integration", description: "NLP-powered customer support bot", status: "review", priority: "high", teamId: "ai", progress: 82, startDate: "2024-05-01", endDate: "2024-09-30", budget: 200000, clientName: "TechServe" },
    { name: "CRM Dashboard", description: "Client relationship management portal", status: "completed", priority: "medium", teamId: "frontend", progress: 100, startDate: "2024-03-01", endDate: "2024-07-31", budget: 180000, clientName: "GrowthHub" },
    { name: "Cloud Migration", description: "AWS infrastructure migration", status: "delayed", priority: "critical", teamId: "backend", progress: 35, startDate: "2024-06-15", endDate: "2024-10-15", budget: 420000, clientName: "DataFlow" },
    { name: "Mobile App MVP", description: "React Native mobile application", status: "new", priority: "medium", teamId: "frontend", progress: 10, startDate: "2024-09-01", endDate: "2025-02-28", budget: 300000, clientName: "FitLife" },
  ],
  tasks: [
    { projectId: "", title: "Design system setup", status: "completed", priority: "high", assigneeId: "", dueDate: "2024-07-01", description: "Create design tokens and component library" },
    { projectId: "", title: "Authentication module", status: "completed", priority: "critical", assigneeId: "", dueDate: "2024-07-15", description: "Implement Clerk auth with RBAC" },
    { projectId: "", title: "Dashboard widgets", status: "in-progress", priority: "high", assigneeId: "", dueDate: "2024-08-15", description: "Build all dashboard components" },
    { projectId: "", title: "People module", status: "in-progress", priority: "high", assigneeId: "", dueDate: "2024-08-30", description: "Member management and team features" },
    { projectId: "", title: "Learning module", status: "todo", priority: "medium", assigneeId: "", dueDate: "2024-09-15", description: "LMS with courses and assignments" },
    { projectId: "", title: "AI Center integration", status: "backlog", priority: "high", assigneeId: "", dueDate: "2024-10-01", description: "AI-powered business assistant features" },
  ],
  courses: [
    { title: "React Fundamentals", description: "Master React hooks, components, and patterns", track: "frontend", progress: 75, totalLessons: 24, completedLessons: 18, difficulty: "intermediate" },
    { title: "TypeScript Mastery", description: "Advanced TypeScript patterns and type safety", track: "frontend", progress: 60, totalLessons: 20, completedLessons: 12, difficulty: "advanced" },
    { title: "Node.js Backend", description: "Build scalable APIs with Node.js and Express", track: "backend", progress: 85, totalLessons: 18, completedLessons: 15, difficulty: "intermediate" },
    { title: "Python for AI/ML", description: "Python programming for machine learning", track: "ai", progress: 40, totalLessons: 30, completedLessons: 12, difficulty: "beginner" },
    { title: "System Design", description: "Architecture patterns for scalable systems", track: "backend", progress: 30, totalLessons: 16, completedLessons: 5, difficulty: "advanced" },
    { title: "Figma & UI Design", description: "Design principles and prototyping", track: "ui-ux", progress: 55, totalLessons: 22, completedLessons: 12, difficulty: "beginner" },
    { title: "AWS Cloud Essentials", description: "Cloud infrastructure and deployment", track: "cloud", progress: 20, totalLessons: 28, completedLessons: 6, difficulty: "intermediate" },
    { title: "Next.js Full Stack", description: "Server-side rendering and API routes", track: "frontend", progress: 45, totalLessons: 20, completedLessons: 9, difficulty: "advanced" },
  ],
  assessments: [
    { title: "React Advanced Concepts", type: "coding", duration: 120, totalMarks: 100, passingMarks: 60, scheduledDate: "2024-08-20", status: "upcoming" },
    { title: "System Design Fundamentals", type: "essay", duration: 90, totalMarks: 100, passingMarks: 50, scheduledDate: "2024-08-25", status: "upcoming" },
    { title: "JavaScript Deep Dive", type: "mcq", duration: 60, totalMarks: 50, passingMarks: 25, scheduledDate: "2024-07-15", status: "completed" },
    { title: "API Design Patterns", type: "viva", duration: 30, totalMarks: 100, passingMarks: 60, scheduledDate: "2024-07-20", status: "completed" },
    { title: "TypeScript Generics Quiz", type: "mcq", duration: 45, totalMarks: 50, passingMarks: 30, scheduledDate: "2024-08-10", status: "completed" },
  ],
  leads: [
    { name: "Rajesh Kumar", company: "InnovateTech", email: "rajesh@innovatetech.com", phone: "+91 98765 43210", source: "website", status: "qualified", value: 450000, createdAt: "2024-07-01" },
    { name: "Anitha S", company: "HealthFirst", email: "anitha@healthfirst.in", phone: "+91 87654 32109", source: "referral", status: "proposal", value: 320000, createdAt: "2024-07-10" },
    { name: "Mohammed Farooq", company: "LogiTrans", email: "farooq@logitrans.com", phone: "+91 76543 21098", source: "linkedin", status: "new", value: 280000, createdAt: "2024-07-20" },
    { name: "Priyanka Desai", company: "EduLearn", email: "priyanka@edulearn.in", phone: "+91 65432 10987", source: "social-media", status: "contacted", value: 150000, createdAt: "2024-07-25" },
    { name: "Suresh Babu", company: "ManuPro", email: "suresh@manupro.in", phone: "+91 54321 09876", source: "cold-outreach", status: "closed-won", value: 520000, createdAt: "2024-06-15" },
    { name: "Lakshmi Narayan", company: "FinServe", email: "lakshmi@finserve.com", phone: "+91 43210 98765", source: "referral", status: "qualified", value: 380000, createdAt: "2024-08-01" },
  ],
  clients: [
    { name: "RetailCorp", company: "RetailCorp India", email: "info@retailcorp.in", phone: "+91 12345 67890", projects: [], totalRevenue: 350000, since: "2024-07-15", status: "active" },
    { name: "TechServe", company: "TechServe Solutions", email: "contact@techserve.com", phone: "+91 23456 78901", projects: [], totalRevenue: 200000, since: "2024-05-01", status: "active" },
    { name: "GrowthHub", company: "GrowthHub Pvt Ltd", email: "hello@growthhub.in", phone: "+91 34567 89012", projects: [], totalRevenue: 180000, since: "2024-03-01", status: "active" },
    { name: "DataFlow", company: "DataFlow Systems", email: "support@dataflow.in", phone: "+91 45678 90123", projects: [], totalRevenue: 420000, since: "2024-06-15", status: "active" },
    { name: "FitLife", company: "FitLife Fitness", email: "team@fitlife.in", phone: "+91 56789 01234", projects: [], totalRevenue: 150000, since: "2024-08-01", status: "active" },
  ],
  invoices: [
    { clientId: "", amount: 175000, status: "paid", issuedDate: "2024-07-15", dueDate: "2024-08-15", items: [{ description: "E-Commerce Phase 1", quantity: 1, rate: 175000, amount: 175000 }] },
    { clientId: "", amount: 100000, status: "sent", issuedDate: "2024-08-01", dueDate: "2024-08-31", items: [{ description: "Chatbot Development", quantity: 1, rate: 100000, amount: 100000 }] },
    { clientId: "", amount: 210000, status: "overdue", issuedDate: "2024-07-01", dueDate: "2024-07-31", items: [{ description: "Cloud Migration Phase 1", quantity: 1, rate: 210000, amount: 210000 }] },
    { clientId: "", amount: 180000, status: "paid", issuedDate: "2024-06-01", dueDate: "2024-07-01", items: [{ description: "CRM Dashboard Full", quantity: 1, rate: 180000, amount: 180000 }] },
    { clientId: "", amount: 75000, status: "draft", issuedDate: "2024-08-10", dueDate: "2024-09-10", items: [{ description: "Mobile App Discovery", quantity: 1, rate: 75000, amount: 75000 }] },
  ],
};

async function seedCollection(collectionName: string, data: Record<string, unknown>[]) {
  const batch = db.batch();
  for (const item of data) {
    const ref = db.collection(collectionName).doc();
    batch.set(ref, { ...item, createdAt: new Date() });
  }
  await batch.commit();
  console.log(`Seeded ${data.length} documents into ${collectionName}`);
}

async function main() {
  console.log("Starting Firestore seed...\n");

  for (const [collectionName, data] of Object.entries(COLLECTIONS)) {
    await seedCollection(collectionName, data);
  }

  console.log("\nSeeding complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
