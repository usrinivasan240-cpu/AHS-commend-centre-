"use client";

import { usePathname, useRouter } from "next/navigation";
import { Command, Bell, Search, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  people: "People",
  members: "Members",
  teams: "Teams",
  roles: "Roles & Permissions",
  learning: "Learning",
  courses: "Courses",
  assignments: "Assignments",
  assessments: "Assessments",
  builder: "Test Builder",
  results: "Results",
  projects: "Projects",
  all: "All Projects",
  kanban: "Kanban Board",
  sprints: "Sprints",
  performance: "Performance",
  overview: "Overview",
  leaderboard: "Leaderboard",
  crm: "CRM",
  leads: "Leads",
  clients: "Clients",
  meetings: "Meetings",
  "clients-portal": "Clients Portal",
  finance: "Finance",
  invoices: "Invoices",
  quotations: "Quotations",
  "ai-center": "AI Center",
  assistant: "Assistant",
  "assessment-generator": "Assessment Generator",
  estimator: "Estimator",
  analytics: "Analytics",
  notifications: "Notifications",
  settings: "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const segments = pathname.split("/").filter(Boolean);

  const userName = user?.name || "Admin User";
  const userRole = user?.role ? user.role.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Administrator";
  const notificationCount = 5;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Left: Company Name */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight gradient-text lg:hidden">
          AHS
        </span>

        {/* Breadcrumb */}
        <nav className="hidden items-center gap-1.5 text-sm text-muted md:flex">
          {segments.map((segment, index) => {
            const label =
              pathLabels[segment] ||
              segment.charAt(0).toUpperCase() + segment.slice(1);
            const isLast = index === segments.length - 1;
            const href = "/" + segments.slice(0, index + 1).join("/");

            return (
              <span key={href} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span className="text-muted-foreground/50">/</span>
                )}
                <span
                  className={cn(
                    "transition-colors",
                    isLast
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer"
                  )}
                >
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <button className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border border-border bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium text-muted md:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push("/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/10 hover:text-foreground cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted/10 cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium leading-tight text-foreground">
                  {userName}
                </span>
                <span className="text-xs leading-tight text-muted">
                  {userRole}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs font-normal text-muted">
                  {userRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="text-danger focus:text-danger cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
