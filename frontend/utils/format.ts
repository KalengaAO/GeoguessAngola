export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export const formatDateShort = (date: string | Date): string => {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export const timeAgo = (date: string | Date): string => {
  return new Intl.RelativeTimeFormat("pt-AO", { numeric: "auto" }).format(
    Math.round((new Date(date).getTime() - Date.now()) / 86400000),
    "day",
  )
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(value)
}

export const capitalize = (text: string): string => {
  if (!text) return ""
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

export const formatGrade = (value: number): string => {
  const rounded = Math.round(value)
  let level = ""
  if (rounded >= 16) level = "Excelente"
  else if (rounded >= 13) level = "Bom"
  else if (rounded >= 10) level = "Suficiente"
  else if (rounded >= 1) level = "Insuficiente"
  else level = "Mau"
  return `${rounded} (${level})`
}

export const formatTrimester = (trimester: number): string => {
  if (trimester < 1 || trimester > 3) return `${trimester}º trimestre`
  return `${trimester}.º trimestre`
}

export const formatStatus = (
  status: "PENDENTE" | "PAGA" | "VENCIDA" | "ISENTA",
): string => {
  const icons = {
    PENDENTE: "⏳",
    PAGA: "✅",
    VENCIDA: "⚠️",
    ISENTA: "🆓",
  }
  return `${icons[status]} ${status.charAt(0) + status.slice(1).toLowerCase()}`
}
