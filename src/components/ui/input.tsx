"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: boolean
  errorMessage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border bg-[#0f172a]/50 px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error
                ? "border-[#ef4444] focus-visible:ring-[#ef4444]"
                : "border-[#1e293b] hover:border-[#334155]",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-[#ef4444]">{errorMessage}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
