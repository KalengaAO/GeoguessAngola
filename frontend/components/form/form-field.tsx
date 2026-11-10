import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type FormFieldProps = {
  label: string
  children: ReactNode
  required?: boolean
  error?: string
  className?: string
}

export function FormField({
  label,
  children,
  required = false,
  error,
  className,
}: FormFieldProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-xs font-semibold text-[#52658a]">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {error && (
        <span className="text-destructive block text-xs" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
