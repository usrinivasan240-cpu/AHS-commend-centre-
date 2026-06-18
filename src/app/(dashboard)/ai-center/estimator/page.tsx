"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Sparkles,
  Globe,
  Smartphone,
  Brain,
  Wrench,
  Clock,
  Users,
  IndianRupee,
  Layers,
  ArrowRight,
  RotateCcw,
  Loader2,
  CheckCircle,
  Target,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardReveal = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" },
};

interface ProjectEstimate {
  scope: {
    summary: string;
    modules: string[];
    complexity: string;
  };
  timeline: {
    totalWeeks: number;
    phases: { name: string; weeks: number }[];
  };
  team: {
    roles: { role: string; count: number; allocation: string }[];
    totalMembers: number;
  };
  cost: {
    development: number;
    design: number;
    testing: number;
    deployment: number;
    total: number;
  };
  technology: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    tools: string[];
  };
}

const projectTypes = [
  { id: "web", label: "Web Application", icon: Globe, color: "text-primary" },
  { id: "mobile", label: "Mobile App", icon: Smartphone, color: "text-secondary" },
  { id: "ai", label: "AI/ML Project", icon: Brain, color: "text-accent" },
  { id: "custom", label: "Custom Solution", icon: Wrench, color: "text-warning" },
];

const budgetRanges = [
  { id: "small", label: "Under ₹5L", min: 100000, max: 500000 },
  { id: "medium", label: "₹5L - ₹15L", min: 500000, max: 1500000 },
  { id: "large", label: "₹15L - ₹30L", min: 1500000, max: 3000000 },
  { id: "enterprise", label: "₹30L+", min: 3000000, max: 10000000 },
];

function generateEstimate(config: {
  projectType: string;
  description: string;
  features: string;
  budgetRange: string;
}): ProjectEstimate {
  const featureList = config.features
    .split("\n")
    .map((f) => f.replace(/^-\s*/, "").trim())
    .filter(Boolean);
  
  const featureCount = Math.max(featureList.length, 3);
  const isComplex = featureCount > 5 || config.description.toLowerCase().includes("complex") || config.description.toLowerCase().includes("advanced");
  
  const baseCost: Record<string, number> = {
    web: 800000,
    mobile: 1000000,
    ai: 1500000,
    custom: 1200000,
  };
  
  const complexityMultiplier = isComplex ? 1.5 : 1;
  const featureMultiplier = 1 + (featureCount - 3) * 0.15;
  const totalBase = (baseCost[config.projectType] || 1000000) * complexityMultiplier * featureMultiplier;
  
  const devRatio = 0.55;
  const designRatio = 0.15;
  const testingRatio = 0.12;
  const deployRatio = 0.08;
  
  const development = Math.round(totalBase * devRatio / 10000) * 10000;
  const design = Math.round(totalBase * designRatio / 10000) * 10000;
  const testing = Math.round(totalBase * testingRatio / 10000) * 10000;
  const deployment = Math.round(totalBase * deployRatio / 10000) * 10000;
  const total = development + design + testing + deployment;

  const modules = [
    "User Authentication & Authorization",
    "Dashboard & Analytics",
    "API Integration Layer",
    "Database Management",
  ];
  if (featureCount > 3) modules.push("Real-time Notifications");
  if (featureCount > 4) modules.push("Admin Panel");
  if (featureList.some((f) => f.toLowerCase().includes("payment"))) modules.push("Payment Gateway Integration");
  if (featureList.some((f) => f.toLowerCase().includes("search"))) modules.push("Search & Filtering");
  if (config.projectType === "ai") modules.push("ML Model Training Pipeline", "Data Processing Engine");
  if (config.projectType === "mobile") modules.push("Push Notifications", "Offline Sync");

  const weeks = Math.max(8, Math.round(8 + featureCount * 1.5 + (isComplex ? 4 : 0)));
  
  const typeTech: Record<string, { frontend: string[]; backend: string[]; infra: string[]; tools: string[] }> = {
    web: {
      frontend: ["Next.js 14", "React 18", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "Express", "PostgreSQL", "Redis"],
      infra: ["AWS EC2", "S3", "Docker", "GitHub Actions"],
      tools: ["Figma", "VS Code", "Postman", "Jira"],
    },
    mobile: {
      frontend: ["React Native", "Expo", "TypeScript", "AsyncStorage"],
      backend: ["Node.js", "Firebase", "MongoDB"],
      infra: ["Firebase Hosting", "App Store", "Play Store"],
      tools: ["Xcode", "Android Studio", "Fastlane"],
    },
    ai: {
      frontend: ["Next.js", "React", "D3.js", "Tailwind CSS"],
      backend: ["Python", "FastAPI", "TensorFlow", "PostgreSQL"],
      infra: ["AWS SageMaker", "S3", "Docker", "MLflow"],
      tools: ["Jupyter", "VS Code", "Weights & Biases"],
    },
    custom: {
      frontend: ["React", "Vue.js", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "Python", "PostgreSQL", "MongoDB"],
      infra: ["AWS", "Docker", "Kubernetes", "Terraform"],
      tools: ["VS Code", "Git", "Jira", "Postman"],
    },
  };

  const tech = typeTech[config.projectType] || typeTech.web;

  return {
    scope: {
      summary: `A ${isComplex ? "complex" : "standard"} ${projectTypes.find((t) => t.id === config.projectType)?.label || "project"} with ${featureCount} key features. ${config.description.slice(0, 150)}`,
      modules,
      complexity: isComplex ? "High" : featureCount > 4 ? "Medium-High" : "Medium",
    },
    timeline: {
      totalWeeks: weeks,
      phases: [
        { name: "Discovery & Planning", weeks: Math.max(1, Math.round(weeks * 0.1)) },
        { name: "UI/UX Design", weeks: Math.max(1, Math.round(weeks * 0.15)) },
        { name: "Frontend Development", weeks: Math.round(weeks * 0.3) },
        { name: "Backend Development", weeks: Math.round(weeks * 0.3) },
        { name: "Testing & QA", weeks: Math.max(1, Math.round(weeks * 0.1)) },
        { name: "Deployment & Launch", weeks: Math.max(1, Math.round(weeks * 0.05)) },
      ],
    },
    team: {
      roles: [
        { role: "Project Manager", count: 1, allocation: "100%" },
        { role: "UI/UX Designer", count: 1, allocation: "100%" },
        { role: "Frontend Developer", count: isComplex ? 3 : 2, allocation: "100%" },
        { role: "Backend Developer", count: isComplex ? 3 : 2, allocation: "100%" },
        { role: "QA Engineer", count: 1, allocation: "75%" },
        ...(config.projectType === "ai" ? [{ role: "ML Engineer", count: 1, allocation: "100%" }] : []),
        { role: "DevOps Engineer", count: 1, allocation: "25%" },
      ],
      totalMembers: isComplex ? 10 : 8,
    },
    cost: { development, design, testing, deployment, total },
    technology: {
      frontend: tech.frontend,
      backend: tech.backend,
      infrastructure: tech.infra,
      tools: tech.tools,
    },
  };
}

export default function AIEstimatorPage() {
  const [form, setForm] = useState({
    description: "",
    projectType: "",
    features: "",
    budgetRange: "",
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimate, setEstimate] = useState<ProjectEstimate | null>(null);
  const [revealedSections, setRevealedSections] = useState<string[]>([]);

  const handleEstimate = () => {
    setIsEstimating(true);
    setEstimate(null);
    setRevealedSections([]);

    setTimeout(() => {
      const result = generateEstimate({
        projectType: form.projectType,
        description: form.description,
        features: form.features,
        budgetRange: form.budgetRange,
      });
      setEstimate(result);
      setIsEstimating(false);

      const sections = ["scope", "timeline", "team", "cost", "technology"];
      sections.forEach((section, index) => {
        setTimeout(() => {
          setRevealedSections((prev) => [...prev, section]);
        }, index * 300);
      });
    }, 2500);
  };

  const handleReset = () => {
    setForm({ description: "", projectType: "", features: "", budgetRange: "" });
    setEstimate(null);
    setRevealedSections([]);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 border border-warning/30">
            <Calculator className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI <span className="gradient-text">Project Estimator</span>
            </h1>
            <p className="text-sm text-muted">Get AI-powered project estimates instantly</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Input Form */}
        <motion.div variants={fadeInUp} className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Project Type */}
              <div className="space-y-2">
                <Label>Project Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.id}
                        variant={form.projectType === type.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm({ ...form, projectType: type.id })}
                        className="h-auto flex-col gap-1 py-3"
                      >
                        <Icon className={cn("h-5 w-5", form.projectType === type.id ? "text-white" : type.color)} />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Project Description</Label>
                <Textarea
                  placeholder="Describe your project goals, target audience, and key requirements..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Key Features</Label>
                <Textarea
                  placeholder="List the main features (one per line):&#10;- User authentication&#10;- Dashboard&#10;- Payment integration"
                  rows={4}
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                />
              </div>

              {/* Budget Range */}
              <div className="space-y-2">
                <Label>Budget Range</Label>
                <Select
                  value={form.budgetRange}
                  onValueChange={(value) => setForm({ ...form, budgetRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleEstimate}
                  disabled={isEstimating || !form.description || !form.projectType}
                >
                  {isEstimating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Estimating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Estimate
                    </>
                  )}
                </Button>
                {estimate && (
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loading State */}
          {isEstimating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-border/50 border-t-primary animate-spin" />
                <Calculator className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <p className="mt-6 text-lg font-medium text-white">Analyzing project requirements...</p>
              <p className="mt-2 text-sm text-muted">AI is calculating scope, timeline, and costs</p>
            </motion.div>
          )}

          {/* Empty State */}
          {!estimate && !isEstimating && (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card-hover/50 border border-border/50 mb-4">
                <Calculator className="h-10 w-10 text-muted" />
              </div>
              <h3 className="text-lg font-medium text-white">No estimate yet</h3>
              <p className="mt-2 text-sm text-muted max-w-md">
                Fill in the project details and click "Generate Estimate" to get an AI-powered
                analysis of scope, timeline, team, cost, and technology stack.
              </p>
            </motion.div>
          )}

          {/* Results */}
          {estimate && (
            <>
              {/* Scope */}
              <AnimatePresence>
                {revealedSections.includes("scope") && (
                  <motion.div variants={cardReveal} initial="initial" animate="animate">
                    <Card className="border-primary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Layers className="h-5 w-5 text-primary" />
                          Project Scope
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-foreground">{estimate.scope.summary}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted">Complexity:</span>
                          <Badge variant="warning">{estimate.scope.complexity}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white mb-2">Key Modules:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {estimate.scope.modules.map((module, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                                {module}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timeline */}
              <AnimatePresence>
                {revealedSections.includes("timeline") && (
                  <motion.div variants={cardReveal} initial="initial" animate="animate">
                    <Card className="border-secondary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="h-5 w-5 text-secondary" />
                          Timeline
                          <Badge variant="secondary" className="ml-auto">
                            {estimate.timeline.totalWeeks} weeks total
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {estimate.timeline.phases.map((phase, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <div className="w-40 text-sm text-foreground">{phase.name}</div>
                              <div className="flex-1">
                                <div className="h-3 rounded-full bg-border/50 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(phase.weeks / estimate.timeline.totalWeeks) * 100}%` }}
                                    transition={{ delay: i * 0.2, duration: 0.5 }}
                                    className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                                  />
                                </div>
                              </div>
                              <div className="w-16 text-right text-sm font-medium text-white">
                                {phase.weeks}w
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Team */}
              <AnimatePresence>
                {revealedSections.includes("team") && (
                  <motion.div variants={cardReveal} initial="initial" animate="animate">
                    <Card className="border-accent/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5 text-accent" />
                          Team Required
                          <Badge variant="secondary" className="ml-auto border-accent/30 text-accent">
                            {estimate.team.totalMembers} members
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {estimate.team.roles.map((role, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border border-border/50 bg-card-hover/30 p-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-white">{role.role}</p>
                                <p className="text-xs text-muted">{role.allocation} allocation</p>
                              </div>
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">
                                {role.count}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cost Estimate */}
              <AnimatePresence>
                {revealedSections.includes("cost") && (
                  <motion.div variants={cardReveal} initial="initial" animate="animate">
                    <Card className="border-warning/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <IndianRupee className="h-5 w-5 text-warning" />
                          Cost Estimate
                          <Badge variant="warning" className="ml-auto">
                            Total: {formatCurrency(estimate.cost.total)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { label: "Development", value: estimate.cost.development, color: "from-primary to-secondary" },
                            { label: "Design", value: estimate.cost.design, color: "from-secondary to-accent" },
                            { label: "Testing & QA", value: estimate.cost.testing, color: "from-accent to-warning" },
                            { label: "Deployment", value: estimate.cost.deployment, color: "from-warning to-danger" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <div className="w-32 text-sm text-foreground">{item.label}</div>
                              <div className="flex-1">
                                <div className="h-3 rounded-full bg-border/50 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / estimate.cost.total) * 100}%` }}
                                    transition={{ delay: i * 0.15, duration: 0.5 }}
                                    className={cn("h-full rounded-full bg-gradient-to-r", item.color)}
                                  />
                                </div>
                              </div>
                              <div className="w-24 text-right text-sm font-medium text-white">
                                {formatCurrency(item.value)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">Total Estimate</span>
                          <span className="text-2xl font-bold text-warning">
                            {formatCurrency(estimate.cost.total)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Technology Stack */}
              <AnimatePresence>
                {revealedSections.includes("technology") && (
                  <motion.div variants={cardReveal} initial="initial" animate="animate">
                    <Card className="border-success/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Zap className="h-5 w-5 text-success" />
                          Recommended Tech Stack
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: "Frontend", items: estimate.technology.frontend, color: "primary" },
                            { label: "Backend", items: estimate.technology.backend, color: "secondary" },
                            { label: "Infrastructure", items: estimate.technology.infrastructure, color: "accent" },
                            { label: "Tools", items: estimate.technology.tools, color: "warning" },
                          ].map((category, i) => (
                            <div key={i} className="rounded-lg border border-border/50 bg-card-hover/30 p-4">
                              <p className={cn("text-sm font-medium mb-2", `text-${category.color}`)}>
                                {category.label}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {category.items.map((tech, j) => (
                                  <Badge key={j} variant="secondary" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
