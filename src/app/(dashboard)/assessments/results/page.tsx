"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Download,
  Search,
  Filter,
  X,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const pieColors = ["#10b981", "#ef4444"];

type SortField = "name" | "score" | "timeTaken";
type SortDir = "asc" | "desc";

interface FirestoreResult {
  id: string;
  memberId: string;
  assessmentId: string;
  score: number;
  totalMarks: number;
  grade: string;
  timeTaken: number;
  status: "pass" | "fail";
  completedAt: string;
  [key: string]: unknown;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-[#64748b]" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-[#0066ff]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[#0066ff]" />
  );
}

export default function ResultsPage() {
  const { data: assessments, loading: loadingAssessments } = useFirestoreQuery(COLLECTIONS.ASSESSMENTS);
  const { data: rawResults, loading: loadingResults } = useFirestoreQuery(COLLECTIONS.ASSESSMENT_RESULTS);
  const { data: members } = useFirestoreQuery(COLLECTIONS.USERS);
  const results = rawResults as unknown as FirestoreResult[];
  const [assessmentFilter, setAssessmentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const loading = loadingAssessments || loadingResults;

  const completedAssessments = useMemo(() => assessments.filter((a) => a.status === "completed"), [assessments]);

  const resultsWithNames = useMemo(() => {
    return results.map((r) => {
      const member = members.find((m) => m.id === r.memberId);
      return { ...r, memberName: member?.name || "Unknown" };
    });
  }, [results, members]);

  const filtered = useMemo(() => {
    let result = [...resultsWithNames];

    if (assessmentFilter !== "all") {
      result = result.filter((r) => r.assessmentId === assessmentFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.memberName.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.memberName.localeCompare(b.memberName);
      else if (sortField === "score") cmp = a.score - b.score;
      else if (sortField === "timeTaken") cmp = a.timeTaken - b.timeTaken;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [assessmentFilter, search, sortField, sortDir, resultsWithNames]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const hasFilters = assessmentFilter !== "all" || search;

  const scoreDistribution = useMemo(() => {
    const ranges = ["0-20", "21-40", "41-60", "61-80", "81-100"];
    const buckets = [0, 0, 0, 0, 0];
    results.forEach((r) => {
      const pct = (r.score / r.totalMarks) * 100;
      if (pct <= 20) buckets[0]++;
      else if (pct <= 40) buckets[1]++;
      else if (pct <= 60) buckets[2]++;
      else if (pct <= 80) buckets[3]++;
      else buckets[4]++;
    });
    return ranges.map((range, i) => ({ range, count: buckets[i] }));
  }, [results]);

  const passFailData = useMemo(() => {
    const passCount = results.filter((r) => r.status === "pass").length;
    const failCount = results.filter((r) => r.status === "fail").length;
    return [
      { name: "Pass", value: passCount },
      { name: "Fail", value: failCount },
    ];
  }, [results]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#64748b]">Loading results...</div>
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Results</h1>
          <p className="mt-1 text-[#64748b]">View assessment results and performance analytics</p>
        </div>
        <Button variant="outline" onClick={() => alert('Exporting results...')}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Results", value: results.length, color: "text-[#0066ff]" },
          { label: "Pass Rate", value: results.length ? `${Math.round((results.filter((r) => r.status === "pass").length / results.length) * 100)}%` : "0%", color: "text-[#10b981]" },
          { label: "Avg Score", value: results.length ? `${Math.round(results.reduce((s, r) => s + (r.score / r.totalMarks) * 100, 0) / results.length)}%` : "0%", color: "text-[#00d9ff]" },
          { label: "Highest Score", value: results.length ? `${Math.max(...results.map((r) => r.score))}/${results.find((r) => r.score === Math.max(...results.map((r2) => r2.score)))?.totalMarks}` : "0/0", color: "text-[#f59e0b]" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-[#64748b]">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score Distribution */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#0066ff]" />
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#1e293b" }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#1e293b" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar dataKey="count" fill="url(#resultBarGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="resultBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0066ff" />
                        <stop offset="100%" stopColor="#00d9ff" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pass/Fail Pie */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                Pass / Fail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {passFailData.map((_, index) => (
                        <Cell key={index} fill={pieColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex justify-center gap-4">
                {passFailData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[i] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by member name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-3.5 w-3.5 text-[#64748b]" />
                  <SelectValue placeholder="Assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  {completedAssessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setAssessmentFilter("all"); }}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-[#f59e0b]" />
              Results ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e293b]">
                    <th className="pb-3 text-left text-sm font-medium text-[#64748b]">Rank</th>
                    <th className="pb-3 text-left">
                      <button
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                      >
                        Member
                        <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="pb-3 text-left">
                      <button
                        onClick={() => toggleSort("score")}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                      >
                        Score
                        <SortIcon field="score" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-[#64748b]">Grade</th>
                    <th className="pb-3 text-left">
                      <button
                        onClick={() => toggleSort("timeTaken")}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                      >
                        Time Taken
                        <SortIcon field="timeTaken" sortField={sortField} sortDir={sortDir} />
                      </button>
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-[#64748b]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((result, i) => (
                    <motion.tr
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#1e293b]/50 last:border-0 hover:bg-[#0f172a]/50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                          i === 0 ? "bg-[#f59e0b]/20 text-[#f59e0b]" :
                          i === 1 ? "bg-[#94a3b8]/20 text-[#94a3b8]" :
                          i === 2 ? "bg-[#cd7f32]/20 text-[#cd7f32]" :
                          "bg-[#1e293b]/50 text-[#64748b]"
                        )}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-white">{result.memberName}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-[#1e293b]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                result.status === "pass" ? "bg-[#10b981]" : "bg-[#ef4444]"
                              )}
                              style={{ width: `${(result.score / result.totalMarks) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white">
                            {result.score}/{result.totalMarks}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={result.score >= 90 ? "success" : result.score >= 70 ? "default" : result.score >= 50 ? "warning" : "danger"}>
                          {result.grade}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-[#64748b]">{result.timeTaken} min</span>
                      </td>
                      <td className="py-3">
                        {result.status === "pass" ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Pass
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Fail
                          </Badge>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-[#64748b]">
                  <Trophy className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>No results found matching your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
