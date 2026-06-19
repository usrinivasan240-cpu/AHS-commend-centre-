"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Sparkles,
  Copy,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Loader2,
  BookOpen,
  Code,
  PenTool,
  Clock,
  Hash,
  BarChart3,
  Mic,
  Upload,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

interface GeneratedQuestion {
  id: number;
  type: "mcq" | "coding" | "essay" | "voice";
  voiceSubtype?: "pronunciation" | "repeat-after-me" | "communication";
  question: string;
  speakText?: string;
  options?: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  timeLimit?: number;
}

function generateQuestions(config: {
  subject: string;
  topic: string;
  type: string;
  count: number;
  difficulty: string;
}): GeneratedQuestion[] {
  const { subject, topic, type, count, difficulty } = config;
  const questions: GeneratedQuestion[] = [];

  const mcqTemplates: Record<string, { q: string; opts: string[]; ans: string }[]> = {
    react: [
      { q: "What does useState return?", opts: ["A state variable and setter", "Just the state", "An object with data", "A promise"], ans: "A state variable and setter" },
      { q: "What is the purpose of useEffect?", opts: ["Handle side effects", "Manage state", "Render JSX", "Style components"], ans: "Handle side effects" },
      { q: "Which hook is used for context?", opts: ["useContext", "useRef", "useMemo", "useCallback"], ans: "useContext" },
      { q: "What is JSX?", opts: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JS Xpress"], ans: "JavaScript XML" },
      { q: "How do you pass props?", opts: ["Via function parameters", "Via attributes in JSX", "Via state", "Via context only"], ans: "Via attributes in JSX" },
      { q: "What is a controlled component?", opts: ["Component with state managing input", "Component without state", "Component with Redux", "Component with props only"], ans: "Component with state managing input" },
      { q: "What does useRef return?", opts: ["A mutable ref object", "A DOM element directly", "A state variable", "A promise"], ans: "A mutable ref object" },
      { q: "Which is NOT a React hook?", opts: ["useComponent", "useState", "useEffect", "useReducer"], ans: "useComponent" },
      { q: "What is prop drilling?", opts: ["Passing props through multiple levels", "Breaking props", "Creating props", "Deleting props"], ans: "Passing props through multiple levels" },
      { q: "What is the virtual DOM?", opts: ["A lightweight copy of the real DOM", "A database", "A browser API", "A testing framework"], ans: "A lightweight copy of the real DOM" },
    ],
    javascript: [
      { q: "What does '===' check?", opts: ["Value and type", "Value only", "Reference only", "Type only"], ans: "Value and type" },
      { q: "What is a closure?", opts: ["Function with access to outer scope", "Closed loop", "End of execution", "Empty function"], ans: "Function with access to outer scope" },
      { q: "What is the event loop?", opts: ["Mechanism for handling async operations", "A loop for events", "CSS animation", "A for loop"], ans: "Mechanism for handling async operations" },
      { q: "What does Array.map return?", opts: ["New array", "Same array", "Object", "Boolean"], ans: "New array" },
      { q: "What is 'this' in arrow functions?", opts: ["Enclosing scope's this", "Window object", "Class instance", "undefined"], ans: "Enclosing scope's this" },
      { q: "What does Promise.all do?", opts: ["Resolves when all promises resolve", "Resolves on first", "Rejects all", "Cancels all"], ans: "Resolves when all promises resolve" },
      { q: "What is destructuring?", opts: ["Extracting values from objects/arrays", "Destroying data", "Creating objects", "Merging arrays"], ans: "Extracting values from objects/arrays" },
      { q: "What does 'typeof null' return?", opts: ["'object'", "'null'", "'undefined'", "'boolean'"], ans: "'object'" },
      { q: "What is the spread operator?", opts: ["... expands iterables", "* multiplies", "+ adds", ": defines"], ans: "... expands iterables" },
      { q: "What is async/await?", opts: ["Promise syntax sugar", "Loop construct", "Error type", "Variable declaration"], ans: "Promise syntax sugar" },
    ],
    python: [
      { q: "What is PEP 8?", opts: ["Python style guide", "A Python version", "A library", "An IDE"], ans: "Python style guide" },
      { q: "What does 'def' do?", opts: ["Defines a function", "Defines a class", "Defines a variable", "Deletes a variable"], ans: "Defines a function" },
      { q: "What is a list comprehension?", opts: ["Compact list creation", "A type of loop", "A class method", "A module import"], ans: "Compact list creation" },
      { q: "What is 'self' in Python?", opts: ["Instance reference", "Class name", "Global variable", "Return value"], ans: "Instance reference" },
      { q: "What does 'import' do?", opts: ["Loads a module", "Creates a variable", "Defines a function", "Prints output"], ans: "Loads a module" },
      { q: "What is a decorator?", opts: ["Function that modifies another function", "A comment", "A variable type", "A loop"], ans: "Function that modifies another function" },
      { q: "What is 'None' in Python?", opts: ["Null value", "Zero", "Empty string", "False"], ans: "Null value" },
      { q: "What does len() return?", opts: ["Length of object", "Last element", "Type of object", "Sum of elements"], ans: "Length of object" },
      { q: "What is a dictionary?", opts: ["Key-value pairs", "Ordered list", "Tuple", "Set"], ans: "Key-value pairs" },
      { q: "What is 'try/except'?", opts: ["Error handling", "Loop control", "Import syntax", "Function definition"], ans: "Error handling" },
    ],
    nodejs: [
      { q: "What is Node.js?", opts: ["JavaScript runtime", "A framework", "A database", "A browser"], ans: "JavaScript runtime" },
      { q: "What does 'require' do?", opts: ["Imports a module", "Exports a module", "Creates a server", "Reads files"], ans: "Imports a module" },
      { q: "What is Express.js?", opts: ["Web framework for Node", "A database", "A testing tool", "A CSS framework"], ans: "Web framework for Node" },
      { q: "What is middleware?", opts: ["Functions that process requests", "Database queries", "Frontend code", "Type definitions"], ans: "Functions that process requests" },
      { q: "What is npm?", opts: ["Node package manager", "Node programming model", "New project maker", "Network protocol manager"], ans: "Node package manager" },
      { q: "What does 'res.json()' do?", opts: ["Sends JSON response", "Parses HTML", "Reads files", "Creates database"], ans: "Sends JSON response" },
      { q: "What is event-driven in Node?", opts: ["Non-blocking I/O pattern", "Synchronous code", "CSS animations", "Database queries"], ans: "Non-blocking I/O pattern" },
      { q: "What is a callback?", opts: ["Function passed to another function", "Return value", "Variable", "Class method"], ans: "Function passed to another function" },
      { q: "What is the 'fs' module?", opts: ["File system module", "Font system", "Format system", "Flow system"], ans: "File system module" },
      { q: "What does 'module.exports' do?", opts: ["Exports module members", "Imports modules", "Creates files", "Runs tests"], ans: "Exports module members" },
    ],
  };

  const codingTemplates: Record<string, { q: string; answer: string }[]> = {
    react: [
      { q: "Write a custom hook useLocalStorage that syncs state with localStorage.", answer: "function useLocalStorage(key, init) { const [val, setVal] = useState(() => { const item = localStorage.getItem(key); return item ? JSON.parse(item) : init; }); const set = (v) => { setVal(v); localStorage.setItem(key, JSON.stringify(v)); }; return [val, set]; }" },
      { q: "Write a Debounce component using useEffect and setTimeout.", answer: "function useDebounce(value, delay) { const [debounced, setDebounced] = useState(value); useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]); return debounced; }" },
      { q: "Write a React component that fetches and displays a list of users.", answer: "function UserList() { const [users, setUsers] = useState([]); useEffect(() => { fetch('/api/users').then(r => r.json()).then(setUsers); }, []); return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>; }" },
    ],
    javascript: [
      { q: "Write a function to flatten a nested array without using flat().", answer: "function flatten(arr) { return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []); }" },
      { q: "Implement a debounce function.", answer: "function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }" },
      { q: "Write a deep clone function for objects.", answer: "function deepClone(obj) { if (obj === null || typeof obj !== 'object') return obj; const clone = Array.isArray(obj) ? [] : {}; for (const key in obj) { clone[key] = deepClone(obj[key]); } return clone; }" },
    ],
    python: [
      { q: "Write a function to check if a string is a palindrome.", answer: "def is_palindrome(s): return s == s[::-1]" },
      { q: "Write a binary search implementation.", answer: "def binary_search(arr, target): low, high = 0, len(arr)-1\n    while low <= high:\n        mid = (low+high)//2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid+1\n        else: high = mid-1\n    return -1" },
      { q: "Write a class with inheritance in Python.", answer: "class Animal:\n    def __init__(self, name): self.name = name\n    def speak(self): pass\nclass Dog(Animal):\n    def speak(self): return 'Woof'" },
    ],
  };

  const essayTemplates: Record<string, { q: string; answer: string }[]> = {
    react: [
      { q: "Explain the React component lifecycle and how hooks map to it.", answer: "The React lifecycle has mounting, updating, and unmounting phases. useEffect with empty deps maps to componentDidMount, cleanup to componentWillUnmount, and deps array to componentDidUpdate." },
      { q: "Compare and contrast controlled vs uncontrolled components.", answer: "Controlled components have their value managed by React state via value/onChange props. Uncontrolled components use refs to access DOM values directly. Controlled gives more control; uncontrolled is simpler for basic forms." },
    ],
    javascript: [
      { q: "Explain closures and their practical applications in JavaScript.", answer: "A closure is a function that retains access to its outer scope variables even after the outer function has returned. Practical uses include data privacy, partial application, memoization, and module patterns." },
      { q: "Describe the JavaScript event loop and how async operations work.", answer: "The event loop continuously checks the call stack and task queue. When the stack is empty, it picks the next task from the queue. Microtasks (Promises) have priority over macrotasks (setTimeout). Async/await syntactically wraps promise chains." },
    ],
    python: [
      { q: "Explain the GIL in Python and its impact on multi-threading.", answer: "The Global Interpreter Lock (GIL) prevents multiple threads from executing Python bytecode simultaneously. This means CPU-bound tasks don't benefit from threading. Use multiprocessing for CPU-bound work and threading for I/O-bound work." },
    ],
  };

  const voiceTemplates: { q: string; speakText: string; voiceSubtype: string; timeLimit: number; answer: string }[] = [
    // Pronunciation - tech words
    { q: "Pronounce this word clearly: Component", speakText: "Component", voiceSubtype: "pronunciation", timeLimit: 30, answer: "Component" },
    { q: "Pronounce this word clearly: useState", speakText: "use State", voiceSubtype: "pronunciation", timeLimit: 30, answer: "useState" },
    { q: "Pronounce this word clearly: asynchronous", speakText: "asynchronous", voiceSubtype: "pronunciation", timeLimit: 30, answer: "asynchronous" },
    { q: "Pronounce this word clearly: polymorphism", speakText: "polymorphism", voiceSubtype: "pronunciation", timeLimit: 30, answer: "polymorphism" },
    { q: "Pronounce this word clearly: deployment", speakText: "deployment", voiceSubtype: "pronunciation", timeLimit: 30, answer: "deployment" },
    { q: "Pronounce this word clearly: repository", speakText: "repository", voiceSubtype: "pronunciation", timeLimit: 30, answer: "repository" },
    { q: "Pronounce this word clearly: refactoring", speakText: "refactoring", voiceSubtype: "pronunciation", timeLimit: 30, answer: "refactoring" },
    { q: "Pronounce this word clearly: middleware", speakText: "middleware", voiceSubtype: "pronunciation", timeLimit: 30, answer: "middleware" },
    { q: "Pronounce this word clearly: recursion", speakText: "recursion", voiceSubtype: "pronunciation", timeLimit: 30, answer: "recursion" },
    { q: "Pronounce this word clearly: environment", speakText: "environment", voiceSubtype: "pronunciation", timeLimit: 30, answer: "environment" },
    // Repeat after me
    { q: "Listen carefully and repeat this sentence exactly.", speakText: "The quick brown fox jumps over the lazy dog near the river bank.", voiceSubtype: "repeat-after-me", timeLimit: 30, answer: "The quick brown fox jumps over the lazy dog near the river bank." },
    { q: "Listen carefully and repeat this sentence exactly.", speakText: "React uses a virtual DOM to efficiently update the user interface.", voiceSubtype: "repeat-after-me", timeLimit: 45, answer: "React uses a virtual DOM to efficiently update the user interface." },
    { q: "Listen carefully and repeat this sentence exactly.", speakText: "Python is a versatile programming language used for web development and data science.", voiceSubtype: "repeat-after-me", timeLimit: 45, answer: "Python is a versatile programming language used for web development and data science." },
    { q: "Listen carefully and repeat this sentence exactly.", speakText: "TypeScript adds static type checking to JavaScript for better code quality.", voiceSubtype: "repeat-after-me", timeLimit: 45, answer: "TypeScript adds static type checking to JavaScript for better code quality." },
    { q: "Listen carefully and repeat this sentence exactly.", speakText: "The developer deployed the application to the production server at midnight.", voiceSubtype: "repeat-after-me", timeLimit: 45, answer: "The developer deployed the application to the production server at midnight." },
    // Communication - answer questions
    { q: "What is your name and what programming language do you specialize in?", speakText: "What is your name and what programming language do you specialize in?", voiceSubtype: "communication", timeLimit: 60, answer: "Expected: Clear introduction with name and primary programming language." },
    { q: "Describe your most challenging project in 2-3 sentences.", speakText: "Describe your most challenging project in two to three sentences.", voiceSubtype: "communication", timeLimit: 90, answer: "Expected: Clear explanation of challenge, approach, and outcome." },
    { q: "How do you handle working under tight deadlines?", speakText: "How do you handle working under tight deadlines?", voiceSubtype: "communication", timeLimit: 60, answer: "Expected: Mentions prioritization, communication, and time management skills." },
    { q: "Explain what an API is to a non-technical person.", speakText: "Explain what an API is to a non-technical person.", voiceSubtype: "communication", timeLimit: 90, answer: "Expected: Simple analogy like a waiter taking orders between kitchen and customer." },
    { q: "Why are you interested in this role and what makes you a good fit?", speakText: "Why are you interested in this role and what makes you a good fit?", voiceSubtype: "communication", timeLimit: 90, answer: "Expected: Genuine interest, relevant skills, and cultural fit." },
  ];

  const getTemplates = (subject: string, type: string) => {
    if (type === "voice") return voiceTemplates;
    const sub = subject.toLowerCase();
    const templates: Record<string, Record<string, any[]>> = { mcq: mcqTemplates, coding: codingTemplates, essay: essayTemplates };
    const bank = templates[type] || mcqTemplates;
    for (const key of Object.keys(bank)) {
      if (sub.includes(key) || key.includes(sub)) return bank[key];
    }
    return bank[Object.keys(bank)[0]] || [];
  };

  const templates = getTemplates(subject + " " + topic, type);
  const marksByDifficulty: Record<string, number> = { easy: 5, medium: 10, hard: 20 };
  const marks = marksByDifficulty[difficulty] || 10;

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const q: GeneratedQuestion = {
      id: i + 1,
      type: type as "mcq" | "coding" | "essay" | "voice",
      question: template.q,
      difficulty: difficulty as "easy" | "medium" | "hard",
      marks,
    };
    if (type === "mcq" && template.opts) {
      q.options = template.opts;
      q.correctAnswer = template.ans;
    }
    if (type === "coding" || type === "essay") {
      q.sampleAnswer = template.answer;
    }
    if (type === "voice") {
      q.voiceSubtype = template.voiceSubtype;
      q.speakText = template.speakText;
      q.sampleAnswer = template.answer;
      q.timeLimit = template.timeLimit || 60;
    }
    questions.push(q);
  }
  return questions;
}

export default function AssessmentGeneratorContent() {
  const { add } = useFirestoreActions(COLLECTIONS.ASSESSMENTS);
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    questionType: "mcq",
    numberOfQuestions: 10,
    difficulty: "medium",
    duration: 60,
    passingMarks: 50,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedQuestions, setUploadedQuestions] = useState<GeneratedQuestion[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [isPublishingUpload, setIsPublishingUpload] = useState(false);
  const [uploadPublished, setUploadPublished] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
      const questions = generateQuestions({
        subject: form.subject,
        topic: form.topic,
        type: form.questionType,
        count: form.numberOfQuestions,
        difficulty: form.difficulty,
      });
      setGeneratedQuestions(questions);
      setIsGenerating(false);
      setActiveTab("preview");
      try {
        await add({
          title: `${form.subject} - ${form.topic}`,
          description: `${form.difficulty} level ${form.questionType.toUpperCase()} assessment on ${form.subject}${form.topic ? ": " + form.topic : ""}`,
          type: form.questionType,
          difficulty: form.difficulty,
          questionCount: form.numberOfQuestions,
          questions,
          duration: form.duration,
          passingMarks: form.passingMarks,
          totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
          status: "completed",
        });
      } catch (err) {
        console.error("Failed to save assessment:", err);
      }
    }, 2000);
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const handlePublish = async (questionsOverride?: GeneratedQuestion[]) => {
    const qs = questionsOverride || generatedQuestions;
    if (qs.length === 0) return;
    setIsPublishing(true);
    try {
      const result = await add({
        title: `${form.subject} - ${form.topic}`,
        description: `${form.difficulty} level ${form.questionType.toUpperCase()} assessment on ${form.subject}${form.topic ? ": " + form.topic : ""}`,
        type: form.questionType,
        difficulty: form.difficulty,
        questionCount: qs.length,
        questions: qs,
        duration: form.duration,
        passingMarks: form.passingMarks,
        totalMarks: qs.reduce((sum, q) => sum + q.marks, 0),
        status: "published",
        scheduledDate: new Date().toISOString(),
      });
      setLastSavedId(result as string);
    } catch (err) {
      console.error("Failed to publish assessment:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleAnswer = (id: number) => {
    setShowAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const parseUploadedFile = (file: File) => {
    setUploadError("");
    setUploadedQuestions([]);
    setUploadPublished(false);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          setUploadError("File must have a header row and at least one question row.");
          return;
        }

        const header = rows[0].map((h: any) => String(h || "").toLowerCase().trim());

        const qCol = header.findIndex((h: string) => h.includes("question"));
        const typeCol = header.findIndex((h: string) => h.includes("type"));
        const optACol = header.findIndex((h: string) => h === "option a" || h === "optiona" || h === "opt a" || h === "a");
        const optBCol = header.findIndex((h: string) => h === "option b" || h === "optionb" || h === "opt b" || h === "b");
        const optCCol = header.findIndex((h: string) => h === "option c" || h === "optionc" || h === "opt c" || h === "c");
        const optDCol = header.findIndex((h: string) => h === "option d" || h === "optiond" || h === "opt d" || h === "d");
        const answerCol = header.findIndex((h: string) => h.includes("answer") || h.includes("correct"));
        const marksCol = header.findIndex((h: string) => h.includes("mark"));
        const diffCol = header.findIndex((h: string) => h.includes("difficult") || h.includes("level"));
        const speakCol = header.findIndex((h: string) => h.includes("speak") || h.includes("audio") || h.includes("pronunciation"));

        if (qCol === -1) {
          setUploadError("Could not find a 'question' column. Required columns: question (required), type, optionA-D, answer, marks, difficulty.");
          return;
        }

        const questions: GeneratedQuestion[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[qCol]) continue;

          const questionText = String(row[qCol] || "").trim();
          if (!questionText) continue;

          const rawType = typeCol >= 0 ? String(row[typeCol] || "").toLowerCase().trim() : "mcq";
          let qType: "mcq" | "coding" | "essay" | "voice" = "mcq";
          if (rawType.includes("coding") || rawType.includes("code")) qType = "coding";
          else if (rawType.includes("essay") || rawType.includes("descriptive")) qType = "essay";
          else if (rawType.includes("voice") || rawType.includes("oral") || rawType.includes("speak")) qType = "voice";

          const q: GeneratedQuestion = {
            id: questions.length + 1,
            type: qType,
            question: questionText,
            difficulty: (diffCol >= 0 ? String(row[diffCol] || "medium").toLowerCase().trim() : "medium") as "easy" | "medium" | "hard",
            marks: marksCol >= 0 ? parseInt(String(row[marksCol] || "10")) || 10 : 10,
          };

          if (qType === "mcq") {
            const opts: string[] = [];
            if (optACol >= 0 && row[optACol]) opts.push(String(row[optACol]).trim());
            if (optBCol >= 0 && row[optBCol]) opts.push(String(row[optBCol]).trim());
            if (optCCol >= 0 && row[optCCol]) opts.push(String(row[optCCol]).trim());
            if (optDCol >= 0 && row[optDCol]) opts.push(String(row[optDCol]).trim());
            q.options = opts.length > 0 ? opts : undefined;
            q.correctAnswer = answerCol >= 0 ? String(row[answerCol] || "").trim() : undefined;
          } else if (qType === "voice") {
            q.speakText = speakCol >= 0 ? String(row[speakCol] || "").trim() : questionText;
            q.sampleAnswer = answerCol >= 0 ? String(row[answerCol] || "").trim() : undefined;
            q.timeLimit = 60;
          } else {
            q.sampleAnswer = answerCol >= 0 ? String(row[answerCol] || "").trim() : undefined;
          }

          questions.push(q);
        }

        if (questions.length === 0) {
          setUploadError("No valid questions found in the file.");
          return;
        }

        setUploadedQuestions(questions);
      } catch (err) {
        setUploadError("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv", "txt", "pdf"].includes(ext || "")) {
      setUploadError("Unsupported file type. Please upload .xlsx, .xls, .csv, .txt, or .pdf");
      return;
    }
    if (ext === "pdf") {
      parsePdfFile(file);
    } else {
      parseUploadedFile(file);
    }
    e.target.value = "";
  };

  const parsePdfFile = async (file: File) => {
    setUploadError("");
    setUploadedQuestions([]);
    setUploadPublished(false);
    setUploadedFileName(file.name);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let lastY = -1;
        for (const item of content.items as any[]) {
          if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
            fullText += "\n";
          }
          fullText += item.str;
          if (item.hasEOL) {
            fullText += "\n";
          } else {
            fullText += " ";
          }
          lastY = item.transform[5];
        }
        fullText += "\n---PAGE---\n";
      }

      const lines = fullText.split("\n").map(l => l.trim()).filter(Boolean);
      const questions: GeneratedQuestion[] = [];

      for (const line of lines) {
        if (line === "---PAGE---") continue;

        const qMatch = line.match(/^Q(?:uestion)?[\s.:]*\d+[\s.:)\-]+\s*(.+)/i);
        if (!qMatch) continue;

        const questionText = qMatch[1].trim();
        const opts: string[] = [];
        let answer = "";

        const qIndex = lines.indexOf(line);
        for (let j = qIndex + 1; j < Math.min(qIndex + 12, lines.length); j++) {
          const next = lines[j];
          if (next === "---PAGE---") break;
          if (/^Q(?:uestion)?[\s.:]*\d+[\s.:)\-]+/i.test(next)) break;

          const optMatch = next.match(/^([A-D])[\s.)\-:]+\s*(.+)/);
          if (optMatch) {
            opts.push(optMatch[2].trim());
            continue;
          }

          const ansMatch = next.match(/^(?:Answer|Ans|Correct|Solution)[\s.:]+\s*(?:([A-D])[\s.)\-:]+)?(.+)/i);
          if (ansMatch) {
            answer = ansMatch[2] ? ansMatch[2].trim() : ansMatch[1] || "";
            continue;
          }
        }

        questions.push({
          id: questions.length + 1,
          type: "mcq",
          question: questionText,
          options: opts.length > 0 ? opts : undefined,
          correctAnswer: answer || undefined,
          difficulty: "medium",
          marks: 10,
        });
      }

      if (questions.length === 0) {
        setUploadError("Could not parse questions from PDF. Expected format:\nQ1: Question text\nA) Option 1\nB) Option 2\nAnswer: A) Correct answer");
        return;
      }

      setUploadedQuestions(questions);
    } catch (err) {
      setUploadError("Failed to parse PDF. Please ensure it contains readable text.");
    }
  };

  const handlePublishUpload = async () => {
    if (uploadedQuestions.length === 0) return;
    setIsPublishingUpload(true);
    try {
      await add({
        title: uploadedFileName.replace(/\.[^.]+$/, ""),
        description: `Uploaded from ${uploadedFileName} — ${uploadedQuestions.length} questions`,
        type: uploadedQuestions[0]?.type || "mcq",
        difficulty: uploadedQuestions[0]?.difficulty || "medium",
        questionCount: uploadedQuestions.length,
        questions: uploadedQuestions,
        duration: Math.max(10, Math.ceil(uploadedQuestions.length * 2)),
        passingMarks: Math.ceil(uploadedQuestions.reduce((s, q) => s + q.marks, 0) * 0.5),
        totalMarks: uploadedQuestions.reduce((s, q) => s + q.marks, 0),
        status: "published",
        scheduledDate: new Date().toISOString(),
      });
      setUploadPublished(true);
    } catch (err) {
      console.error("Failed to publish uploaded assessment:", err);
    } finally {
      setIsPublishingUpload(false);
    }
  };

  const handleCopyAll = () => {
    const text = generatedQuestions
      .map((q, i) => {
        let qText = `${i + 1}. [${q.type.toUpperCase()}] ${q.question} (${q.marks} marks)\n`;
        if (q.options) {
          qText += q.options.map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join("\n") + "\n";
          qText += `   Answer: ${q.correctAnswer}\n`;
        }
        if (q.sampleAnswer) {
          qText += `   Sample Answer: ${q.sampleAnswer}\n`;
        }
        return qText;
      })
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalMarks = generatedQuestions.reduce((sum, q) => sum + q.marks, 0);

  const typeIcons = {
    mcq: BookOpen,
    coding: Code,
    essay: PenTool,
    voice: Mic,
  };

  const difficultyColors = {
    easy: "text-success",
    medium: "text-warning",
    hard: "text-danger",
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/30">
            <FileCheck className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI <span className="gradient-text">Assessment Generator</span>
            </h1>
            <p className="text-sm text-muted">Generate assessments with AI for your team</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="form">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={generatedQuestions.length === 0}>
              <Eye className="mr-2 h-4 w-4" />
              Preview ({generatedQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Assessment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="e.g., React, JavaScript, Python"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>

                  {/* Topic */}
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input
                      placeholder="e.g., Hooks, State Management, API Design"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    />
                  </div>

                  {/* Question Type */}
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={form.questionType}
                      onValueChange={(value) => setForm({ ...form, questionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            MCQ (Multiple Choice)
                          </div>
                        </SelectItem>
                        <SelectItem value="coding">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Coding Challenge
                          </div>
                        </SelectItem>
                        <SelectItem value="essay">
                          <div className="flex items-center gap-2">
                            <PenTool className="h-4 w-4" />
                            Essay / Descriptive
                          </div>
                        </SelectItem>
                        <SelectItem value="voice">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            Voice / Communication
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Number of Questions */}
                  <div className="space-y-2">
                    <Label>Number of Questions</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={form.numberOfQuestions}
                        onChange={(e) =>
                          setForm({ ...form, numberOfQuestions: parseInt(e.target.value) || 1 })
                        }
                        className="w-24"
                      />
                      <div className="flex-1">
                        <Progress
                          value={(form.numberOfQuestions / 50) * 100}
                          color="secondary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Difficulty Level</Label>
                    <div className="flex gap-3">
                      {(["easy", "medium", "hard"] as const).map((level) => (
                        <Button
                          key={level}
                          variant={form.difficulty === level ? "default" : "outline"}
                          onClick={() => setForm({ ...form, difficulty: level })}
                          className="flex-1 capitalize"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="300"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                    />
                  </div>

                  {/* Passing Marks */}
                  <div className="space-y-2">
                    <Label>Passing Marks</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.passingMarks}
                      onChange={(e) => setForm({ ...form, passingMarks: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Estimated Assessment</p>
                    <p className="text-lg font-semibold text-white">
                      {form.numberOfQuestions} {form.questionType === "mcq" ? "MCQ" : form.questionType === "coding" ? "Coding" : form.questionType === "voice" ? "Voice" : "Essay"} Questions
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !form.subject || !form.topic}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Assessment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload File Tab */}
          <TabsContent value="upload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Upload Questions from File
                </CardTitle>
                <p className="text-sm text-muted">
                  Upload an Excel (.xlsx, .xls), CSV, or TXT file with your questions. Answers are stored in the backend and hidden from test-takers.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Expected Format Info */}
                <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-4">
                  <p className="text-sm font-medium text-white mb-2">Expected Columns (first row = headers):</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b]">
                    <div><span className="text-[#0066ff] font-medium">question</span> (required) — The question text</div>
                    <div><span className="text-[#0066ff] font-medium">type</span> — mcq, coding, essay, voice</div>
                    <div><span className="text-[#0066ff] font-medium">optionA / optionB / optionC / optionD</span> — MCQ options</div>
                    <div><span className="text-[#0066ff] font-medium">answer</span> — Correct answer (hidden from users)</div>
                    <div><span className="text-[#0066ff] font-medium">marks</span> — Points per question</div>
                    <div><span className="text-[#0066ff] font-medium">difficulty</span> — easy, medium, hard</div>
                    <div><span className="text-[#0066ff] font-medium">speakText</span> — For voice type (what AI reads aloud)</div>
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#1e293b] bg-[#0a0f1e]/50 p-10 cursor-pointer transition-all hover:border-[#0066ff]/50 hover:bg-[#0066ff]/5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0066ff]/10">
                    <Upload className="h-7 w-7 text-[#0066ff]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Click to upload or drag & drop</p>
                    <p className="text-xs text-[#64748b] mt-1">.xlsx, .xls, .csv, .txt, .pdf</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Error */}
                {uploadError && (
                  <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 text-sm text-[#ef4444]">
                    {uploadError}
                  </div>
                )}

                {/* Uploaded File Info */}
                {uploadedFileName && !uploadError && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#0f172a] p-4">
                    <FileSpreadsheet className="h-5 w-5 text-[#10b981]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{uploadedFileName}</p>
                      <p className="text-xs text-[#64748b]">{uploadedQuestions.length} questions parsed</p>
                    </div>
                    <button
                      onClick={() => { setUploadedFileName(""); setUploadedQuestions([]); setUploadPublished(false); }}
                      className="rounded-md p-1 text-[#64748b] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Parsed Questions Preview */}
                {uploadedQuestions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Parsed Questions ({uploadedQuestions.length})</p>
                    <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                      {uploadedQuestions.map((q, i) => (
                        <div key={i} className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                          <div className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#0066ff]/10 text-[10px] font-bold text-[#0066ff]">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] uppercase">{q.type}</Badge>
                                <Badge variant="outline" className="text-[10px] capitalize">{q.difficulty}</Badge>
                                <Badge variant="outline" className="text-[10px]">{q.marks} marks</Badge>
                              </div>
                              <p className="text-sm text-white truncate">{q.question}</p>
                              {q.options && (
                                <p className="text-xs text-[#64748b] mt-1">
                                  Options: {q.options.join(" | ")}
                                </p>
                              )}
                              {q.correctAnswer && (
                                <p className="text-xs text-[#10b981] mt-1">
                                  Answer: {q.correctAnswer}
                                </p>
                              )}
                              {q.sampleAnswer && q.type !== "mcq" && (
                                <p className="text-xs text-[#10b981] mt-1">
                                  Answer: {q.sampleAnswer.substring(0, 80)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publish Button */}
                {uploadedQuestions.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0f172a] p-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {uploadedQuestions.length} questions ready to publish
                      </p>
                      <p className="text-xs text-[#64748b]">
                        Total marks: {uploadedQuestions.reduce((s, q) => s + q.marks, 0)} · 
                        Types: {[...new Set(uploadedQuestions.map(q => q.type))].join(", ")}
                      </p>
                    </div>
                    {uploadPublished ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Published to Assessments
                      </Badge>
                    ) : (
                      <Button
                        onClick={handlePublishUpload}
                        disabled={isPublishingUpload}
                        className="bg-[#10b981] hover:bg-[#059669] text-white"
                      >
                        {isPublishingUpload ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Publish to Assessments
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <div className="space-y-6">
              {/* Summary Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted">Questions</p>
                        <p className="text-lg font-bold text-white">{generatedQuestions.length}</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="text-sm text-muted">Total Marks</p>
                        <p className="text-lg font-bold text-white">{totalMarks}</p>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <p className="text-sm text-muted">Difficulty</p>
                        <p className="text-lg font-bold text-white capitalize">{form.difficulty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyAll}>
                        {copied ? (
                          <CheckCircle className="mr-2 h-4 w-4 text-success" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy All"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => alert('Exporting assessment...')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#10b981] hover:bg-[#059669] text-white"
                        onClick={() => handlePublish()}
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        {lastSavedId ? "Published!" : "Publish"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("form")}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              <div className="space-y-4">
                <AnimatePresence>
                  {generatedQuestions.map((question, index) => {
                    const TypeIcon = typeIcons[question.type];
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="card-hover">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="capitalize">
                                      <TypeIcon className="mr-1 h-3 w-3" />
                                      {question.type}
                                    </Badge>
                                    <Badge variant="outline" className={cn("capitalize", difficultyColors[question.difficulty])}>
                                      {question.difficulty}
                                    </Badge>
                                    <Badge variant="outline">
                                      <Hash className="mr-1 h-3 w-3" />
                                      {question.marks} marks
                                    </Badge>
                                  </div>
                                </div>

                                <p className="text-white font-medium">{question.question}</p>

                                {/* MCQ Options */}
                                {question.options && (
                                  <div className="space-y-2 mt-3">
                                    {question.options.map((option, i) => (
                                      <div
                                        key={i}
                                        className={cn(
                                          "flex items-center gap-3 rounded-lg border p-3 text-sm",
                                          question.correctAnswer === option
                                            ? "border-success/30 bg-success/5 text-success"
                                            : "border-border/50 bg-card-hover/30 text-foreground"
                                        )}
                                      >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card-hover/50 text-xs font-medium">
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        {option}
                                        {question.correctAnswer === option && showAnswers[question.id] && (
                                          <CheckCircle className="ml-auto h-4 w-4 text-success" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Essay/Coding Sample Answer */}
                                {question.sampleAnswer && showAnswers[question.id] && (
                                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                    <p className="text-xs font-medium text-primary mb-2">Sample Answer:</p>
                                    <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                                      {question.sampleAnswer}
                                    </pre>
                                  </div>
                                )}

                                {/* Toggle Answer Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleAnswer(question.id)}
                                  className="mt-2"
                                >
                                  {showAnswers[question.id] ? (
                                    <>
                                      <EyeOff className="mr-2 h-3 w-3" />
                                      Hide Answer
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-3 w-3" />
                                      Show Answer
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
