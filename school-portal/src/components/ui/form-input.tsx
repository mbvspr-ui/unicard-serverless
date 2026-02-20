import * as React from "react"
import { Input } from "./input"
import { Label } from "./label"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  success?: boolean
  floatingLabel?: boolean
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, success, floatingLabel = false, className, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue)
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(!!e.target.value)
      props.onBlur?.(e)
    }
    
    if (floatingLabel && label) {
      return (
        <div className="relative w-full">
          <Input
            id={inputId}
            ref={ref}
            className={cn(
              "peer pt-6 pb-2 transition-all duration-200",
              error && "border-red-500 focus-visible:ring-red-500",
              success && "border-green-500 focus-visible:ring-green-500",
              !error && !success && "focus-visible:ring-blue-500 focus-visible:border-blue-500",
              className
            )}
            placeholder=" "
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          <Label
            htmlFor={inputId}
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none",
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:translate-y-0",
              "top-2 text-xs translate-y-0",
              error && "text-red-600 peer-focus:text-red-600",
              success && "text-green-600 peer-focus:text-green-600",
              !error && !success && "text-gray-600 peer-focus:text-blue-600"
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          )}
          {error && (
            <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
              {helperText}
            </p>
          )}
        </div>
      )
    }
    
    return (
      <div className="space-y-2 w-full">
        {label && (
          <Label htmlFor={inputId} className="text-base sm:text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            className={cn(
              "transition-all duration-200",
              error && "border-red-500 focus-visible:ring-red-500 pr-10",
              success && "border-green-500 focus-visible:ring-green-500 pr-10",
              !error && !success && "focus-visible:ring-blue-500 focus-visible:border-blue-500",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput }
