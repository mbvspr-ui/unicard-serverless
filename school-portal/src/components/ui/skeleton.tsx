import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "circle" | "button"
  animate?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", animate = true, ...props }, ref) => {
    const baseClasses = cn(
      "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
      animate && "animate-shimmer"
    )

    const variantClasses = {
      default: "rounded-md",
      card: "rounded-xl h-32 w-full",
      text: "rounded h-4 w-full",
      circle: "rounded-full",
      button: "rounded-lg h-10 w-24",
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Skeleton components for common patterns
const SkeletonCard = () => (
  <div className="rounded-xl border border-gray-200 p-6 space-y-4 bg-white shadow-sm">
    <div className="flex items-center gap-4">
      <Skeleton variant="circle" className="h-12 w-12" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
    </div>
  </div>
)

const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white">
        <Skeleton variant="circle" className="h-16 w-16" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2 h-3" />
          <Skeleton variant="text" className="w-2/3 h-3" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="button" className="h-9 w-20" />
          <Skeleton variant="button" className="h-9 w-20" />
        </div>
      </div>
    ))}
  </div>
)

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
    {/* Header */}
    <div className="bg-gray-50 p-4 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-5" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="w-2/3 h-3" />
              <Skeleton variant="text" className="w-1/2 h-8" />
            </div>
            <Skeleton variant="circle" className="h-12 w-12" />
          </div>
        </div>
      ))}
    </div>
    {/* Quick Actions */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="h-12 w-12" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-full h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonDashboard }
