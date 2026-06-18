"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessRoute } from "@/lib/permissions";
import { AlertTriangle } from "lucide-react";

export default function PermissionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  if (!canAccessRoute(user.role, pathname)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-2xl bg-destructive/10 p-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="max-w-md text-muted-foreground">
          Your role <span className="font-semibold text-primary">{user.role}</span> does
          not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
