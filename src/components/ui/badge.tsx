import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:ring-offset-2 focus:ring-offset-[#050816]",
  {
    variants: {
      variant: {
        default:
          "border-[#0066ff]/30 bg-[#0066ff]/10 text-[#0066ff]",
        secondary:
          "border-[#1e293b] bg-[#1e293b]/50 text-[#94a3b8]",
        outline:
          "border-[#1e293b] bg-transparent text-[#e2e8f0]",
        success:
          "border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]",
        warning:
          "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]",
        danger:
          "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]",
        info:
          "border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
