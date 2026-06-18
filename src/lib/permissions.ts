const ALL_PERMISSIONS = [
  "View Dashboard",
  "Manage Members",
  "Create Teams",
  "Assign Roles",
  "Manage Projects",
  "View Reports",
  "Manage Clients",
  "Manage Leads",
  "View Finance",
  "Manage Invoices",
  "Manage Courses",
  "Schedule Assessments",
  "View AI Insights",
  "System Settings",
  "View Audit Logs",
  "Manage Notifications",
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  "super-admin": [...ALL_PERMISSIONS],
  "core-admin": ["View Dashboard", "Manage Members", "Create Teams", "Manage Projects", "View Reports", "Manage Clients", "Manage Leads", "View Finance", "Manage Courses", "Schedule Assessments", "View AI Insights", "Manage Notifications"],
  "team-lead": ["View Dashboard", "Manage Members", "Manage Projects", "View Reports", "Manage Courses", "Schedule Assessments", "View AI Insights"],
  "developer": ["View Dashboard", "View Reports", "Manage Projects", "View AI Insights"],
  "intern": ["View Dashboard", "View Reports", "Manage Courses", "View AI Insights"],
  "trainee": ["View Dashboard", "View Reports", "Manage Courses"],
  "client": ["View Dashboard", "View Reports"],
};

export function getRolePermissions(role: string): string[] {
  try {
    const stored = localStorage.getItem("ahs_role_permissions");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[role]) return parsed[role];
    }
  } catch {}
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role: string, permission: string): boolean {
  const perms = getRolePermissions(role);
  return perms.includes(permission);
}

export function hasAnyPermission(role: string, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  children?: { label: string; href: string; permission?: string }[];
}

export function filterNavigationByRole(
  navigation: NavItem[],
  role: string
): NavItem[] {
  return navigation
    .map((item) => {
      if (item.permission && !hasPermission(role, item.permission)) {
        return null;
      }

      if (item.children) {
        const filteredChildren = item.children.filter(
          (child) => !child.permission || hasPermission(role, child.permission)
        );
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      return item;
    })
    .filter(Boolean) as NavItem[];
}

export function canAccessRoute(role: string, pathname: string): boolean {
  const routePermissionMap: Record<string, string[]> = {
    "/dashboard": ["View Dashboard"],
    "/people": ["Manage Members"],
    "/people/teams": ["Create Teams"],
    "/people/roles": ["Assign Roles"],
    "/people/[id]": ["Manage Members"],
    "/learning/courses": ["Manage Courses"],
    "/learning/assignments": ["Manage Courses"],
    "/assessments": ["Schedule Assessments"],
    "/assessments/builder": ["Schedule Assessments"],
    "/assessments/published": ["Schedule Assessments", "View Reports"],
    "/assessments/results": ["Schedule Assessments", "View Reports"],
    "/assessments/take": ["Schedule Assessments", "View Reports"],
    "/projects": ["Manage Projects"],
    "/projects/kanban": ["Manage Projects"],
    "/projects/sprints": ["Manage Projects"],
    "/projects/[id]": ["Manage Projects"],
    "/performance": ["View Reports"],
    "/performance/leaderboard": ["View Reports"],
    "/crm/leads": ["Manage Leads"],
    "/crm/clients": ["Manage Clients"],
    "/crm/meetings": ["Manage Clients"],
    "/clients-portal": ["Manage Clients"],
    "/finance": ["View Finance"],
    "/finance/invoices": ["Manage Invoices"],
    "/finance/quotations": ["View Finance"],
    "/ai-center": ["View AI Insights"],
    "/ai-center/assistant": ["View AI Insights"],
    "/ai-center/assessment-generator": ["View AI Insights"],
    "/analytics": ["View Reports"],
    "/notifications": ["View Audit Logs", "Manage Notifications"],
    "/settings": ["System Settings"],
  };

  for (const [route, permissions] of Object.entries(routePermissionMap)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return hasAnyPermission(role, permissions);
    }
  }

  return true;
}
