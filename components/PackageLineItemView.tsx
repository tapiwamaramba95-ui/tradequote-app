'use client'

import { useState } from 'react'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { colors } from '@/lib/colors'

interface PackageLineItemViewProps {
  lineItem: {
    description: string
    quantity: number
    rate: number
    amount: number
    is_from_package?: boolean
    package_snapshot?: {
      package_name: string
      items: Array<{
        item_name: string
        supplier: string | null
        unit_cost: number
        quantity: number
        line_total: number
      }>
      total_cost: number
    }
    cost?: number
    profit?: number
    margin?: number
  }
  showProfitInfo?: boolean // Only show to authenticated tradies
}

export default function PackageLineItemView({ lineItem, showProfitInfo = false }: PackageLineItemViewProps) {
  const [expanded, setExpanded] = useState(false)

  if (!lineItem.is_from_package || !lineItem.package_snapshot) {
    // Regular line item - just show description
    return (
      <div className="py-2">
        <div className="font-medium" style={{ color: colors.text.primary }}>
          {lineItem.description}
        </div>
      </div>
    )
  }

  const { package_snapshot, cost, profit, margin } = lineItem

  return (
    <div className="py-2">
      {/* Line Item Description with Package Indicator */}
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <Package 
            size={16} 
            className="text-orange-600"
          />
        </div>
        <div className="flex-1">
          <div className="font-medium" style={{ color: colors.text.primary }}>
            {lineItem.description}
          </div>
          
          {showProfitInfo && cost !== undefined && profit !== undefined && (
            <div className="text-xs mt-1 space-y-0.5" style={{ color: colors.text.secondary }}>
              <div className="flex items-center gap-3">
                <span>📦 Package: {package_snapshot.package_name}</span>
                <span>💰 Cost: ${cost?.toFixed(2)}</span>
                <span className="text-green-600 font-medium">✨ Profit: ${profit?.toFixed(2)}</span>
                {margin !== undefined && (
                  <span className="text-green-600 font-medium">
                    ({margin?.toFixed(1)}% margin)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {showProfitInfo && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
            title={expanded ? "Hide materials" : "View materials"}
          >
            {expanded ? (
              <ChevronUp size={16} style={{ color: colors.text.secondary }} />
            ) : (
              <ChevronDown size={16} style={{ color: colors.text.secondary }} />
            )}
          </button>
        )}
      </div>

      {/* Expanded Material Breakdown (Tradie Only) */}
      {showProfitInfo && expanded && (
        <div 
          className="mt-3 ml-6 p-3 rounded border"
          style={{
            backgroundColor: colors.background.hover,
            borderColor: colors.border.DEFAULT
          }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: colors.text.secondary }}>
            PACKAGE MATERIALS BREAKDOWN
          </div>
          <div className="space-y-1.5">
            {package_snapshot.items.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded"
                style={{ backgroundColor: colors.background.card }}
              >
                <div className="flex-1">
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    {item.item_name}
                  </span>
                  {item.supplier && (
                    <span className="ml-2 text-xs" style={{ color: colors.text.secondary }}>
                      ({item.supplier})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.secondary }}>
                  <span>Qty: {item.quantity}</span>
                  <span>@ ${item.unit_cost.toFixed(2)}</span>
                  <span className="font-semibold min-w-[70px] text-right" style={{ color: colors.text.primary }}>
                    ${item.line_total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div 
            className="mt-2 pt-2 flex justify-between items-center border-t"
            style={{ borderColor: colors.border.DEFAULT }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
              Total Material Cost:
            </span>
            <span className="text-sm font-bold" style={{ color: colors.accent.DEFAULT }}>
              ${package_snapshot.total_cost.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
