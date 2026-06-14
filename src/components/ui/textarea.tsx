"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  errorMessage?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border bg-[#0f172a]/50 px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-[#ef4444] focus-visible:ring-[#ef4444]"
              : "border-[#1e293b] hover:border-[#334155]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-[#ef4444]">{errorMessage}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
