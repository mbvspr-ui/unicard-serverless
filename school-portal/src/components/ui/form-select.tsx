import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Label } from "./label"
import { cn } from "@/lib/utils"

export interface FormSelectProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  placeholder?: string
  options: { value: string; label: string }[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

const FormSelect = React.forwardRef<HTMLButtonElement, FormSelectProps>(
  ({ label, error, helperText, required, placeholder, options, value, onValueChange, disabled, className }, ref) => {
    const selectId = `select-${label?.toLowerCase().replace(/\s+/g, '-')}`
    
    return (
      <div className="space-y-2 w-full">
        {label && (
          <Label htmlFor={selectId} className="text-base sm:text-sm">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            ref={ref}
            id={selectId}
            className={cn(
              error && "border-destructive focus:ring-destructive",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          >
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
FormSelect.displayName = "FormSelect"

export { FormSelect }
