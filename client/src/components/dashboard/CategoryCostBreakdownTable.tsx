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

interface CategoryCostBreakdownTableProps {
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

export default function CategoryCostBreakdownTable({
  projects,
  isLoading = false,
}: CategoryCostBreakdownTableProps) {
  const distribution = getCategoryCostDistribution(projects)
  const totalCost = distribution.reduce((sum, cat) => sum + cat.total_cost, 0)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (distribution.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cost by Category</h3>
        <p className="text-center text-gray-600 py-8">No category data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-khc-primary to-khc-secondary">
        <h3 className="font-semibold text-white">📊 Cost by Category</h3>
        <p className="text-xs text-gray-200 mt-1">{distribution.length} categories across projects</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Total Cost</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">%</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Projects</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700">Avg/Project</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {distribution.map((category, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm font-medium text-gray-900">{category.category_name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(category.total_cost)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                      {formatPercentage(category.percentage, 1)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-medium text-gray-600">{category.project_count}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(category.avg_cost_per_project)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Project Total</span>
          <span className="text-lg font-bold text-khc-primary">{formatCurrency(totalCost)}</span>
        </div>
      </div>
    </div>
  )
}
