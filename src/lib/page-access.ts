// Per-role page access (workflow editor) — single source of truth for which UI
// pages each role may see. Intentionally dependency-free (no imports) so both
// client components and lib/permissions.ts can use it without import cycles.
//
// Storage: localStorage `ahs_role_pages` is the primary store — reads are
// synchronous, so sidebar + route guard apply instantly on login, even when
// Firestore rules block direct client reads. Firestore `role_page_access`
// (doc id = role slug) is a best-effort cross-device mirror written by the
// Roles admin page; it never overrides localStorage on read.

export interface PageNode {
  label: string;
  href: string;
}

export interface PageGroup {
  label: string;
  pages: PageNode[];
}

// Must mirror the routes rendered in components/layout/sidebar.tsx.
// `href` values are the canonical page keys used for matching.
export const PAGE_GROUPS: PageGroup[] = [
  {
    label: "Main",
    pages: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Analytics", href: "/analytics" },
      { label: "Notifications", href: "/notifications" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    label: "People",
    pages: [
      { label: "Members", href: "/people" },
      { label: "Teams", href: "/people/teams" },
      { label: "Roles & Permissions", href: "/people/roles" },
    ],
  },
  {
    label: "Learning",
    pages: [
      { label: "Courses", href: "/learning/courses" },
      { label: "Assignments", href: "/learning/assignments" },
    ],
  },
  {
    label: "Bootcamp",
    pages: [
      { label: "My Learning", href: "/lms/learn" },
      { label: "Manage Courses", href: "/lms/courses" },
      { label: "Test Monitoring", href: "/lms/monitoring" },
    ],
  },
  {
    label: "Assessments",
    pages: [
      { label: "Overview", href: "/assessments" },
      { label: "Builder", href: "/assessments/builder" },
      { label: "Published Tests", href: "/assessments/published" },
      { label: "Results", href: "/assessments/results" },
    ],
  },
  {
    label: "Projects",
    pages: [
      { label: "All Projects", href: "/projects" },
      { label: "Kanban Board", href: "/projects/kanban" },
      { label: "Sprints", href: "/projects/sprints" },
    ],
  },
  {
    label: "Performance",
    pages: [
      { label: "Overview", href: "/performance" },
      { label: "Leaderboard", href: "/performance/leaderboard" },
    ],
  },
  {
    label: "CRM",
    pages: [
      { label: "Overview", href: "/crm" },
      { label: "Leads", href: "/crm/leads" },
      { label: "Clients", href: "/crm/clients" },
      { label: "Meetings", href: "/crm/meetings" },
      { label: "Clients Portal", href: "/clients-portal" },
    ],
  },
  {
    label: "Finance",
    pages: [
      { label: "Overview", href: "/finance" },
      { label: "Invoices", href: "/finance/invoices" },
      { label: "Quotations", href: "/finance/quotations" },
    ],
  },
  {
    label: "AI Center",
    pages: [
      { label: "Hub", href: "/ai-center" },
      { label: "Assistant", href: "/ai-center/assistant" },
      { label: "Estimator", href: "/ai-center/estimator" },
      { label: "Assessment Generator", href: "/ai-center/assessment-generator" },
    ],
  },
  {
    label: "Email Campaigns",
    pages: [
      { label: "Campaigns", href: "/email-campaigns" },
      { label: "Create Campaign", href: "/email-campaigns/create" },
      { label: "Upload Leads", href: "/email-campaigns/upload" },
      { label: "Email Queue", href: "/email-campaigns/queue" },
      { label: "Sent Emails", href: "/email-campaigns/sent" },
      { label: "Replies", href: "/email-campaigns/replies" },
      { label: "Suppression List", href: "/email-campaigns/suppression" },
      { label: "Analytics", href: "/email-campaigns/analytics" },
    ],
  },
];

export const ALL_PAGE_HREFS: string[] = Array.from(
  new Set(PAGE_GROUPS.flatMap((g) => g.pages.map((p) => p.href)))
);

const STORAGE_KEY = "ahs_role_pages";

/**
 * Resolve a live pathname to its most-specific catalog page.
 * e.g. `/people/abc123` -> `/people`, `/people/roles` -> `/people/roles`.
 * Returns null when the path is not a UI page (API routes, login, etc.).
 */
export function resolvePageHref(pathname: string): string | null {
  let best: string | null = null;
  for (const href of ALL_PAGE_HREFS) {
    if (pathname === href || pathname.startsWith(href + "/")) {
      if (!best || href.length > best.length) best = href;
    }
  }
  return best;
}

/** Explicit admin override for a role, or null (= derive from permissions). */
export function getRolePageOverride(role: string): string[] | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const val = parsed[role];
    return Array.isArray(val) ? (val as string[]) : null;
  } catch {
    return null;
  }
}

export function getAllRolePageOverrides(): Record<string, string[]> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) out[k] = v as string[];
    }
    return out;
  } catch {
    return {};
  }
}

export function setRolePageOverride(role: string, hrefs: string[]): void {
  try {
    const all = getAllRolePageOverrides();
    all[role] = [...hrefs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — enforcement falls back to permissions
  }
}

export function clearRolePageOverride(role: string): void {
  try {
    const all = getAllRolePageOverrides();
    delete all[role];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
