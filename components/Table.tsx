'use client'

import { ReactNode } from 'react'
import { colors } from '@/lib/colors'

export type TableColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string // e.g., '10%', '100px', 'auto'
  render?: (row: any) => ReactNode
}

type TableProps = {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  emptyMessage?: string | ReactNode
}

export default function Table({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'No data found' 
}: TableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2" 
          style={{ borderColor: colors.accent.DEFAULT }}
        ></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div 
        className="text-center py-12"
        style={{ color: colors.text.secondary }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr 
            style={{ 
              backgroundColor: colors.background.card, 
              borderBottom: `2px solid #e5e7eb` 
            }}
          >
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '16px',
                  textAlign: column.align || 'left',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: column.width || 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              style={{
                backgroundColor: 'white',
              }}
              className="hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '16px',
                    textAlign: column.align || 'left',
                    fontSize: '14px',
                    color: colors.text.primary,
                  }}
                >
                  {column.render 
                    ? column.render(row) 
                    : row[column.key] || '-'
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
