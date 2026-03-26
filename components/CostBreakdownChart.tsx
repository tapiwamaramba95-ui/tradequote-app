'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

type CostBreakdownChartProps = {
  data: { name: string; value: number }[]
}

export default function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No cost data available yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => {
            if (value === undefined) return '$0.00'
            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
