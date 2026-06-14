"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  color?: "default" | "secondary" | "success" | "warning" | "danger" | "accent"
  animated?: boolean
}

const progressColors = {
  default: "bg-[#0066ff]",
  secondary: "bg-[#00d9ff]",
  success: "bg-[#10b981]",
  warning: "bg-[#f59e0b]",
  danger: "bg-[#ef4444]",
  accent: "bg-[#7fff00]",
}

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, color = "default", animated = true, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-[#1e293b]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 rounded-full transition-all duration-500 ease-out",
        progressColors[color],
        animated && "relative overflow-hidden"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {animated && (value || 0) > 0 && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
