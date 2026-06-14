"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#1e293b]",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[#0066ff]/10 text-[#0066ff] text-sm font-medium",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: "sm" | "md" | "lg"
}

const avatarSizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 5, size = "md", ...props }, ref) => {
    const childArray = React.Children.toArray(children)
    const visible = childArray.slice(0, max)
    const remaining = childArray.length - max

    return (
      <div ref={ref} className={cn("flex items-center -space-x-2", className)} {...props}>
        {visible.map((child, i) => (
          <div key={i} className="relative ring-2 ring-[#0f172a] rounded-full">
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  className: cn(avatarSizes[size], (child.props as any).className),
                })
              : child}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className={cn(
              "relative flex items-center justify-center rounded-full bg-[#1e293b] text-[#64748b] font-medium ring-2 ring-[#0f172a]",
              avatarSizes[size]
            )}
          >
            +{remaining}
          </div>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup }
