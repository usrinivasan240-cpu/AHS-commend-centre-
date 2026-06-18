"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  difficulty: string;
  marks: number;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  status: string;
  [key: string]: unknown;
}

export default function TakeAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const { data: assessments } = useFirestoreQuery(COLLECTIONS.ASSESSMENTS);
  const { add: saveResult } = useFirestoreActions(COLLECTIONS.ASSESSMENT_RESULTS);

  const assessment = useMemo(
    () => assessments.find((a: any) => a.id === assessmentId) as Assessment | undefined,
    [assessments, assessmentId]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (assessment && !started) {
      setTimeLeft((assessment.duration || 60) * 60);
    }
  }, [assessment, started]);

  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted, timeLeft]);

  useEffect(() => {
    if (started && !submitted && timeLeft <= 0 && assessment) {
      handleSubmit();
    }
  }, [timeLeft, started, submitted, assessment]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!assessment) return;

    let score = 0;
    (assessment.questions || []).forEach((q: Question) => {
      if (q.type === "mcq" && answers[q.id] === q.correctAnswer) {
        score += q.marks;
      }
    });

    try {
      await saveResult({
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        answers,
        score,
        totalMarks: assessment.totalMarks,
        percentage: Math.round((score / assessment.totalMarks) * 100),
        status: score >= (assessment.passingMarks || 50) ? "pass" : "fail",
        completedAt: new Date().toISOString(),
        timeTaken: (assessment.duration || 60) * 60 - timeLeft,
      });
    } catch (err) {
      console.error("Failed to save result:", err);
    }
  };

  if (!assessment) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#64748b]">Loading assessment...</div>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Pre-start screen
  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-6"
      >
        <Button variant="ghost" onClick={() => router.push("/assessments")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessments
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-white">{assessment.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessment.description && (
              <p className="text-[#64748b]">{assessment.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-[#1e293b] bg-[#0f172a]/50 p-3">
                <p className="text-[#64748b]">Duration</p>
                <p className="text-lg font-bold text-white">{assessment.duration || 60} min</p>
              </div>
              <div className="rounded-lg border border-[#1e293b] bg-[#0f172a]/50 p-3">
                <p className="text-[#64748b]">Total Marks</p>
                <p className="text-lg font-bold text-white">{assessment.totalMarks}</p>
              </div>
              <div className="rounded-lg border border-[#1e293b] bg-[#0f172a]/50 p-3">
                <p className="text-[#64748b]">Passing Marks</p>
                <p className="text-lg font-bold text-white">{assessment.passingMarks}</p>
              </div>
              <div className="rounded-lg border border-[#1e293b] bg-[#0f172a]/50 p-3">
                <p className="text-[#64748b]">Questions</p>
                <p className="text-lg font-bold text-white">{questions.length}</p>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => setStarted(true)}>
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Results screen
  if (submitted) {
    let score = 0;
    questions.forEach((q: Question) => {
      if (q.type === "mcq" && answers[q.id] === q.correctAnswer) {
        score += q.marks;
      }
    });
    const percentage = assessment.totalMarks > 0 ? Math.round((score / assessment.totalMarks) * 100) : 0;
    const passed = score >= (assessment.passingMarks || 50);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl space-y-6"
      >
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-full", passed ? "bg-[#10b981]/15" : "bg-[#ef4444]/15")}>
              <Trophy className={cn("h-10 w-10", passed ? "text-[#10b981]" : "text-[#ef4444]")} />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {passed ? "Congratulations! You Passed!" : "Assessment Complete"}
            </h2>
            <p className="text-[#64748b]">
              {passed ? "Great job on this assessment." : "Keep practicing and try again."}
            </p>
            <div className="flex justify-center gap-8 py-4">
              <div>
                <p className="text-sm text-[#64748b]">Score</p>
                <p className="text-3xl font-bold text-white">{score}/{assessment.totalMarks}</p>
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Percentage</p>
                <p className={cn("text-3xl font-bold", passed ? "text-[#10b981]" : "text-[#ef4444]")}>{percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Result</p>
                <Badge variant={passed ? "success" : "danger"} className="text-lg">
                  {passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
            </div>
            <Button onClick={() => router.push("/assessments")} className="mt-4">
              Back to Assessments
            </Button>
          </CardContent>
        </Card>

        {/* Review Answers */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Review Answers</h3>
          {questions.map((q: Question, i: number) => {
            const userAnswer = answers[q.id];
            const isCorrect = q.type === "mcq" && userAnswer === q.correctAnswer;
            return (
              <Card key={q.id} className={cn("border", isCorrect ? "border-[#10b981]/30" : "border-[#ef4444]/30")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", isCorrect ? "bg-[#10b981]/15 text-[#10b981]" : "bg-[#ef4444]/15 text-[#ef4444]")}>
                      {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{i + 1}. {q.question}</p>
                      {q.type === "mcq" && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-[#64748b]">Your answer: <span className={cn(isCorrect ? "text-[#10b981]" : "text-[#ef4444]")}>{userAnswer || "Not answered"}</span></p>
                          {!isCorrect && q.correctAnswer && (
                            <p className="text-xs text-[#64748b]">Correct answer: <span className="text-[#10b981]">{q.correctAnswer}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Test-taking screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0F172A]/95 p-4 backdrop-blur">
        <div>
          <h2 className="font-semibold text-white">{assessment.title}</h2>
          <p className="text-xs text-[#64748b]">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-mono", timeLeft < 60 ? "border-[#ef4444]/50 text-[#ef4444]" : "border-[#1e293b] text-white")}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Badge variant="outline">{answeredCount}/{questions.length} answered</Badge>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question */}
      {currentQ && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{currentQ.type.toUpperCase()}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{currentQ.difficulty}</Badge>
              <Badge variant="outline" className="text-xs">{currentQ.marks} marks</Badge>
            </div>
            <p className="text-lg text-white font-medium">{currentQ.question}</p>

            {currentQ.type === "mcq" && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((option: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQ.id, option)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-all",
                      answers[currentQ.id] === option
                        ? "border-[#0066ff]/50 bg-[#0066ff]/10 text-white"
                        : "border-[#1e293b] bg-[#0f172a]/30 text-[#e2e8f0] hover:border-[#334155]"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1e293b] text-xs font-medium">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {(currentQ.type === "coding" || currentQ.type === "essay" || currentQ.type === "voice") && (
              <textarea
                className="w-full rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-4 text-sm text-white placeholder-[#64748b] focus:border-[#0066ff] focus:outline-none"
                rows={currentQ.type === "voice" ? 6 : 8}
                placeholder={
                  currentQ.type === "coding"
                    ? "Write your code here..."
                    : currentQ.type === "voice"
                    ? "Type your spoken response here (or speak using the mic)..."
                    : "Write your answer here..."
                }
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-1.5">
          {questions.map((_: Question, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-8 w-8 rounded-lg text-xs font-medium transition-all",
                i === currentIndex
                  ? "bg-[#0066ff] text-white"
                  : answers[questions[i]?.id]
                  ? "bg-[#10b981]/20 text-[#10b981]"
                  : "bg-[#1e293b] text-[#64748b] hover:text-white"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} className="bg-[#10b981] hover:bg-[#059669] text-white">
            <Send className="mr-2 h-4 w-4" />
            Submit
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
