'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface CaseTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  emptyMessage?: string
}

type SortDirection = 'asc' | 'desc' | null

export default function CaseTable<T extends { id: string }>({
  data,
  columns,
  emptyMessage = 'データがありません',
}: CaseTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
      else setSortDir('asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const av = a[sortKey]
    const bv = b[sortKey]
    if (av === bv) return 0
    const cmp = av < bv ? -1 : 1
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key)
      return <ChevronsUpDown size={13} className="text-gray-300 ml-1 flex-shrink-0" />
    if (sortDir === 'asc')
      return <ChevronUp size={13} className="text-blue-500 ml-1 flex-shrink-0" />
    return <ChevronDown size={13} className="text-blue-500 ml-1 flex-shrink-0" />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${
                  col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''
                } ${col.width || ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="flex items-center">
                  {col.label}
                  <SortIcon col={col} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${
                  i % 2 === 0 ? '' : 'bg-gray-50/30'
                }`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-gray-700">
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
