"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  type: string;
  voiceSubtype?: "pronunciation" | "repeat-after-me" | "communication";
  question: string;
  speakText?: string;
  options?: string[];
  correctAnswer?: string;
  sampleAnswer?: string;
  difficulty: string;
  marks: number;
  timeLimit?: number;
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

function speakText(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = 1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

function VoiceRecorder({
  question,
  onResult,
  existingTranscript,
  existingAudioUrl,
}: {
  question: Question;
  onResult: (transcript: string, audioUrl: string) => void;
  existingTranscript?: string;
  existingAudioUrl?: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState(existingTranscript || "");
  const [audioUrl, setAudioUrl] = useState(existingAudioUrl || "");
  const [elapsed, setElapsed] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxTime = question.timeLimit || 120;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [question.id]);

  useEffect(() => {
    if (existingTranscript) setTranscript(existingTranscript);
    if (existingAudioUrl) setAudioUrl(existingAudioUrl);
  }, [existingTranscript, existingAudioUrl, question.id]);

  const playAIPrompt = useCallback(() => {
    const text = question.speakText || question.question;
    setAiSpeaking(true);
    speakText(text, () => setAiSpeaking(false));
  }, [question]);

  const startRecording = useCallback(async () => {
    setTranscript("");
    setAudioUrl("");
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        recognitionRef.current = rec;

        rec.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            finalTranscript += event.results[i][0].transcript;
          }
          setTranscript(finalTranscript);
        };

        rec.onerror = (event: any) => {
          if (event.error === "not-allowed") setPermissionDenied(true);
        };

        rec.start();
      }

      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= maxTime - 1) {
            stopRecording();
            return maxTime;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setPermissionDenied(true);
    }
  }, [maxTime, question]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (audioUrl && transcript) {
      onResult(transcript, audioUrl);
    }
  }, [audioUrl, transcript]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* AI Voice Prompt */}
      {(question.voiceSubtype === "pronunciation" || question.voiceSubtype === "repeat-after-me" || question.voiceSubtype === "communication") && (
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a]/80 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="h-4 w-4 text-[#0066ff]" />
            <span className="text-xs font-medium text-[#0066ff] uppercase">
              {question.voiceSubtype === "pronunciation"
                ? "Read this word aloud"
                : question.voiceSubtype === "repeat-after-me"
                ? "Listen & Repeat"
                : "AI Question"}
            </span>
          </div>
          <p className="text-xl font-semibold text-white mb-3">
            {question.speakText || question.question}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={playAIPrompt}
            disabled={aiSpeaking}
          >
            {aiSpeaking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {aiSpeaking ? "Speaking..." : "Play Audio"}
          </Button>
        </div>
      )}

      {/* Permission Denied */}
      {permissionDenied && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 text-sm text-[#ef4444]">
          Microphone access is required for voice assessment. Please allow microphone access in your browser settings and try again.
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-4 py-6">
        {/* Mic Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300",
            isRecording
              ? "bg-[#ef4444] shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse"
              : "bg-[#0066ff] hover:bg-[#0052cc] shadow-[0_0_30px_rgba(0,102,255,0.3)]"
          )}
        >
          {isRecording ? (
            <Square className="h-10 w-10 text-white fill-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
          {isRecording && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#ef4444]">
              {formatElapsed(elapsed)}
            </span>
          )}
        </button>

        <div className="text-center">
          {isRecording ? (
            <p className="text-sm text-[#ef4444] font-medium">
              Recording... {formatElapsed(elapsed)} / {formatElapsed(maxTime)}
            </p>
          ) : audioUrl ? (
            <p className="text-sm text-[#10b981] font-medium">Recording complete</p>
          ) : (
            <p className="text-sm text-[#64748b]">
              Tap the mic to start recording your response
            </p>
          )}
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="w-full max-w-md">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full rounded-lg"
              style={{ filter: "invert(1) hue-rotate(180deg)" }}
            />
          </div>
        )}
      </div>

      {/* Transcribed Text */}
      {transcript && (
        <div className="rounded-xl border border-[#1e293b] bg-[#0a0f1e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="h-4 w-4 text-[#0066ff]" />
            <span className="text-xs font-medium text-[#64748b] uppercase">Your Response (transcribed)</span>
          </div>
          <p className="text-sm text-white leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
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
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
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

  const handleVoiceResult = (questionId: number, transcript: string, audioUrl: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: transcript }));
    setAudioUrls((prev) => ({ ...prev, [questionId]: audioUrl }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!assessment) return;

    let score = 0;
    (assessment.questions || []).forEach((q: Question) => {
      if (q.type === "mcq" && answers[q.id] === q.correctAnswer) {
        score += q.marks;
      }
      if (q.type === "voice" && answers[q.id] && answers[q.id].trim().length > 0) {
        score += q.marks;
      }
    });

    try {
      await saveResult({
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        answers,
        audioUrls,
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
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-white">{assessment.title}</h2>
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
            {questions.some((q: Question) => q.type === "voice") && (
              <div className="rounded-lg border border-[#0066ff]/30 bg-[#0066ff]/5 p-4 text-sm text-[#94a3b8]">
                <div className="flex items-center gap-2 text-[#0066ff] font-medium mb-1">
                  <Mic className="h-4 w-4" />
                  Voice Assessment Detected
                </div>
                This test contains voice questions. Make sure your microphone is working and you are in a quiet environment.
              </div>
            )}
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
      if (q.type === "voice" && answers[q.id] && answers[q.id].trim().length > 0) {
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

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Review Answers</h3>
          {questions.map((q: Question, i: number) => {
            const userAnswer = answers[q.id];
            const isCorrect = q.type === "mcq" && userAnswer === q.correctAnswer;
            const isVoiceAnswered = q.type === "voice" && userAnswer && userAnswer.trim().length > 0;
            return (
              <Card key={q.id} className={cn("border", (isCorrect || isVoiceAnswered) ? "border-[#10b981]/30" : "border-[#1e293b]")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", (isCorrect || isVoiceAnswered) ? "bg-[#10b981]/15 text-[#10b981]" : "bg-[#1e293b] text-[#64748b]")}>
                      {(isCorrect || isVoiceAnswered) ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
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
                      {q.type === "voice" && (
                        <div className="mt-2 space-y-2">
                          {userAnswer && (
                            <p className="text-xs text-[#64748b]">Transcript: <span className="text-white">{userAnswer}</span></p>
                          )}
                          {audioUrls[q.id] && (
                            <audio src={audioUrls[q.id]} controls className="w-full max-w-sm rounded-lg" style={{ height: 36, filter: "invert(1) hue-rotate(180deg)" }} />
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
              <Badge variant={currentQ.type === "voice" ? "warning" : "outline"} className="text-xs">
                {currentQ.type === "voice" && <Mic className="mr-1 h-3 w-3" />}
                {currentQ.type.toUpperCase()}
              </Badge>
              {currentQ.voiceSubtype && (
                <Badge variant="info" className="text-xs capitalize">
                  {currentQ.voiceSubtype.replace(/-/g, " ")}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">{currentQ.difficulty}</Badge>
              <Badge variant="outline" className="text-xs">{currentQ.marks} marks</Badge>
            </div>
            <p className="text-lg text-white font-medium">{currentQ.question}</p>

            {/* MCQ Options */}
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

            {/* Coding / Essay (textarea) */}
            {(currentQ.type === "coding" || currentQ.type === "essay") && (
              <textarea
                className="w-full rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-4 text-sm text-white placeholder-[#64748b] focus:border-[#0066ff] focus:outline-none"
                rows={8}
                placeholder={currentQ.type === "coding" ? "Write your code here..." : "Write your answer here..."}
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              />
            )}

            {/* Voice Recording */}
            {currentQ.type === "voice" && (
              <VoiceRecorder
                key={currentQ.id}
                question={currentQ}
                onResult={(transcript, audioUrl) => handleVoiceResult(currentQ.id, transcript, audioUrl)}
                existingTranscript={answers[currentQ.id]}
                existingAudioUrl={audioUrls[currentQ.id]}
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
