"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, AuthGuard } from "@/lib/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={0}>
        <AuthGuard>{children}</AuthGuard>
      </TooltipProvider>
    </AuthProvider>
  );
}
