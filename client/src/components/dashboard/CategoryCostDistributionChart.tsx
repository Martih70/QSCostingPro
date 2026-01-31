import React from 'react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { getCategoryCostDistribution } from '../../utils/dashboardAnalytics'

interface ProjectWithEstimates {
  id: number
  status: 'draft' | 'in_progress' | 'completed'
  estimate_status: 'draft' | 'submitted' | 'approved' | 'rejected'
  budget_cost?: number
  estimate_totals?: {
    grand_total: number
    floor_area_m2?: number
    subtotal: number
    contingency_amount: number
    contingency_percentage: number
    categories: Array<{
      category_name: string
      subtotal: number
    }>
  }
  name?: string
}

interface CategoryCostDistributionChartProps {
  projects: ProjectWithEstimates[]
  isLoading?: boolean
}

const COLORS = [
  '#2C5F8D', // khc-primary blue
  '#4A7BA7', // khc-secondary
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#6366f1', // indigo
]

export default function CategoryCostDistributionChart({
  projects,
  isLoading = false,
}: CategoryCostDistributionChartProps) {
  const distribution = getCategoryCostDistribution(projects)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded"></div>
      </div>
    )
  }

  if (distribution.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900">Cost Distribution by Category</h3>
          <p className="text-sm text-gray-600">Project breakdown</p>
        </div>
        <p className="text-center text-gray-600 py-12">No category data available</p>
      </div>
    )
  }

  const totalCost = distribution.reduce((sum, cat) => sum + cat.total_cost, 0)

  // Create SVG path for donut chart
  const radius = 70
  const circumference = 2 * Math.PI * radius
  let currentAngle = -90 // Start from top
  let previousOffset = 0

  const slices = distribution.map((category, index) => {
    const categoryPercentage = (category.total_cost / totalCost) * 100
    const sliceLength = (categoryPercentage / 100) * circumference
    const startOffset = previousOffset
    const endOffset = startOffset + sliceLength
    previousOffset = endOffset

    const startAngle = currentAngle * (Math.PI / 180)
    const endAngle = (currentAngle + (categoryPercentage / 100) * 360) * (Math.PI / 180)

    const startX = 100 + radius * Math.cos(startAngle)
    const startY = 100 + radius * Math.sin(startAngle)
    const endX = 100 + radius * Math.cos(endAngle)
    const endY = 100 + radius * Math.sin(endAngle)

    const largeArc = categoryPercentage > 50 ? 1 : 0

    const path = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} L ${100 + (radius - 25) * Math.cos(endAngle)} ${100 + (radius - 25) * Math.sin(endAngle)} A ${radius - 25} ${radius - 25} 0 ${largeArc} 0 ${100 + (radius - 25) * Math.cos(startAngle)} ${100 + (radius - 25) * Math.sin(startAngle)} Z`

    currentAngle += (categoryPercentage / 100) * 360

    return {
      path,
      color: COLORS[index % COLORS.length],
      ...category,
    }
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900">Cost Distribution by Category</h3>
        <p className="text-sm text-gray-600">Project breakdown</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-8">
        {/* Donut Chart */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {slices.map((slice, index) => (
                <g key={index}>
                  <path d={slice.path} fill={slice.color} opacity="0.9" className="hover:opacity-100 transition-opacity cursor-pointer" />
                </g>
              ))}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-khc-primary">{formatCurrency(totalCost)}</p>
                <p className="text-xs text-gray-500 mt-1">Total Cost</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition">
              <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: slice.color }}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{slice.category_name}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-600">{formatCurrency(slice.total_cost)}</p>
                  <p className="text-xs font-semibold text-gray-700">{formatPercentage(slice.percentage, 1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional stats */}
      <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-600 mb-1">Categories</p>
          <p className="text-lg font-bold text-gray-900">{distribution.length}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-600 mb-1">Avg per Category</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalCost / distribution.length)}</p>
        </div>
      </div>
    </div>
  )
}
