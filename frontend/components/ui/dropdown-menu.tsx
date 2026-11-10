"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  asChild,
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const context = React.useContext(DropdownMenuContext)

  if (!context) {
    return null
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: React.MouseEventHandler<HTMLButtonElement>
      className?: string
      "aria-expanded"?: boolean
    }>

    return React.cloneElement(child, {
      ...props,
      onClick: (...args: [React.MouseEvent<HTMLButtonElement>]) => {
        const event = args[0]
        context.setOpen((value) => !value)
        child.props.onClick?.(event)
      },
      "aria-expanded": context.open,
      className: cn(className, child.props.className),
    })
  }

  return (
    <button
      type="button"
      className={cn("inline-flex items-center", className)}
      onClick={() => context.setOpen((value) => !value)}
      aria-expanded={context.open}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({
  align = "start",
  className,
  children,
}: {
  align?: "start" | "end"
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(DropdownMenuContext)

  if (!context || !context.open) {
    return null
  }

  const alignClass = align === "end" ? "right-0" : "left-0"

  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground absolute z-50 mt-2 min-w-[180px] rounded-md border p-1 shadow-lg",
        alignClass,
        className,
      )}
      role="menu"
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "hover:bg-accent hover:text-accent-foreground flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator() {
  return <div className="bg-border my-1 h-px" />
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
