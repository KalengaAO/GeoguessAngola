import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type StatusTone = "success" | "warning" | "danger" | "muted"

const toneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  muted: "bg-muted text-muted-foreground",
}

const dotClasses: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  muted: "bg-muted-foreground",
}

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusTone
  showDot?: boolean
  className?: string
}

export function StatusBadge({
  children,
  tone = "muted",
  showDot = true,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {showDot && (
        <span className={cn("size-1.5 rounded-full", dotClasses[tone])} />
      )}
      {children}
    </span>
  )
}
