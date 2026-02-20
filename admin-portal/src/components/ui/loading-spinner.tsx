import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  text?: string
  variant?: "default" | "gradient"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", text, variant = "default", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-3", className)}
        {...props}
      >
        <div className="relative">
          {variant === "gradient" ? (
            <>
              {/* Gradient spinner with glow effect */}
              <div className={cn(
                "rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 animate-spin",
                size === "sm" && "h-8 w-8",
                size === "md" && "h-12 w-12",
                size === "lg" && "h-16 w-16"
              )}>
                <div className={cn(
                  "rounded-full bg-white m-1",
                  size === "sm" && "h-6 w-6",
                  size === "md" && "h-10 w-10",
                  size === "lg" && "h-14 w-14"
                )} />
              </div>
              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 blur-md opacity-50 animate-pulse",
                size === "sm" && "h-8 w-8",
                size === "md" && "h-12 w-12",
                size === "lg" && "h-16 w-16"
              )} />
            </>
          ) : (
            <Loader2 className={cn(
              "animate-spin text-blue-600 transition-all duration-300",
              sizeClasses[size]
            )} />
          )}
        </div>
        {text && (
          <p className={cn(
            "text-gray-600 font-medium animate-pulse",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}>
            {text}
          </p>
        )}
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }
