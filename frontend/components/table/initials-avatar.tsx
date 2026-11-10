import { cn } from "@/lib/utils"

export type AvatarTone = "blue" | "amber" | "cyan" | "orange"

const toneClasses: Record<AvatarTone, string> = {
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  cyan: "bg-cyan-100 text-cyan-700",
  orange: "bg-orange-100 text-orange-600",
}

type InitialsAvatarProps = {
  name: string
  tone?: AvatarTone
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function InitialsAvatar({
  name,
  tone = "blue",
  className,
}: InitialsAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  )
}
