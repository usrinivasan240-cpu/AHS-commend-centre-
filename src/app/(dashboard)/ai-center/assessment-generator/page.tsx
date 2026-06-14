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
  type: "mcq" | "coding" | "essay";
  question: string;
  options?: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
}

const mockQuestions: GeneratedQuestion[] = [
  {
    id: 1,
    type: "mcq",
    question: "What is the primary purpose of React's useEffect hook?",
    options: [
      "To handle side effects in functional components",
      "To manage component state",
      "To optimize rendering performance",
      "To handle user input events",
    ],
    correctAnswer: "To handle side effects in functional components",
    difficulty: "easy",
    marks: 5,
  },
  {
    id: 2,
    type: "mcq",
    question: "Which of the following is NOT a valid React lifecycle method?",
    options: [
      "componentDidMount",
      "componentWillUnmount",
      "componentDidNavigate",
      "componentDidUpdate",
    ],
    correctAnswer: "componentDidNavigate",
    difficulty: "medium",
    marks: 5,
  },
  {
    id: 3,
    type: "mcq",
    question: "What does the 'key' prop help React with in a list?",
    options: [
      "Styling list items",
      "Identifying which items have changed, added, or removed",
      "Sorting the list alphabetically",
      "Filtering list items",
    ],
    correctAnswer: "Identifying which items have changed, added, or removed",
    difficulty: "easy",
    marks: 5,
  },
  {
    id: 4,
    type: "coding",
    question: "Write a React custom hook called useLocalStorage that syncs state with localStorage.",
    sampleAnswer: `function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}`,
    difficulty: "hard",
    marks: 15,
  },
  {
    id: 5,
    type: "essay",
    question: "Explain the concept of Virtual DOM in React. How does it improve performance compared to direct DOM manipulation?",
    sampleAnswer: "The Virtual DOM is a lightweight copy of the actual DOM. React uses it to batch updates and minimize expensive DOM operations. When state changes, React creates a new Virtual DOM tree, diffs it against the previous one, and only applies the minimal set of real DOM updates needed.",
    difficulty: "medium",
    marks: 10,
  },
  {
    id: 6,
    type: "mcq",
    question: "Which hook should be used to memoize expensive calculations in React?",
    options: ["useState", "useEffect", "useMemo", "useCallback"],
    correctAnswer: "useMemo",
    difficulty: "medium",
    marks: 5,
  },
  {
    id: 7,
    type: "coding",
    question: "Write a function to flatten a nested array in JavaScript without using flat().",
    sampleAnswer: `function flatten(arr) {
  return arr.reduce((acc, val) => {
    return Array.isArray(val)
      ? acc.concat(flatten(val))
      : acc.concat(val);
  }, []);
}`,
    difficulty: "hard",
    marks: 15,
  },
  {
    id: 8,
    type: "essay",
    question: "Describe the difference between controlled and uncontrolled components in React. When would you use each?",
    sampleAnswer: "Controlled components have their value managed by React state, while uncontrolled components manage their own state via the DOM. Use controlled components when you need validation or immediate UI feedback. Use uncontrolled when integrating with non-React code or for simple forms.",
    difficulty: "medium",
    marks: 10,
  },
];

export default function AssessmentGeneratorPage() {
  const { add } = useFirestoreActions(COLLECTIONS.ASSESSMENTS);
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    questionType: "mcq",
    numberOfQuestions: 10,
    difficulty: "medium",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
      const questions = mockQuestions.slice(0, form.numberOfQuestions);
      setGeneratedQuestions(questions);
      setIsGenerating(false);
      setActiveTab("preview");

      try {
        await add({
          title: `${form.subject} - ${form.topic}`,
          type: form.questionType,
          difficulty: form.difficulty,
          questionCount: form.numberOfQuestions,
          questions,
          totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
          status: "completed",
        });
      } catch (err) {
        console.error("Failed to save assessment:", err);
      }
    }, 2000);
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
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Estimated Assessment</p>
                    <p className="text-lg font-semibold text-white">
                      {form.numberOfQuestions} {form.questionType === "mcq" ? "MCQ" : form.questionType === "coding" ? "Coding" : "Essay"} Questions
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
