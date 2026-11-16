import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

type PaginationItem = number | "ellipsis"

type TablePaginationProps = {
  from: number
  to: number
  total: ReactNode
  itemLabel: string
  page: number
  pageCount: number
  // eslint-disable-next-line no-unused-vars -- parameter in a TypeScript signature.
  onPageChange?(page: number): void
  className?: string
}

function getPaginationItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  if (page <= 3) {
    return [1, 2, 3, "ellipsis", pageCount]
  }

  if (page >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 2, pageCount - 1, pageCount]
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", pageCount]
}

export function TablePagination({
  from,
  to,
  total,
  itemLabel,
  page,
  pageCount,
  onPageChange,
  className,
}: TablePaginationProps) {
  const items = getPaginationItems(page, pageCount)

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > pageCount) return
    onPageChange?.(nextPage)
  }

  return (
    <div
      className={cn(
        "border-border text-muted-foreground flex flex-col items-start gap-3 border-t px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span>
        A mostrar{" "}
        <strong>
          {from}–{to}
        </strong>{" "}
        de <strong>{total}</strong> {itemLabel}
      </span>
      <div className="flex w-full justify-end overflow-x-auto sm:w-auto">
        <Pagination className="mx-0 w-max justify-end gap-1">
          <Button
            aria-label="Página anterior"
            className="size-8"
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            size="icon-sm"
            variant="outline"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span
                aria-hidden="true"
                className="text-muted-foreground grid size-8 place-items-center"
                key={`ellipsis-${index}`}
              >
                <MoreHorizontal className="size-4" />
              </span>
            ) : (
              <Button
                aria-current={item === page ? "page" : undefined}
                aria-label={`Página ${item}`}
                className="size-8"
                key={item}
                onClick={() => goToPage(item)}
                size="icon-sm"
                variant={item === page ? "default" : "outline"}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            aria-label="Próxima página"
            className="size-8"
            disabled={page === pageCount}
            onClick={() => goToPage(page + 1)}
            size="icon-sm"
            variant="outline"
          >
            <ChevronRight className="size-4" />
          </Button>
        </Pagination>
      </div>
    </div>
  )
}
