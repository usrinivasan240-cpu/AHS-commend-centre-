"use client";

import { useState } from "react";
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
} from "lucide-react";
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
  question: string;
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

  const voiceTemplates: Record<string, { q: string; timeLimit: number; answer: string }[]> = {
    react: [
      { q: "Explain what React hooks are and list the most commonly used ones.", timeLimit: 120, answer: "React hooks are functions that let you use state and lifecycle features in functional components. Common hooks include useState, useEffect, useContext, useRef, useMemo, and useCallback." },
      { q: "Describe the difference between state and props in React.", timeLimit: 90, answer: "State is mutable data managed within a component, while props are read-only data passed from parent to child components. State can be updated with setState/useState, props cannot be modified by the receiving component." },
      { q: "What is the virtual DOM and how does React use it?", timeLimit: 120, answer: "The virtual DOM is a lightweight in-memory representation of the real DOM. React uses it to batch updates and minimize direct DOM manipulation, improving performance through a reconciliation process." },
      { q: "Explain how you would handle error boundaries in a React application.", timeLimit: 120, answer: "Error boundaries are React components that catch JavaScript errors in their child component tree. They use getDerivedStateFromError and componentDidCatch lifecycle methods to display fallback UI instead of crashing the entire app." },
    ],
    javascript: [
      { q: "Explain the concept of closures in JavaScript with a practical example.", timeLimit: 120, answer: "A closure is a function that retains access to its outer scope variables even after the outer function has returned. For example, a counter function returning an inner function that accesses the count variable." },
      { q: "What is the event loop and how does asynchronous JavaScript work?", timeLimit: 120, answer: "The event loop continuously monitors the call stack and task queue. When the stack is empty, it processes callbacks from the queue. Microtasks (Promises) have priority over macrotasks (setTimeout, setInterval)." },
      { q: "Describe the difference between var, let, and const.", timeLimit: 90, answer: "var is function-scoped and hoisted, let is block-scoped and not hoisted, const is block-scoped, not hoisted, and cannot be reassigned after declaration." },
    ],
    python: [
      { q: "Explain list comprehensions and when you would use them.", timeLimit: 90, answer: "List comprehensions provide a concise way to create lists. They are more readable and often faster than traditional for loops for simple list creation operations." },
      { q: "What are decorators in Python and how do they work?", timeLimit: 120, answer: "Decorators are functions that modify the behavior of other functions or classes. They use the @decorator syntax and are applied at function definition time. They are commonly used for logging, authentication, and caching." },
      { q: "Explain the difference between deep copy and shallow copy.", timeLimit: 90, answer: "A shallow copy creates a new object but references the same nested objects. A deep copy creates a completely independent copy of the object and all nested objects." },
    ],
    general: [
      { q: "Tell me about your experience with version control systems like Git.", timeLimit: 120, answer: "Expected: Familiarity with git add, commit, push, pull, merge, branches, resolving conflicts, and pull requests." },
      { q: "How do you approach debugging a complex issue in your code?", timeLimit: 120, answer: "Expected: Systematic approach - reproduce the issue, check logs, use debugging tools, isolate the problem, test hypotheses, and verify the fix." },
      { q: "Describe a challenging project you worked on and how you solved the problems.", timeLimit: 180, answer: "Expected: Clear explanation of the challenge, the approach taken, technologies used, and the outcome." },
      { q: "How do you ensure code quality in your projects?", timeLimit: 120, answer: "Expected: Code reviews, testing (unit, integration, e2e), linting, formatting, documentation, and following design patterns." },
    ],
  };

  const getTemplates = (subject: string, type: string) => {
    const sub = subject.toLowerCase();
    const templates: Record<string, Record<string, any[]>> = { mcq: mcqTemplates, coding: codingTemplates, essay: essayTemplates, voice: voiceTemplates };
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
    if ((type === "coding" || type === "essay") && template.answer) {
      q.sampleAnswer = template.answer;
    }
    if (type === "voice") {
      q.sampleAnswer = template.answer;
      q.timeLimit = template.timeLimit || 120;
    }
    questions.push(q);
  }
  return questions;
}

export default function AssessmentGeneratorPage() {
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
