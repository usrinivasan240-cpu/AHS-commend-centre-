"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  User,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Copy,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  IndianRupee,
  FolderKanban,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "insight" | "chart";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
}

const preDefinedQuestions = [
  { label: "Which projects are delayed?", icon: AlertTriangle, color: "text-danger" },
  { label: "Who are top performers?", icon: TrendingUp, color: "text-success" },
  { label: "Show weak performers", icon: Users, color: "text-warning" },
  { label: "Revenue summary", icon: IndianRupee, color: "text-primary" },
  { label: "Team performance", icon: BarChart3, color: "text-secondary" },
];

export default function AIBusinessAssistantPage() {
  const { data: projects } = useFirestoreQuery(COLLECTIONS.PROJECTS);
  const { data: users } = useFirestoreQuery(COLLECTIONS.USERS);
  const { data: invoices } = useFirestoreQuery(COLLECTIONS.INVOICES);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Business Assistant. I can help you analyze projects, team performance, revenue, and more. Ask me anything or use one of the quick questions below.",
      timestamp: new Date(),
      type: "text",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getAIResponse = useCallback((question: string): { content: string; type: "text" | "insight"; data?: Record<string, unknown> } => {
    const q = question.trim().toLowerCase();

    if (q.includes("delayed") || q.includes("delay")) {
      const delayed = projects.filter((p: any) => p.status === "delayed");
      if (delayed.length === 0) {
        return {
          content: "Good news! No projects are currently delayed.",
          type: "text",
        };
      }
      return {
        content: "Based on my analysis, here are the delayed projects:",
        type: "insight",
        data: {
          projects: delayed.map((p: any) => ({
            name: p.name,
            client: p.clientName || "Internal",
            delay: "Behind schedule",
            budget: p.budget,
            severity: p.priority,
          })),
          summary: `${delayed.length} project(s) currently delayed. Consider reallocating resources to get them back on track.`,
        },
      };
    }

    if (q.includes("top performer") || q.includes("best performer")) {
      const sorted = [...users].sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0)).slice(0, 5);
      if (sorted.length === 0) {
        return { content: "No team member data available yet.", type: "text" };
      }
      return {
        content: "Here are your top performers based on performance scores:",
        type: "insight",
        data: {
          members: sorted.map((m: any) => ({
            name: m.name,
            score: m.performanceScore || 0,
            role: m.role?.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Member",
          })),
          summary: `${sorted[0]?.name} leads with ${sorted[0]?.performanceScore}% performance score. The top ${sorted.length} members all contribute strongly.`,
        },
      };
    }

    if (q.includes("weak performer") || q.includes("low performer") || q.includes("struggling")) {
      const weak = users.filter((u: any) => (u.performanceScore || 0) < 70).sort((a: any, b: any) => (a.performanceScore || 0) - (b.performanceScore || 0));
      if (weak.length === 0) {
        return { content: "All team members are performing above 70%.", type: "text" };
      }
      return {
        content: "Here are team members who may need additional support:",
        type: "insight",
        data: {
          members: weak.map((m: any) => ({
            name: m.name,
            score: m.performanceScore || 0,
            role: m.role?.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Member",
          })),
          summary: `${weak.length} member(s) have scores below 70. Recommend pairing them with senior members for mentorship.`,
        },
      };
    }

    if (q.includes("revenue") || q.includes("financial") || q.includes("money")) {
      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      const paid = invoices.filter((i: any) => i.status === "paid");
      const paidAmount = paid.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      const pending = invoices.filter((i: any) => i.status !== "paid");
      const pendingAmount = pending.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      return {
        content: "Here's your financial overview:",
        type: "insight",
        data: {
          metrics: [
            { label: "Total Revenue", value: formatCurrency(totalRevenue), trend: "+18.2%" },
            { label: "Paid Invoices", value: formatCurrency(paidAmount), trend: `${paid.length} invoices` },
            { label: "Pending Invoices", value: formatCurrency(pendingAmount), trend: `${pending.length} pending` },
            { label: "Total Invoices", value: `${invoices.length}`, trend: `${paid.length} paid` },
          ],
          summary: `Total revenue is ${formatCurrency(totalRevenue)}. ${paid.length} invoices paid, ${pending.length} pending.`,
        },
      };
    }

    if (q.includes("team performance") || q.includes("team") || q.includes("teams")) {
      const teamMap: Record<string, { scores: number[]; count: number }> = {};
      users.forEach((u: any) => {
        const team = u.team || "Unassigned";
        if (!teamMap[team]) teamMap[team] = { scores: [], count: 0 };
        teamMap[team].scores.push(u.performanceScore || 0);
        teamMap[team].count++;
      });
      const teamData = Object.entries(teamMap).map(([name, data]) => ({
        name: name + " Team",
        performance: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        members: data.count,
      }));
      return {
        content: "Here's the team performance breakdown:",
        type: "insight",
        data: {
          teams: teamData,
          summary: `Overall organizational performance is ${Math.round(teamData.reduce((s, t) => s + t.performance, 0) / teamData.length)}% across ${teamData.length} teams.`,
        },
      };
    }

    return {
      content: `I'll analyze "${question}" for you. Based on the current data from ${projects.length} projects and ${users.length} team members, I can help you explore this further. Try asking about delayed projects, top performers, revenue, or team performance.`,
      type: "text",
    };
  }, [projects, users, invoices]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responseData = getAIResponse(content.trim());
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseData?.content || `I'll analyze "${content}" for you. Based on the current data, here's what I found...`,
        timestamp: new Date(),
        type: responseData?.type || "text",
        data: responseData?.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="flex h-[calc(100vh-12rem)] flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/30">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI <span className="gradient-text">Business Assistant</span>
            </h1>
            <p className="text-sm text-muted">Ask questions about your business data</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-xl p-4",
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-card-hover/50 border border-border/50"
                  )}
                >
                  <p className="text-sm">{message.content}</p>

                  {/* Insight Response */}
                  {message.type === "insight" && message.data && (
                    <div className="mt-4 space-y-3">
                      {/* Projects Insight */}
                      {message.data.projects && (
                        <div className="space-y-2">
                          {(message.data.projects as Array<Record<string, unknown>>).map((project, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-background/50 p-3 border border-border/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10">
                                  <AlertTriangle className="h-4 w-4 text-danger" />
                                </div>
                                <div>
                                  <p className="font-medium text-white text-sm">{project.name as string}</p>
                                  <p className="text-xs text-muted">Client: {project.client as string}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="danger">{project.delay as string} delay</Badge>
                                <p className="text-xs text-muted mt-1">{formatCurrency(project.budget as number)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Members Insight */}
                      {message.data.members && (
                        <div className="space-y-2">
                          {(message.data.members as Array<Record<string, unknown>>).map((member, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-background/50 p-3 border border-border/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                  {(member.name as string).charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-white text-sm">{member.name as string}</p>
                                  <p className="text-xs text-muted">{member.role as string}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-lg font-bold",
                                  (member.score as number) >= 80 ? "text-success" :
                                  (member.score as number) >= 60 ? "text-warning" : "text-danger"
                                )}>
                                  {member.score as number}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metrics Insight */}
                      {message.data.metrics && (
                        <div className="grid grid-cols-2 gap-2">
                          {(message.data.metrics as Array<Record<string, string>>).map((metric, i) => (
                            <div
                              key={i}
                              className="rounded-lg bg-background/50 p-3 border border-border/30"
                            >
                              <p className="text-xs text-muted">{metric.label as string}</p>
                              <p className="text-lg font-bold text-white">{metric.value as string}</p>
                              {metric.trend && (
                                <p className="text-xs text-success">↑ {metric.trend as string}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Teams Insight */}
                      {message.data.teams && (
                        <div className="space-y-2">
                          {(message.data.teams as Array<Record<string, unknown>>).map((team, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-background/50 p-3 border border-border/30"
                            >
                              <div>
                                <p className="font-medium text-white text-sm">{team.name as string}</p>
                                <p className="text-xs text-muted">{team.members as number} members</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-24">
                                  <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                                      style={{ width: `${team.performance as number}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-white w-10 text-right">
                                  {team.performance as number}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      {message.data.summary && (
                        <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                          <p className="text-sm text-foreground">{message.data.summary as string}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-[10px] text-muted">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-xl bg-card-hover/50 border border-border/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span className="text-xs text-muted ml-1">AI is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pre-defined Questions */}
        <div className="border-t border-border/50 px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {preDefinedQuestions.map((question) => {
              const Icon = question.icon;
              return (
                <Button
                  key={question.label}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => handleQuestionClick(question.label)}
                  disabled={isTyping}
                >
                  <Icon className={cn("mr-1 h-3 w-3", question.color)} />
                  {question.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Ask me anything about your business..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
