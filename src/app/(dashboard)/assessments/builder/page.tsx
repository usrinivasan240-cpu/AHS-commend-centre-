"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  FileText,
  Code,
  MessageSquare,
  Mic,
  Shield,
  Eye,
  Shuffle,
  Monitor,
  Globe,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const questionTypes = [
  {
    id: "mcq",
    icon: FileText,
    label: "Multiple Choice",
    description: "Single or multi-select answer questions with predefined options",
    color: "text-[#0066ff]",
    bg: "bg-[#0066ff]/10",
  },
  {
    id: "coding",
    icon: Code,
    label: "Coding Challenge",
    description: "Write and execute code to solve programming problems",
    color: "text-[#00d9ff]",
    bg: "bg-[#00d9ff]/10",
  },
  {
    id: "essay",
    icon: MessageSquare,
    label: "Essay / Written",
    description: "Long-form written responses evaluated for content quality",
    color: "text-[#7fff00]",
    bg: "bg-[#7fff00]/10",
  },
  {
    id: "viva",
    icon: Mic,
    label: "Viva / Oral",
    description: "Live or recorded oral examination with follow-up questions",
    color: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
  },
];

export default function TestBuilderPage() {
  const [title, setTitle] = useState("");
  const [type] = useState("mcq");
  const [duration, setDuration] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("50");
  const [scheduleDate, setScheduleDate] = useState("");
  const [description, setDescription] = useState("");

  const [timerEnabled, setTimerEnabled] = useState(true);
  const [randomize, setRandomize] = useState(false);
  const [activityMonitoring, setActivityMonitoring] = useState(true);
  const [browserFocus, setBrowserFocus] = useState(true);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq"]);

  const toggleQuestionType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Test Builder</h1>
            <p className="mt-1 text-[#64748b]">Create and configure new assessments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => alert('Draft saved!')}>Save Draft</Button>
          <Button onClick={() => alert('Assessment published!')}>
            <Save className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <motion.div variants={fadeInUp} className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-[#0066ff]" />
                Assessment Details
              </CardTitle>
              <CardDescription>Configure the basic information for this assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., React Advanced Concepts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of the assessment..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min={5}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule Date</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Passing Marks</Label>
                  <Input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-[#0066ff]" />
                Question Types
              </CardTitle>
              <CardDescription>Select which question types to include</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {questionTypes.map((qt) => {
                  const Icon = qt.icon;
                  const selected = selectedTypes.includes(qt.id);
                  return (
                    <div
                      key={qt.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        selected
                          ? "border-[#0066ff]/50 bg-[#0066ff]/5 shadow-[0_0_15px_rgba(0,102,255,0.1)]"
                          : "border-[#1e293b] bg-[#0f172a]/30 hover:border-[#334155]"
                      }`}
                      onClick={() => toggleQuestionType(qt.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${qt.bg}`}>
                          <Icon className={`h-5 w-5 ${qt.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{qt.label}</p>
                          <p className="text-xs text-[#64748b]">{qt.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Anti-Cheat Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-[#ef4444]" />
                Anti-Cheat Settings
              </CardTitle>
              <CardDescription>Configure integrity and monitoring options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#f59e0b]" />
                  <div>
                    <p className="font-medium text-white">Timer</p>
                    <p className="text-xs text-[#64748b]">Enforce time limit for the assessment</p>
                  </div>
                </div>
                <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
              </div>
              <Separator className="bg-[#1e293b]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shuffle className="h-5 w-5 text-[#00d9ff]" />
                  <div>
                    <p className="font-medium text-white">Question Randomization</p>
                    <p className="text-xs text-[#64748b]">Shuffle question order for each attempt</p>
                  </div>
                </div>
                <Switch checked={randomize} onCheckedChange={setRandomize} />
              </div>
              <Separator className="bg-[#1e293b]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-[#7fff00]" />
                  <div>
                    <p className="font-medium text-white">Activity Monitoring</p>
                    <p className="text-xs text-[#64748b]">Track tab switches and mouse movements</p>
                  </div>
                </div>
                <Switch checked={activityMonitoring} onCheckedChange={setActivityMonitoring} />
              </div>
              <Separator className="bg-[#1e293b]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-[#0066ff]" />
                  <div>
                    <p className="font-medium text-white">Browser Focus Detection</p>
                    <p className="text-xs text-[#64748b]">Alert when user leaves the assessment tab</p>
                  </div>
                </div>
                <Switch checked={browserFocus} onCheckedChange={setBrowserFocus} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Preview */}
        <motion.div variants={fadeInUp}>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-[#0066ff]" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-[#1e293b] bg-[#0f172a]/50 p-4">
                <h3 className="text-lg font-semibold text-white">
                  {title || "Untitled Assessment"}
                </h3>
                <p className="mt-1 text-sm text-[#64748b]">
                  {description || "No description provided"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={typeBadge(type)}>{type.toUpperCase()}</Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    {duration} min
                  </Badge>
                  <Badge variant="outline">{totalMarks} marks</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-[#64748b]">Schedule</p>
                <p className="text-white">{scheduleDate || "Not scheduled"}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-[#64748b]">Passing Score</p>
                <p className="text-white">{passingMarks}/{totalMarks} ({Math.round((Number(passingMarks) / Number(totalMarks)) * 100)}%)</p>
              </div>

              <Separator className="bg-[#1e293b]" />

              <div className="space-y-2 text-sm">
                <p className="text-[#64748b]">Question Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTypes.length > 0 ? (
                    selectedTypes.map((st) => {
                      const qt = questionTypes.find((q) => q.id === st);
                      return <Badge key={st} variant="secondary" className="text-[10px]">{qt?.label}</Badge>;
                    })
                  ) : (
                    <span className="text-[#64748b]">None selected</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-[#64748b]">Anti-Cheat</p>
                <div className="flex flex-wrap gap-1.5">
                  {timerEnabled && <Badge variant="warning" className="text-[10px]">Timer</Badge>}
                  {randomize && <Badge variant="info" className="text-[10px]">Randomize</Badge>}
                  {activityMonitoring && <Badge variant="success" className="text-[10px]">Activity Monitor</Badge>}
                  {browserFocus && <Badge variant="default" className="text-[10px]">Focus Detection</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function typeBadge(type: string) {
  const map: Record<string, "default" | "info" | "success" | "warning"> = {
    mcq: "default",
    coding: "info",
    essay: "success",
    viva: "warning",
  };
  return map[type] || "secondary";
}
