"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Filter,
  Trash2,
  Mail,
  MailOpen,
  AlertTriangle,
  FileText,
  Users,
  ClipboardList,
  Settings,
  Zap,
  Briefcase,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const listItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  project: Briefcase,
  assessment: FileText,
  lead: Users,
  team: Users,
  assignment: ClipboardList,
  system: Settings,
};

const typeColors: Record<string, string> = {
  project: "bg-primary/10 text-primary",
  assessment: "bg-secondary/10 text-secondary",
  lead: "bg-emerald-500/10 text-emerald-400",
  team: "bg-accent/10 text-accent",
  assignment: "bg-warning/10 text-warning",
  system: "bg-danger/10 text-danger",
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

export default function NotificationsPage() {
  const { data: notifications, loading } = useFirestoreQuery(COLLECTIONS.NOTIFICATIONS);
  const { update, remove } = useFirestoreActions(COLLECTIONS.NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const unreadCount = useMemo(
    () => notifications.filter((n: any) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n: any) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const toggleRead = async (id: string, currentRead: boolean) => {
    try {
      await update(id, { read: !currentRead });
    } catch (err) {
      console.error("Failed to toggle read:", err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n: any) => !n.read);
    try {
      await Promise.all(unread.map((n: any) => update(n.id, { read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Notifications{" "}
            <span className="gradient-text">Center</span>
          </h1>
          <p className="mt-1 text-muted">
            Stay updated with all activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="default" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </motion.div>

      {loading && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted">Loading notifications...</span>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">
              All
              <Badge
                variant="secondary"
                className="ml-1.5 text-[10px] px-1.5 py-0"
              >
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="project" className="text-xs">
              Projects
            </TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs">
              Assessments
            </TabsTrigger>
            <TabsTrigger value="lead" className="text-xs">
              Leads
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              Team
            </TabsTrigger>
            <TabsTrigger value="assignment" className="text-xs">
              Assignments
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs">
              System
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Notification List */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {filtered.map((notification: any) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  return (
                    <motion.div
                      key={notification.id}
                      variants={listItem}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className={cn(
                        "flex items-start gap-4 p-4 transition-colors hover:bg-card-hover/30",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          typeColors[notification.type]
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3
                              className={cn(
                                "text-sm font-medium",
                                notification.read
                                  ? "text-[#e2e8f0]"
                                  : "text-white"
                              )}
                            >
                              {notification.title}
                            </h3>
                            <p className="mt-0.5 text-sm text-muted line-clamp-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.read && (
                              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-muted">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize"
                          >
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleRead(notification.id, notification.read)}
                          title={
                            notification.read
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                        >
                          {notification.read ? (
                            <MailOpen className="h-4 w-4 text-muted" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            deleteNotification(notification.id)
                          }
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-muted hover:text-danger transition-colors" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/10 mb-4">
                    <Bell className="h-8 w-8 text-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-white">
                    No notifications
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {activeFilter === "all"
                      ? "You're all caught up!"
                      : `No ${activeFilter} notifications found.`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
