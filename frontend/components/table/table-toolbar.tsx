import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type TableToolbarProps = {
  children: ReactNode
  className?: string
}

export function TableToolbar({ children, className }: TableToolbarProps) {
  return (
    <div
      className={cn(
        "border-border flex flex-wrap items-center gap-2 border-b p-4",
        className,
      )}
    >
      {children}
    </div>
  )
}
