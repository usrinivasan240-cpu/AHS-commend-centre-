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

const now = () => new Date().toISOString();
const COURSE_ID = "AHS-AI-BOOTCAMP";
const LEGACY_COURSE_ID = "ai-app-dev-bootcamp";

// ---------------------------------------------------------------- modules
const modules: { id: string; title: string; order: number; description: string; isCapstone?: boolean }[] = [
  { id: "AHS-AI-M01", title: "Module 01 — Introduction to AI Application Development", order: 1, description: "Understand AI fundamentals and the workflow used to build modern AI-powered applications." },
  { id: "AHS-AI-M02", title: "Module 02 — Google AI Studio & Gemini", order: 2, description: "Learn how to use Google AI Studio and Gemini for AI application development." },
  { id: "AHS-AI-M03", title: "Module 03 — Prompt Engineering", order: 3, description: "Learn how to design effective prompts and structured AI instructions." },
  { id: "AHS-AI-M04", title: "Module 04 — AI-Assisted Development", order: 4, description: "Learn how AI can assist developers with coding, debugging, refactoring and code review." },
  { id: "AHS-AI-M05", title: "Module 05 — Building AI Applications", order: 5, description: "Build real AI applications by connecting frontend interfaces with AI APIs." },
  { id: "AHS-AI-M06", title: "Module 06 — Development Environment", order: 6, description: "Set up a professional development environment and understand project structure." },
  { id: "AHS-AI-M07", title: "Module 07 — Git & GitHub", order: 7, description: "Learn version control and professional GitHub workflows." },
  { id: "AHS-AI-M08", title: "Module 08 — Firebase Backend", order: 8, description: "Learn authentication, Firestore, storage and backend fundamentals using Firebase." },
  { id: "AHS-AI-M09", title: "Module 09 — Deployment", order: 9, description: "Learn how to build and deploy applications to production." },
  { id: "AHS-AI-M10", title: "Module 10 — Debugging & Maintenance", order: 10, description: "Learn systematic debugging and application maintenance." },
  { id: "AHS-AI-M11", title: "Module 11 — Final Capstone Project: AI Student Assistant", order: 11, description: "Build and deploy a complete AI-powered application using the skills learned throughout the bootcamp.", isCapstone: true },
];

const FOCUS: Record<string, string> = {
  "AHS-AI-M01": "Builds your mental model of what AI is and how AI products are shaped before you touch any tool.",
  "AHS-AI-M02": "Gets you hands-on with Gemini so you can judge model behaviour before writing code against it.",
  "AHS-AI-M03": "Teaches you to instruct models precisely — the highest-leverage skill in AI development.",
  "AHS-AI-M04": "Shows how to use AI as a coding partner while staying responsible for correctness.",
  "AHS-AI-M05": "Connects UI to AI APIs with proper loading and error handling.",
  "AHS-AI-M06": "Gives you a professional local setup you will use for the rest of the course.",
  "AHS-AI-M07": "Makes your work versioned, shareable and reviewable like a professional developer.",
  "AHS-AI-M08": "Adds real backends: auth, database and storage for your AI apps.",
  "AHS-AI-M09": "Ships your work to a public URL anyone can open.",
  "AHS-AI-M10": "Trains systematic debugging so broken apps never stay broken.",
  "AHS-AI-M11": "Proves everything above in one deployed, presented product.",
};

// ---------------------------------------------------------------- lessons
type LessonDef = { m: string; id: string; title: string; topics: string[]; minutes: number };
const lessons: LessonDef[] = [
  { m: "AHS-AI-M01", id: "M01-L01", title: "Introduction to Artificial Intelligence", topics: ["What is Artificial Intelligence?", "Types of AI", "Real-world AI applications", "AI vs traditional software"], minutes: 25 },
  { m: "AHS-AI-M01", id: "M01-L02", title: "Generative AI Fundamentals", topics: ["What is Generative AI?", "Large Language Models", "Text generation", "Image generation", "AI assistants"], minutes: 25 },
  { m: "AHS-AI-M01", id: "M01-L03", title: "Modern AI Development Workflow", topics: ["Idea", "Requirements", "AI model", "Application", "Testing", "Deployment"], minutes: 20 },
  { m: "AHS-AI-M01", id: "M01-L04", title: "AI-First Software Development", topics: ["AI-assisted development", "Human + AI workflow", "AI development best practices"], minutes: 20 },
  { m: "AHS-AI-M02", id: "M02-L01", title: "Google AI Studio Overview", topics: ["What is Google AI Studio", "Creating an API key", "Interface tour", "Free-tier limits"], minutes: 20 },
  { m: "AHS-AI-M02", id: "M02-L02", title: "Gemini Models", topics: ["Gemini model family", "Flash vs Pro", "Context windows", "Choosing the right model"], minutes: 20 },
  { m: "AHS-AI-M02", id: "M02-L03", title: "AI Playground", topics: ["System instructions", "Temperature and parameters", "Comparing outputs", "Saving prompts"], minutes: 20 },
  { m: "AHS-AI-M02", id: "M02-L04", title: "Model Capabilities", topics: ["Text generation", "Code assistance", "Vision inputs", "Multimodal use cases"], minutes: 20 },
  { m: "AHS-AI-M02", id: "M02-L05", title: "Prompt Testing", topics: ["Writing test prompts", "Evaluating responses", "Iterating quickly", "Spotting limitations"], minutes: 20 },
  { m: "AHS-AI-M03", id: "M03-L01", title: "Prompt Design Principles", topics: ["Clarity and specificity", "Context and background", "Constraints", "Output format"], minutes: 20 },
  { m: "AHS-AI-M03", id: "M03-L02", title: "Context Engineering", topics: ["What is context", "Providing examples", "Knowledge cutoff awareness", "Keeping prompts maintainable"], minutes: 25 },
  { m: "AHS-AI-M03", id: "M03-L03", title: "Prompt Optimization", topics: ["Draft, test, refine loop", "A/B prompt variants", "Measuring improvement"], minutes: 20 },
  { m: "AHS-AI-M03", id: "M03-L04", title: "Structured Prompting", topics: ["Headers and sections", "Delimiters", "JSON schemas", "Reusable templates"], minutes: 25 },
  { m: "AHS-AI-M03", id: "M03-L05", title: "Practical Prompt Patterns", topics: ["Role pattern", "Recipe pattern", "Template pattern", "Common pitfalls"], minutes: 20 },
  { m: "AHS-AI-M04", id: "M04-L01", title: "AI for Software Development", topics: ["Where AI helps most", "Choosing an assistant", "Setup basics"], minutes: 20 },
  { m: "AHS-AI-M04", id: "M04-L02", title: "Code Generation", topics: ["Describing intent precisely", "Generating functions", "Generating components", "Verifying output"], minutes: 25 },
  { m: "AHS-AI-M04", id: "M04-L03", title: "Debugging with AI", topics: ["Pasting errors effectively", "Asking for explanations", "Iterative fixes"], minutes: 25 },
  { m: "AHS-AI-M04", id: "M04-L04", title: "Refactoring", topics: ["Readability improvements", "Naming", "Extracting functions", "When not to refactor"], minutes: 20 },
  { m: "AHS-AI-M04", id: "M04-L05", title: "AI Limitations", topics: ["Hallucinated APIs", "Security blind spots", "Always verify"], minutes: 20 },
  { m: "AHS-AI-M04", id: "M04-L06", title: "Best Practices", topics: ["Small diffs", "Tests as guardrails", "Keeping humans in charge"], minutes: 20 },
  { m: "AHS-AI-M05", id: "M05-L01", title: "AI Application Architecture", topics: ["Frontend to API to model flow", "Keys stay server-side", "Cost per request"], minutes: 20 },
  { m: "AHS-AI-M05", id: "M05-L02", title: "User Interface Integration", topics: ["Input components", "Response display", "Markdown rendering"], minutes: 20 },
  { m: "AHS-AI-M05", id: "M05-L03", title: "AI API Integration", topics: ["REST basics", "Request shape", "Auth headers"], minutes: 25 },
  { m: "AHS-AI-M05", id: "M05-L04", title: "Response Handling", topics: ["Parsing responses", "Streaming basics", "Empty responses"], minutes: 20 },
  { m: "AHS-AI-M05", id: "M05-L05", title: "Error Handling", topics: ["API failure", "Empty input", "Network failure", "Retries"], minutes: 20 },
  { m: "AHS-AI-M06", id: "M06-L01", title: "Installing VS Code", topics: ["Download and install", "Layout tour", "Settings sync"], minutes: 15 },
  { m: "AHS-AI-M06", id: "M06-L02", title: "Essential Extensions", topics: ["ESLint", "Prettier", "GitLens", "AI assistant", "Live Server"], minutes: 20 },
  { m: "AHS-AI-M06", id: "M06-L03", title: "Project Structure", topics: ["src/", "components/", "services/", "assets/", "utils/"], minutes: 20 },
  { m: "AHS-AI-M06", id: "M06-L04", title: "Development Workflow", topics: ["Terminal basics", "npm scripts", "Dev server", "Hot reload"], minutes: 20 },
  { m: "AHS-AI-M06", id: "M06-L05", title: "Productivity Tips", topics: ["Shortcuts", "Snippets", "Command palette", "Debugging in the editor"], minutes: 15 },
  { m: "AHS-AI-M07", id: "M07-L01", title: "Version Control Fundamentals", topics: ["Why version control", "Git vs GitHub", "Repositories and history"], minutes: 20 },
  { m: "AHS-AI-M07", id: "M07-L02", title: "Git Basics", topics: ["git init", "git status", "git add", "git commit", "git log"], minutes: 25 },
  { m: "AHS-AI-M07", id: "M07-L03", title: "GitHub Repositories", topics: ["Creating a repository", "Push and pull", "Cloning"], minutes: 20 },
  { m: "AHS-AI-M07", id: "M07-L04", title: "Commit Workflow", topics: ["Staging", "Meaningful messages", "Push cadence"], minutes: 20 },
  { m: "AHS-AI-M07", id: "M07-L05", title: "Collaboration Best Practices", topics: ["Branching", "Pull requests", "Merging", "Reviews"], minutes: 20 },
  { m: "AHS-AI-M08", id: "M08-L01", title: "Firebase Project Setup", topics: ["Console tour", "Creating a project", "Web app config", "SDK install"], minutes: 20 },
  { m: "AHS-AI-M08", id: "M08-L02", title: "Authentication", topics: ["Email/password auth", "Register", "Login", "Logout", "Auth state"], minutes: 25 },
  { m: "AHS-AI-M08", id: "M08-L03", title: "Firestore Database", topics: ["Collections and documents", "Create", "Read", "Update", "Delete", "Security rules basics"], minutes: 30 },
  { m: "AHS-AI-M08", id: "M08-L04", title: "Cloud Storage", topics: ["Buckets", "Uploads", "Download URLs", "Rules"], minutes: 20 },
  { m: "AHS-AI-M08", id: "M08-L05", title: "Hosting Fundamentals", topics: ["Build output", "Deploy command", "Preview channels"], minutes: 15 },
  { m: "AHS-AI-M09", id: "M09-L01", title: "Production Build", topics: ["Dev vs production", "Build command", "Bundle checks"], minutes: 20 },
  { m: "AHS-AI-M09", id: "M09-L02", title: "Vercel Deployment", topics: ["Import from GitHub", "Framework presets", "First deploy"], minutes: 20 },
  { m: "AHS-AI-M09", id: "M09-L03", title: "Environment Variables", topics: ["What goes in env", "Adding variables in Vercel", "Local .env files", "Never commit secrets"], minutes: 20 },
  { m: "AHS-AI-M09", id: "M09-L04", title: "Live Application Hosting", topics: ["Domains", "Preview vs production", "Rollbacks"], minutes: 15 },
  { m: "AHS-AI-M09", id: "M09-L05", title: "Deployment Workflow", topics: ["Push, build, deploy", "Reading logs", "Fix-forward"], minutes: 15 },
  { m: "AHS-AI-M10", id: "M10-L01", title: "Reading Error Messages", topics: ["Stack traces", "Line numbers", "Searching errors effectively"], minutes: 20 },
  { m: "AHS-AI-M10", id: "M10-L02", title: "Debugging Techniques", topics: ["Reproduce first", "Bisect the change", "Console and breakpoints"], minutes: 25 },
  { m: "AHS-AI-M10", id: "M10-L03", title: "Fixing AI-Generated Code", topics: ["Verifying APIs exist", "Writing tests", "Common hallucinations"], minutes: 25 },
  { m: "AHS-AI-M10", id: "M10-L04", title: "Code Quality", topics: ["Linting", "Naming", "Small functions", "Comments that matter"], minutes: 20 },
  { m: "AHS-AI-M10", id: "M10-L05", title: "Application Maintenance", topics: ["Dependencies", "Monitoring", "Documentation", "Handover"], minutes: 20 },
  { m: "AHS-AI-M11", id: "M11-L01", title: "Capstone Overview and Requirements", topics: ["Required features: auth, AI, backend, frontend, deployment", "Milestones CAP-01 to CAP-10", "Evaluation criteria"], minutes: 30 },
  { m: "AHS-AI-M11", id: "M11-L02", title: "Final Presentation Guide", topics: ["Demo flow", "What reviewers look for", "Backup plan if the demo fails"], minutes: 20 },
];

// ---------------------------------------------------------------- practices
type PracticeDef = { m: string; id: string; title: string; task: string; type: "TEXT" | "FILE" | "LINK" | "CODE" | "QUIZ" };
const practices: PracticeDef[] = [
  { m: "AHS-AI-M01", id: "M01-P01", title: "Identify AI Applications", task: "Find 10 real-world AI applications and explain how AI is used in each.", type: "TEXT" },
  { m: "AHS-AI-M01", id: "M01-P02", title: "Traditional vs AI Application", task: "Compare a traditional application with an AI-powered version of the same idea.", type: "TEXT" },
  { m: "AHS-AI-M01", id: "M01-P03", title: "AI Product Ideas", task: "Create 5 AI application ideas for education, business and productivity.", type: "TEXT" },
  { m: "AHS-AI-M02", id: "M02-P01", title: "First Gemini Experiment", task: "Ask Gemini 10 different questions and document the responses.", type: "TEXT" },
  { m: "AHS-AI-M02", id: "M02-P02", title: "Prompt Comparison", task: "Use the same problem with a basic prompt, a detailed prompt, a role-based prompt and a structured prompt. Compare the results.", type: "TEXT" },
  { m: "AHS-AI-M02", id: "M02-P03", title: "Model Testing", task: "Compare model responses based on quality, speed and limitations.", type: "TEXT" },
  { m: "AHS-AI-M03", id: "M03-P01", title: "Fix the Bad Prompt", task: "Original: 'Write an email.' Improve the prompt so it generates a professional email.", type: "TEXT" },
  { m: "AHS-AI-M03", id: "M03-P02", title: "Role Prompting", task: "Create prompts for: Teacher, Developer, Marketing Expert, Career Advisor.", type: "TEXT" },
  { m: "AHS-AI-M03", id: "M03-P03", title: "Structured Output", task: "Create a prompt that generates structured JSON output.", type: "CODE" },
  { m: "AHS-AI-M03", id: "M03-P04", title: "Prompt Optimization", task: "Take one prompt and improve it through 3 versions.", type: "TEXT" },
  { m: "AHS-AI-M04", id: "M04-P01", title: "Generate Code with AI", task: "Generate a JavaScript utility using AI and explain every part.", type: "CODE" },
  { m: "AHS-AI-M04", id: "M04-P02", title: "Debug AI Code", task: "Fix intentionally broken code using AI assistance.", type: "CODE" },
  { m: "AHS-AI-M04", id: "M04-P03", title: "Refactor Code", task: "Improve messy code using AI suggestions.", type: "CODE" },
  { m: "AHS-AI-M04", id: "M04-P04", title: "AI Code Review", task: "Review AI-generated code and identify 5 potential problems.", type: "TEXT" },
  { m: "AHS-AI-M05", id: "M05-P01", title: "Create AI Input UI", task: "Build a text input, a button and a response area.", type: "CODE" },
  { m: "AHS-AI-M05", id: "M05-P02", title: "API Connection", task: "Connect an AI API to the application.", type: "CODE" },
  { m: "AHS-AI-M05", id: "M05-P03", title: "Loading State", task: "Display a loading indicator during AI generation.", type: "CODE" },
  { m: "AHS-AI-M05", id: "M05-P04", title: "Error Handling", task: "Handle: API failure, empty input, network failure.", type: "TEXT" },
  { m: "AHS-AI-M06", id: "M06-P01", title: "VS Code Setup", task: "Install VS Code and the required extensions.", type: "TEXT" },
  { m: "AHS-AI-M06", id: "M06-P02", title: "Project Structure", task: "Create: src/, components/, services/, assets/, utils/.", type: "CODE" },
  { m: "AHS-AI-M06", id: "M06-P03", title: "Run Development Server", task: "Create and run a project locally.", type: "TEXT" },
  { m: "AHS-AI-M06", id: "M06-P04", title: "Debug Project", task: "Find and fix a local development error.", type: "TEXT" },
  { m: "AHS-AI-M07", id: "M07-P01", title: "Git Basics", task: "Practice: git init, git status, git add, git commit, git log.", type: "TEXT" },
  { m: "AHS-AI-M07", id: "M07-P02", title: "GitHub Repository", task: "Create a GitHub repository and push the project. Submit the repository URL.", type: "LINK" },
  { m: "AHS-AI-M07", id: "M07-P03", title: "Branching", task: "Create a feature branch and merge it.", type: "TEXT" },
  { m: "AHS-AI-M07", id: "M07-P04", title: "Commit Challenge", task: "Make at least 5 meaningful commits. Submit the repository URL.", type: "LINK" },
  { m: "AHS-AI-M08", id: "M08-P01", title: "Firebase Setup", task: "Create a Firebase project and connect it to an application.", type: "TEXT" },
  { m: "AHS-AI-M08", id: "M08-P02", title: "Authentication", task: "Implement: Register, Login, Logout.", type: "CODE" },
  { m: "AHS-AI-M08", id: "M08-P03", title: "Firestore CRUD", task: "Practice: Create, Read, Update, Delete.", type: "CODE" },
  { m: "AHS-AI-M08", id: "M08-P04", title: "File Upload", task: "Upload and retrieve a file using Firebase Storage.", type: "CODE" },
  { m: "AHS-AI-M09", id: "M09-P01", title: "Production Build", task: "Create a production build locally.", type: "TEXT" },
  { m: "AHS-AI-M09", id: "M09-P02", title: "GitHub to Vercel", task: "Connect a GitHub project to Vercel. Submit the live URL.", type: "LINK" },
  { m: "AHS-AI-M09", id: "M09-P03", title: "Environment Variables", task: "Configure environment variables for the deployment.", type: "TEXT" },
  { m: "AHS-AI-M09", id: "M09-P04", title: "Deployment Debugging", task: "Fix a deployment issue and describe the cause and fix.", type: "TEXT" },
  { m: "AHS-AI-M10", id: "M10-P01", title: "JavaScript Bug Challenge", task: "Fix 5 JavaScript bugs.", type: "CODE" },
  { m: "AHS-AI-M10", id: "M10-P02", title: "API Debugging", task: "Fix an API integration problem and explain the cause.", type: "TEXT" },
  { m: "AHS-AI-M10", id: "M10-P03", title: "Firebase Debugging", task: "Fix a Firestore data-loading problem and explain the cause.", type: "TEXT" },
  { m: "AHS-AI-M10", id: "M10-P04", title: "Deployment Debugging", task: "Fix a broken deployment and explain the cause.", type: "TEXT" },
];

// ---------------------------------------------------------------- hands-on
type HandsonDef = { m: string; id: string; title: string; brief: string; checklist: string[]; deliverables: string[]; marks: number };
const handsons: HandsonDef[] = [
  { m: "AHS-AI-M01", id: "M01-H01", title: "AI Application Idea Generator", brief: "Create a simple application that accepts a problem statement and generates: application idea, target users, main features, AI features, suggested technology stack.", checklist: ["Accepts a problem statement as input", "Generates an application idea", "Lists target users", "Lists main features and AI features", "Suggests a technology stack"], deliverables: ["Text explanation", "Screenshots"], marks: 100 },
  { m: "AHS-AI-M02", id: "M02-H01", title: "AI Text Generator", brief: "Build an application where the user enters a topic and selects Blog, Email, Social Media Post or Summary. The AI generates the selected content.", checklist: ["Topic input works", "Content-type selector works", "AI generates the selected content", "Loading and error states handled"], deliverables: ["Live URL", "GitHub URL"], marks: 100 },
  { m: "AHS-AI-M03", id: "M03-H01", title: "AI Study Assistant", brief: "Build an assistant. Input: subject, topic, student level. Output: explanation, examples, key points, quiz questions.", checklist: ["Accepts subject, topic and level", "Outputs explanation and examples", "Outputs key points", "Outputs quiz questions"], deliverables: ["Live URL", "GitHub URL"], marks: 100 },
  { m: "AHS-AI-M04", id: "M04-H01", title: "AI Code Helper", brief: "Build a helper with: code input, error input, AI explanation, suggested fix, improved code.", checklist: ["Code input works", "Error input works", "Shows AI explanation", "Shows suggested fix and improved code"], deliverables: ["Live URL", "GitHub URL"], marks: 100 },
  { m: "AHS-AI-M05", id: "M05-H01", title: "AI Chat Application", brief: "Build a chat app with: chat interface, user messages, AI responses, loading state, error handling, clear chat, conversation history.", checklist: ["Chat interface works", "AI responses render", "Loading state shown", "Errors handled", "Clear chat works", "History preserved"], deliverables: ["Live URL", "GitHub URL"], marks: 100 },
  { m: "AHS-AI-M06", id: "M06-H01", title: "Professional Project Setup", brief: "Create: src/, components/, services/, assets/, utils/, README.md, .gitignore, package.json.", checklist: ["All folders created", "README.md written", ".gitignore present", "package.json with scripts"], deliverables: ["GitHub URL"], marks: 100 },
  { m: "AHS-AI-M07", id: "M07-H01", title: "GitHub Project Workflow", brief: "Create repository, create README, push project, create branch, make changes, commit, merge, push final version.", checklist: ["Repository created", "README present", "Feature branch merged", "Final version pushed"], deliverables: ["GitHub URL"], marks: 100 },
  { m: "AHS-AI-M08", id: "M08-H01", title: "AI Notes Application", brief: "Build notes with: register, login, create notes, edit notes, delete notes, Firebase Authentication, Firestore, user-specific notes.", checklist: ["Register and login work", "Notes are user-specific", "Create, edit and delete work", "Data persists in Firestore"], deliverables: ["Live URL", "GitHub URL"], marks: 100 },
  { m: "AHS-AI-M09", id: "M09-H01", title: "Deploy AI Application", brief: "Push project to GitHub, connect Vercel, configure environment variables, deploy, test application, submit live URL.", checklist: ["Pushed to GitHub", "Connected to Vercel", "Env variables configured", "Live URL works"], deliverables: ["Live URL", "GitHub URL"], marks: 100 },
  { m: "AHS-AI-M10", id: "M10-H01", title: "10-Bug Debugging Challenge", brief: "Take an application containing 10 intentional bugs. For each: identify the bug, find the cause, fix it, test the solution, explain the solution.", checklist: ["All 10 bugs identified", "Causes documented", "Fixes tested", "Explanations written"], deliverables: ["GitHub URL", "Text explanation"], marks: 100 },
  { m: "AHS-AI-M11", id: "CAP-01", title: "Capstone Milestone 01 — Project Idea", brief: "Submit the AI Student Assistant project idea.", checklist: ["Problem statement written", "Target users identified"], deliverables: ["Text explanation"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-02", title: "Capstone Milestone 02 — Requirements", brief: "Submit application requirements covering auth, AI, backend, frontend and deployment.", checklist: ["Functional requirements listed", "Non-functional requirements listed"], deliverables: ["Text explanation"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-03", title: "Capstone Milestone 03 — UI Design", brief: "Submit the UI design for dashboard, navigation and AI interface.", checklist: ["Dashboard layout designed", "Navigation defined", "AI interface mocked"], deliverables: ["Screenshots", "Text explanation"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-04", title: "Capstone Milestone 04 — Frontend", brief: "Submit a working responsive frontend with navigation and clean UI.", checklist: ["Responsive dashboard works", "Navigation works", "Clean UI"], deliverables: ["Live URL", "GitHub URL"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-05", title: "Capstone Milestone 05 — AI Integration", brief: "Integrate AI chat, study notes generator, summarizer and quiz generator.", checklist: ["AI chat works", "Notes generator works", "Summarizer works", "Quiz generator works"], deliverables: ["Live URL"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-06", title: "Capstone Milestone 06 — Firebase", brief: "Integrate Firebase authentication, Firestore and storage where required.", checklist: ["Auth integrated", "Firestore integrated", "User data isolated"], deliverables: ["Live URL"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-07", title: "Capstone Milestone 07 — Testing", brief: "Submit a testing report covering features, AI outputs and edge cases.", checklist: ["Test cases listed", "Results documented", "Bugs fixed"], deliverables: ["Text explanation"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-08", title: "Capstone Milestone 08 — GitHub", brief: "Submit the GitHub repository with README, Git history and clean structure.", checklist: ["Repository public and clean", "README complete", "Meaningful commits"], deliverables: ["GitHub URL"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-09", title: "Capstone Milestone 09 — Deployment", brief: "Submit the production build on Vercel with environment variables configured.", checklist: ["Production build passes", "Live URL works", "Env configured"], deliverables: ["Live URL"], marks: 10 },
  { m: "AHS-AI-M11", id: "CAP-10", title: "Capstone Milestone 10 — Final Presentation", brief: "Demonstrate the completed project: demo, architecture, challenges, live URL.", checklist: ["Live demo works", "Architecture explained", "Final URLs submitted"], deliverables: ["Live URL", "Text explanation"], marks: 10 },
];

// ---------------------------------------------------------------- tests
type Q = { id: string; kind: "mcq" | "short" | "code"; prompt: string; options?: string[]; answerKeys?: string[]; points: number };
const mcq = (id: string, prompt: string, options: string[], key: number): Q => ({ id, kind: "mcq", prompt, options, answerKeys: [options[key]], points: 5 });
const short = (id: string, prompt: string, keys: string[]): Q => ({ id, kind: "short", prompt, answerKeys: keys, points: 5 });
const code = (id: string, prompt: string): Q => ({ id, kind: "code", prompt, points: 10 });

const testBank: Record<string, Q[]> = {
  "AHS-AI-M01": [
    mcq("M01-T01-Q01", "Which best describes Artificial Intelligence?", ["Software that performs tasks requiring human-like intelligence", "Any program with a database", "Only robots with cameras", "Spreadsheets with formulas"], 0),
    mcq("M01-T01-Q02", "Which is an example of generative AI?", ["A model that creates new text or images", "A hard drive", "A network router", "A SQL query"], 0),
    mcq("M01-T01-Q03", "LLM stands for?", ["Large Language Model", "Local Logic Machine", "Linked List Manager", "Low Latency Module"], 0),
    mcq("M01-T01-Q04", "Correct order of the modern AI development workflow?", ["Idea, Requirements, Model, App, Testing, Deployment", "Deployment, Idea, Testing, App", "Requirements, Deployment, Idea", "Model, Idea, Requirements"], 0),
    mcq("M01-T01-Q05", "A key difference between traditional software and AI software is that AI software…", ["Learns patterns from data instead of fixed rules", "Never needs testing", "Cannot have a user interface", "Runs without computers"], 0),
    short("M01-T01-Q06", "What does the 'G' in AGI stand for?", ["general"]),
  ],
  "AHS-AI-M02": [
    mcq("M02-T01-Q01", "Where do you get a Gemini API key?", ["Google AI Studio", "A text editor", "GitHub Desktop", "Vercel dashboard"], 0),
    mcq("M02-T01-Q02", "Which Gemini model is typically fastest and cheapest for simple tasks?", ["Gemini Flash", "The largest Pro model", "A video model", "An embedding model"], 0),
    mcq("M02-T01-Q03", "What does temperature control in a model?", ["Randomness and creativity of output", "API price", "Font size", "Internet speed"], 0),
    mcq("M02-T01-Q04", "System instructions are used to…", ["Set the model's role and behaviour", "Install the SDK", "Deploy the app", "Format hard drives"], 0),
    mcq("M02-T01-Q05", "When comparing two prompts you should…", ["Test both on the same inputs and compare", "Use different inputs each time", "Pick the longer one", "Never re-test"], 0),
    short("M02-T01-Q06", "Name the Google tool where you interactively test Gemini prompts.", ["google ai studio", "ai studio"]),
  ],
  "AHS-AI-M03": [
    mcq("M03-T01-Q01", "Which prompt is best?", ["Write a professional apology email about a 2-day shipping delay, under 150 words", "Write an email", "Something about sorry", "Email now"], 0),
    mcq("M03-T01-Q02", "Role prompting means…", ["Telling the model which expert role to act as", "Deleting old prompts", "Paying for prompts", "Restarting the model"], 0),
    mcq("M03-T01-Q03", "For reliable machine-readable output you should request…", ["Structured JSON", "A poem", "Screenshots", "Silence"], 0),
    mcq("M03-T01-Q04", "Context engineering is about…", ["Giving the model the right background and examples", "Making windows bigger", "Buying GPUs", "Writing CSS"], 0),
    mcq("M03-T01-Q05", "The best way to improve a weak prompt is to…", ["Draft, test, refine in versions and compare", "Make it shorter blindly", "Remove all context", "Use it once and stop"], 0),
    short("M03-T01-Q06", "Which output format should you request for machine consumption?", ["json"]),
  ],
  "AHS-AI-M04": [
    mcq("M04-T01-Q01", "First rule of using AI-generated code?", ["Verify and test it before trusting it", "Ship it immediately", "Never read it", "Delete the tests"], 0),
    mcq("M04-T01-Q02", "Best way to get AI help debugging?", ["Paste the error message plus the relevant code", "Say it is broken", "Send a desktop screenshot", "Restart and hope"], 0),
    mcq("M04-T01-Q03", "Refactoring means…", ["Restructuring code without changing behaviour", "Rewriting from scratch", "Adding more bugs", "Changing the language"], 0),
    mcq("M04-T01-Q04", "AI code assistants can…", ["Hallucinate APIs that do not exist", "Guarantee security", "Replace all testing", "Read your mind"], 0),
    mcq("M04-T01-Q05", "A good AI-assisted workflow keeps…", ["Humans in charge with small reviewable diffs", "No human review", "One giant unreviewed commit", "Secrets in prompts"], 0),
    short("M04-T01-Q06", "Which git command shows recent commits?", ["git log"]),
  ],
  "AHS-AI-M05": [
    mcq("M05-T01-Q01", "Where must the AI API key live?", ["Server-side only", "In the browser bundle", "In a code comment", "In localStorage"], 0),
    mcq("M05-T01-Q02", "While waiting for AI output the UI should show…", ["A loading state", "A blank crash", "The API key", "Nothing forever"], 0),
    mcq("M05-T01-Q03", "If the user submits empty input you should…", ["Validate and show a friendly message", "Call the API anyway", "Crash the page", "Charge them"], 0),
    mcq("M05-T01-Q04", "A basic AI app architecture is…", ["Frontend, API route, AI model", "Browser with the key in the URL", "Model to printer", "API to API to API"], 0),
    mcq("M05-T01-Q05", "When the AI API fails you should…", ["Show a clear error and offer retry", "Freeze the page", "Expose the key", "Delete user data"], 0),
    short("M05-T01-Q06", "Which HTTP method sends data to generate content?", ["post"]),
  ],
  "AHS-AI-M06": [
    mcq("M06-T01-Q01", "Recommended editor for this bootcamp?", ["VS Code", "Notepad", "MS Paint", "ed"], 0),
    mcq("M06-T01-Q02", "Which folder typically holds reusable UI pieces?", ["components/", "node_modules/", ".git/", "dist/"], 0),
    mcq("M06-T01-Q03", "package.json stores…", ["Project metadata, scripts and dependencies", "Your passwords", "Movies", "Browser history"], 0),
    mcq("M06-T01-Q04", ".gitignore is used to…", ["Exclude files like node_modules and .env from git", "Ignore teammates", "Delete code", "Speed up wifi"], 0),
    mcq("M06-T01-Q05", "Hot reload means…", ["The dev server refreshes the app on save", "The laptop overheats", "Reloading batteries", "Restarting wifi"], 0),
    short("M06-T01-Q06", "Which command starts the Next.js dev server?", ["npm run dev"]),
  ],
  "AHS-AI-M07": [
    mcq("M07-T01-Q01", "git init does what?", ["Creates a new local repository", "Deletes history", "Pushes to GitHub", "Installs git"], 0),
    mcq("M07-T01-Q02", "Correct commit workflow order?", ["add, commit, push", "push, add, commit", "commit, delete, push", "push, push, push"], 0),
    mcq("M07-T01-Q03", "A branch is…", ["A separate line of work you can merge later", "A tree part", "A wifi signal", "A GitHub fee"], 0),
    mcq("M07-T01-Q04", "Good commit messages are…", ["Short, meaningful descriptions of the change", "asdf", "Empty", "Random emojis only"], 0),
    mcq("M07-T01-Q05", "Before merging a feature branch you should…", ["Review the diff and test it", "Delete main", "Push secrets", "Skip review always"], 0),
    short("M07-T01-Q06", "Which command stages all changes?", ["git add ."]),
  ],
  "AHS-AI-M08": [
    mcq("M08-T01-Q01", "Firestore stores data as…", ["Collections of documents", "Excel macros", "Zip files", "Emails"], 0),
    mcq("M08-T01-Q02", "Firebase Authentication handles…", ["Register, login and logout", "CSS styling", "Domain buying", "Laptop repair"], 0),
    mcq("M08-T01-Q03", "CRUD stands for…", ["Create, Read, Update, Delete", "Copy, Run, Undo, Deploy", "Cache, Retry, Upload, Download", "None of these"], 0),
    mcq("M08-T01-Q04", "User data must be isolated by…", ["The logged-in user's id in rules and queries", "Trusting the client", "Public read for all", "No rules"], 0),
    mcq("M08-T01-Q05", "Firebase Storage is used for…", ["Files like images and uploads", "Running SQL", "Sending email", "Mining crypto"], 0),
    short("M08-T01-Q06", "Which Firebase service is the NoSQL database?", ["firestore", "cloud firestore"]),
  ],
  "AHS-AI-M09": [
    mcq("M09-T01-Q01", "Vercel deploys directly from…", ["A GitHub repository", "A USB stick", "Email attachments", "Fax"], 0),
    mcq("M09-T01-Q02", "Environment variables on Vercel are set in…", ["Project Settings, Environment Variables", "The HTML file", "A tweet", "The DNS"], 0),
    mcq("M09-T01-Q03", "A production build…", ["Compiles and optimizes the app for hosting", "Deletes source code", "Only works offline", "Takes no time ever"], 0),
    mcq("M09-T01-Q04", "If a deploy fails, first check…", ["The build logs", "The weather", "Your mouse", "Nothing"], 0),
    mcq("M09-T01-Q05", "Secrets must…", ["Live in env vars, never in git", "Be pasted in chat", "Be committed for backup", "Be shared publicly"], 0),
    short("M09-T01-Q06", "Which file holds local secrets and must never be committed?", [".env"]),
  ],
  "AHS-AI-M10": [
    mcq("M10-T01-Q01", "First step when you see an error?", ["Read the error message and stack trace", "Panic", "Delete the project", "Ignore it"], 0),
    mcq("M10-T01-Q02", "A stack trace tells you…", ["Where the error happened and the call path", "Your grade", "The time", "Nothing useful"], 0),
    mcq("M10-T01-Q03", "Bisecting a bug means…", ["Narrowing down the failing change step by step", "Cutting cables", "Two people arguing", "Guessing once"], 0),
    mcq("M10-T01-Q04", "After fixing AI-generated code you must…", ["Test the solution and explain what was wrong", "Ship without testing", "Hide the fix", "Blame the AI"], 0),
    mcq("M10-T01-Q05", "A good bug report includes…", ["Repro steps, expected vs actual, logs", "Just anger", "No details", "Screenshots of lunch"], 0),
    short("M10-T01-Q06", "Which browser tool lets you set JavaScript breakpoints?", ["devtools", "developer tools", "chrome devtools"]),
  ],
};

const testConfig: Record<string, { title: string; questions: number; duration: number; pass: number; mode: "practice" | "exam" }> = {
  "AHS-AI-M01": { title: "AI Fundamentals Test", questions: 15, duration: 20, pass: 60, mode: "practice" },
  "AHS-AI-M02": { title: "Gemini & AI Studio Test", questions: 15, duration: 20, pass: 60, mode: "practice" },
  "AHS-AI-M03": { title: "Prompt Engineering Test", questions: 20, duration: 30, pass: 60, mode: "practice" },
  "AHS-AI-M04": { title: "AI-Assisted Development Test", questions: 20, duration: 30, pass: 60, mode: "practice" },
  "AHS-AI-M05": { title: "AI Application Development Test", questions: 20, duration: 30, pass: 60, mode: "practice" },
  "AHS-AI-M06": { title: "Development Environment Test", questions: 15, duration: 20, pass: 60, mode: "practice" },
  "AHS-AI-M07": { title: "Git & GitHub Test", questions: 20, duration: 25, pass: 60, mode: "practice" },
  "AHS-AI-M08": { title: "Firebase Backend Test", questions: 20, duration: 30, pass: 60, mode: "practice" },
  "AHS-AI-M09": { title: "Deployment Test", questions: 15, duration: 20, pass: 60, mode: "practice" },
  "AHS-AI-M10": { title: "Debugging & Maintenance Test", questions: 20, duration: 30, pass: 60, mode: "practice" },
};

// ---------------------------------------------------------------- main
async function main() {
  console.log("Seeding LMS (master course)...");
  const batch = db.batch();
  let writes = 0;
  const put = (collection: string, id: string, data: Record<string, unknown>) => {
    batch.set(db.collection(collection).doc(id), data);
    writes++;
  };

  // Clean legacy seed docs (previous course id) so students see one course.
  for (const col of ["lms_courses", "lms_modules", "lms_lessons", "lms_practices", "lms_handsons", "lms_tests"]) {
    const snap = await db.collection(col).where("courseId", "==", LEGACY_COURSE_ID).get();
    snap.docs.forEach((d) => { batch.delete(d.ref); writes++; });
  }
  const legacyCourse = await db.collection("lms_courses").doc(LEGACY_COURSE_ID).get();
  if (legacyCourse.exists) { batch.delete(legacyCourse.ref); writes++; }

  put("lms_courses", COURSE_ID, {
    id: COURSE_ID,
    title: "AI Application Development Bootcamp",
    slug: COURSE_ID,
    description: "A practical, project-based bootcamp where students learn AI fundamentals, prompt engineering, AI-assisted development, AI API integration, Firebase, GitHub, deployment, debugging and complete AI-powered applications.",
    track: "ai",
    level: "Beginner to Intermediate",
    learningStyle: "Theory + Practice + Hands-on + Test + Projects",
    order: 1,
    status: "published",
    createdBy: "seed",
    createdAt: now(),
    updatedAt: now(),
  });

  for (const m of modules) {
    put("lms_modules", m.id, { ...m, courseId: COURSE_ID, status: "published", createdAt: now(), updatedAt: now() });
  }

  lessons.forEach((l, i) => {
    put("lms_lessons", l.id, {
      id: l.id, courseId: COURSE_ID, moduleId: l.m, title: l.title, order: i + 1,
      body: `# ${l.title}\n\n${FOCUS[l.m] || ""}\n\n## Topics\n${l.topics.map((t) => `- ${t}`).join("\n")}\n\n## Study guidance\nWork through each topic above in order. Take notes, then complete the practice activities for this module.`,
      topics: l.topics, estimatedMinutes: l.minutes, status: "published",
      createdAt: now(), updatedAt: now(),
    });
  });

  practices.forEach((p, i) => {
    put("lms_practices", p.id, {
      id: p.id, courseId: COURSE_ID, moduleId: p.m, title: p.title, prompt: p.task,
      submissionType: p.type, maxMarks: 10, order: i + 1, status: "published",
      createdAt: now(), updatedAt: now(),
    });
  });

  handsons.forEach((h, i) => {
    put("lms_handsons", h.id, {
      id: h.id, courseId: COURSE_ID, moduleId: h.m, title: h.title, brief: h.brief,
      checklist: h.checklist, deliverables: h.deliverables, maxMarks: h.marks,
      order: i + 1, status: "published", createdAt: now(), updatedAt: now(),
    });
  });

  for (const m of modules) {
    const cfg = testConfig[m.id];
    if (!cfg) continue; // capstone module has no test
    const tid = `${m.id.replace("AHS-AI-", "")}-T01`;
    put("lms_tests", tid, {
      id: tid, courseId: COURSE_ID, moduleId: m.id, title: cfg.title, mode: cfg.mode,
      timeLimitMinutes: cfg.duration, passPercent: cfg.pass,
      questionCount: cfg.questions, maxAttempts: 1,
      strict: { fullscreen: true, tabMonitoring: true, focusMonitoring: true, activityLogging: true, confirmSubmission: true },
      shuffleQuestions: true, shuffleOptions: true,
      order: 1, status: "published",
      questions: testBank[m.id] || [],
      createdAt: now(), updatedAt: now(),
    });
  }

  await batch.commit();
  console.log(`LMS master seed complete (${writes} writes): 1 course, ${modules.length} modules, ${lessons.length} lessons, ${practices.length} practices, ${handsons.length} hands-on (incl. CAP-01..CAP-10), 10 tests with starter banks.`);
  console.log("NOTE: tests carry starter question banks (6 each). Admins can add questions to reach the configured totals via the Courses editor.");
  process.exit(0);
}

main().catch((error) => {
  console.error("LMS seeding failed:", error);
  process.exit(1);
});
