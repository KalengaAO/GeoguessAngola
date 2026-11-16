import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type FormSectionProps = {
  title: string
  description: string
  children: ReactNode
  divider?: boolean
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  divider = false,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "p-5 sm:p-6",
        divider && "border-border border-b",
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="font-display text-base font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </div>
      {children}
    </section>
  )
}
