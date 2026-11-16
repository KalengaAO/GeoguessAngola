"use client"

import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  // eslint-disable-next-line no-unused-vars -- parameter in a TypeScript signature.
  render(item: T): ReactNode
  className?: string
  headerClassName?: string
}

export type DataTableSelection = {
  selectedRowKeys: ReadonlySet<string>
  // eslint-disable-next-line no-unused-vars -- parameter in a TypeScript signature.
  onToggleRow(key: string): void
  // eslint-disable-next-line no-unused-vars -- parameter in a TypeScript signature.
  onToggleAll(selected: boolean): void
}

export type DataTableProps<T> = {
  ariaLabel?: string
  columns: readonly DataTableColumn<T>[]
  data: readonly T[]
  // eslint-disable-next-line no-unused-vars -- parameter in a TypeScript signature.
  getRowKey(item: T): string
  emptyMessage?: string
  className?: string
  tableClassName?: string
  headClassName?: string
  rowClassName?: string
  selection?: DataTableSelection
}

export function DataTable<T>({
  ariaLabel,
  columns,
  data,
  getRowKey,
  emptyMessage = "Nenhum registo encontrado.",
  className,
  tableClassName,
  headClassName,
  rowClassName,
  selection,
}: DataTableProps<T>) {
  const rowKeys = data.map((item) => getRowKey(item))
  const selectedRowKeys = selection?.selectedRowKeys ?? new Set<string>()
  const allSelected =
    data.length > 0 && rowKeys.every((key) => selectedRowKeys.has(key))
  const someSelected = rowKeys.some((key) => selectedRowKeys.has(key))
  const columnCount = columns.length + (selection ? 1 : 0)

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table aria-label={ariaLabel} className={tableClassName}>
        <TableHeader>
          <TableRow>
            {selection && (
              <TableHead className={cn("w-12 px-4", headClassName)} scope="col">
                <Checkbox
                  aria-label="Seleccionar todos os registos"
                  checked={allSelected}
                  disabled={data.length === 0}
                  onChange={() => selection.onToggleAll(!allSelected)}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = someSelected && !allSelected
                    }
                  }}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                className={cn(headClassName, column.headerClassName)}
                key={column.key}
                scope="col"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => {
              const key = getRowKey(item)

              return (
                <TableRow
                  className={cn("hover:bg-muted/30", rowClassName)}
                  key={key}
                >
                  {selection && (
                    <TableCell className="w-12 px-4">
                      <Checkbox
                        aria-label={`Seleccionar registo ${key}`}
                        checked={selectedRowKeys.has(key)}
                        onChange={() => selection.onToggleRow(key)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell className={column.className} key={column.key}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell
                className="text-muted-foreground h-32 text-center"
                colSpan={columnCount}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
