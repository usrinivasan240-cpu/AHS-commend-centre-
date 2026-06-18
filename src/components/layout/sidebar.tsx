"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  Trophy,
  Contact2,
  ExternalLink,
  DollarSign,
  Brain,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import {
  filterNavigationByRole,
  type NavItem,
} from "@/lib/permissions";

const allNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "View Dashboard" },
  {
    label: "People",
    href: "/people",
    icon: Users,
    permission: "Manage Members",
    children: [
      { label: "Members", href: "/people", permission: "Manage Members" },
      { label: "Teams", href: "/people/teams", permission: "Create Teams" },
      { label: "Roles & Permissions", href: "/people/roles", permission: "Assign Roles" },
    ],
  },
  {
    label: "Learning",
    href: "/learning",
    icon: BookOpen,
    permission: "Manage Courses",
    children: [
      { label: "Courses", href: "/learning/courses", permission: "Manage Courses" },
      { label: "Assignments", href: "/learning/assignments", permission: "Manage Courses" },
    ],
  },
  {
    label: "Assessments",
    href: "/assessments",
    icon: ClipboardCheck,
    permission: "Schedule Assessments",
    children: [
      { label: "Published Tests", href: "/assessments/published", permission: "Schedule Assessments" },
      { label: "Results", href: "/assessments/results", permission: "Schedule Assessments" },
    ],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    permission: "Manage Projects",
    children: [
      { label: "All Projects", href: "/projects", permission: "Manage Projects" },
      { label: "Kanban Board", href: "/projects/kanban", permission: "Manage Projects" },
      { label: "Sprints", href: "/projects/sprints", permission: "Manage Projects" },
    ],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: Trophy,
    permission: "View Reports",
    children: [
      { label: "Overview", href: "/performance", permission: "View Reports" },
      { label: "Leaderboard", href: "/performance/leaderboard", permission: "View Reports" },
    ],
  },
  {
    label: "CRM",
    href: "/crm",
    icon: Contact2,
    permission: "Manage Leads",
    children: [
      { label: "Leads", href: "/crm/leads", permission: "Manage Leads" },
      { label: "Clients", href: "/crm/clients", permission: "Manage Clients" },
      { label: "Meetings", href: "/crm/meetings", permission: "Manage Clients" },
    ],
  },
  { label: "Clients Portal", href: "/clients-portal", icon: ExternalLink, permission: "Manage Clients" },
  {
    label: "Finance",
    href: "/finance",
    icon: DollarSign,
    permission: "View Finance",
    children: [
      { label: "Overview", href: "/finance", permission: "View Finance" },
      { label: "Invoices", href: "/finance/invoices", permission: "Manage Invoices" },
      { label: "Quotations", href: "/finance/quotations", permission: "View Finance" },
    ],
  },
  {
    label: "AI Center",
    href: "/ai-center",
    icon: Brain,
    permission: "View AI Insights",
    children: [
      { label: "Assistant", href: "/ai-center/assistant", permission: "View AI Insights" },
      { label: "Assessment Generator", href: "/ai-center/assessment-generator", permission: "View AI Insights" },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: BarChart3, permission: "View Reports" },
  { label: "Notifications", href: "/notifications", icon: Bell, permission: "Manage Notifications" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "System Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = useMemo(
    () => (user?.role ? filterNavigationByRole(allNavigation, user.role) : allNavigation),
    [user?.role]
  );

  useEffect(() => {
    const activeSections = navigation
      .filter((item) => item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/")))
      .map((item) => item.label);
    if (activeSections.length > 0) {
      setOpenSections((prev) => [...new Set([...prev, ...activeSections])]);
    }
  }, [pathname, navigation]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some((child) => isActive(child.href)) ?? false;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold gradient-text">A</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight gradient-text">
                  AHS
                </span>
                <span className="text-[10px] text-muted leading-none">
                  Command Center
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isParentActive(item);
              const open = openSections.includes(item.label);

              if (!item.children) {
                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );

                return (
                  <li key={item.label}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    )}
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.children[0].href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleSection(item.label)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            open && "rotate-180"
                          )}
                        />
                      </button>
                      <ul
                        className={cn(
                          "ml-4 mt-1 space-y-0.5 overflow-hidden border-l border-border pl-3 transition-all duration-200",
                          open
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                      >
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block rounded-md px-3 py-1.5 text-sm transition-all duration-200",
                                pathname === child.href
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/10 hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
