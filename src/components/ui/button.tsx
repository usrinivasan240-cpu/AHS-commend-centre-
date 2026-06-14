"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0066ff] text-white hover:bg-[#0052cc] shadow-[0_0_15px_rgba(0,102,255,0.3)]",
        secondary:
          "bg-[#00d9ff]/10 text-[#00d9ff] border border-[#00d9ff]/30 hover:bg-[#00d9ff]/20",
        outline:
          "border border-[#1e293b] bg-transparent text-[#e2e8f0] hover:bg-[#1e293b]/50 hover:text-white",
        ghost:
          "text-[#e2e8f0] hover:bg-[#1e293b]/50 hover:text-white",
        danger:
          "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
        accent:
          "bg-[#7fff00]/10 text-[#7fff00] border border-[#7fff00]/30 hover:bg-[#7fff00]/20 shadow-[0_0_15px_rgba(127,255,0,0.15)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size, className }), (child.props as { className?: string }).className),
        ref,
        disabled: disabled || loading,
        ...props,
      } as React.HTMLAttributes<HTMLElement>)
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
