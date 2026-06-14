"use client";

import { useState, useEffect } from "react";
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

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "People",
    href: "/people",
    icon: Users,
    children: [
      { label: "Members", href: "/people" },
      { label: "Teams", href: "/people/teams" },
      { label: "Roles & Permissions", href: "/people/roles" },
    ],
  },
  {
    label: "Learning",
    href: "/learning",
    icon: BookOpen,
    children: [
      { label: "Courses", href: "/learning/courses" },
      { label: "Assignments", href: "/learning/assignments" },
    ],
  },
  {
    label: "Assessments",
    href: "/assessments",
    icon: ClipboardCheck,
    children: [
      { label: "Test Builder", href: "/assessments/builder" },
      { label: "Results", href: "/assessments/results" },
    ],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    children: [
      { label: "All Projects", href: "/projects" },
      { label: "Kanban Board", href: "/projects/kanban" },
      { label: "Sprints", href: "/projects/sprints" },
    ],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: Trophy,
    children: [
      { label: "Overview", href: "/performance" },
      { label: "Leaderboard", href: "/performance/leaderboard" },
    ],
  },
  {
    label: "CRM",
    href: "/crm",
    icon: Contact2,
    children: [
      { label: "Leads", href: "/crm/leads" },
      { label: "Clients", href: "/crm/clients" },
      { label: "Meetings", href: "/crm/meetings" },
    ],
  },
  { label: "Clients Portal", href: "/clients-portal", icon: ExternalLink },
  {
    label: "Finance",
    href: "/finance",
    icon: DollarSign,
    children: [
      { label: "Overview", href: "/finance" },
      { label: "Invoices", href: "/finance/invoices" },
      { label: "Quotations", href: "/finance/quotations" },
    ],
  },
  {
    label: "AI Center",
    href: "/ai-center",
    icon: Brain,
    children: [
      { label: "Assistant", href: "/ai-center/assistant" },
      { label: "Assessment Generator", href: "/ai-center/assessment-generator" },
      { label: "Estimator", href: "/ai-center/estimator" },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const activeSections = navigation
      .filter((item) => item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/")))
      .map((item) => item.label);
    if (activeSections.length > 0) {
      setOpenSections((prev) => [...new Set([...prev, ...activeSections])]);
    }
  }, [pathname]);

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
