"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Calendar,
  Phone,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  CalendarDays,
  LayoutList,
  LayoutGrid,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { meetings as initialMeetings, clients } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import type { Meeting } from "@/types";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const typeConfig: Record<string, { icon: typeof Phone; color: string; bg: string }> = {
  call: { icon: Phone, color: "text-blue-400", bg: "bg-blue-500/10" },
  meeting: { icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
  "follow-up": { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
};

const statusConfig: Record<string, { variant: "success" | "warning" | "danger" | "default"; label: string }> = {
  scheduled: { variant: "warning", label: "Scheduled" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    clientId: "",
    date: "",
    time: "",
    type: "meeting" as Meeting["type"],
    notes: "",
  });

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || "Internal";

  const filteredMeetings = useMemo(() => {
    let result = [...meetings];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          getClientName(m.clientId).toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((m) => m.type === typeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }
    return result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [meetings, search, typeFilter, statusFilter]);

  const addMeeting = () => {
    if (!newMeeting.title || !newMeeting.date) return;
    const meeting: Meeting = {
      id: String(meetings.length + 1),
      title: newMeeting.title,
      clientId: newMeeting.clientId,
      date: newMeeting.time
        ? `${newMeeting.date}T${newMeeting.time}`
        : `${newMeeting.date}T09:00:00`,
      type: newMeeting.type,
      status: "scheduled",
      notes: newMeeting.notes || undefined,
    };
    setMeetings((prev) => [...prev, meeting]);
    setNewMeeting({
      title: "",
      clientId: "",
      date: "",
      time: "",
      type: "meeting",
      notes: "",
    });
    setDialogOpen(false);
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getMeetingsForDay = (day: Date) =>
    meetings.filter((m) => isSameDay(parseISO(m.date), day));

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="gradient-text">Meetings</span>
          </h1>
          <p className="mt-1 text-muted">
            {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-[#1e293b] bg-[#0f172a]/50 p-0.5">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-3 w-3" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="follow-up">Follow-up</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* List View */}
      {viewMode === "list" && (
        <motion.div variants={fadeInUp} className="space-y-3">
          <AnimatePresence>
            {filteredMeetings.map((meeting) => {
              const config = typeConfig[meeting.type] || typeConfig.meeting;
              const TypeIcon = config.icon;
              const sConfig = statusConfig[meeting.status];
              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            config.bg
                          )}
                        >
                          <TypeIcon className={cn("h-5 w-5", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white">{meeting.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("capitalize text-[10px]", config.color)}
                              >
                                {meeting.type}
                              </Badge>
                              <Badge variant={sConfig.variant} className="text-[10px]">
                                {sConfig.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(meeting.date)}
                            </div>
                            {meeting.clientId && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {getClientName(meeting.clientId)}
                              </div>
                            )}
                          </div>
                          {meeting.notes && (
                            <div className="mt-3 rounded-md bg-card-hover/50 p-3">
                              <div className="flex items-start gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted mt-0.5 shrink-0" />
                                <p className="text-sm text-muted">{meeting.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredMeetings.length === 0 && (
            <div className="py-12 text-center text-muted">No meetings found.</div>
          )}
        </motion.div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="bg-[#0f172a] p-2 text-center text-xs font-medium text-muted"
                  >
                    {day}
                  </div>
                ))}
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="bg-[#0f172a]/50 min-h-[100px] p-2" />
                ))}
                {daysInMonth.map((day) => {
                  const dayMeetings = getMeetingsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "bg-[#0f172a] min-h-[100px] p-2 transition-colors hover:bg-card-hover/30",
                        isToday && "ring-1 ring-primary/50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isToday ? "text-primary" : "text-muted"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayMeetings.slice(0, 3).map((m) => {
                          const config = typeConfig[m.type] || typeConfig.meeting;
                          return (
                            <div
                              key={m.id}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] truncate font-medium",
                                config.bg,
                                config.color
                              )}
                            >
                              {m.title}
                            </div>
                          );
                        })}
                        {dayMeetings.length > 3 && (
                          <span className="text-[10px] text-muted">
                            +{dayMeetings.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Schedule Meeting Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Create a new meeting or call.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newMeeting.title}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, title: e.target.value })
                }
                placeholder="Meeting title"
              />
            </div>
            <div>
              <Label>Client</Label>
              <Select
                value={newMeeting.clientId}
                onValueChange={(v) =>
                  setNewMeeting({ ...newMeeting, clientId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Internal</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newMeeting.time}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, time: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={newMeeting.type}
                onValueChange={(v) =>
                  setNewMeeting({ ...newMeeting, type: v as Meeting["type"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newMeeting.notes}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, notes: e.target.value })
                }
                placeholder="Meeting notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addMeeting}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
