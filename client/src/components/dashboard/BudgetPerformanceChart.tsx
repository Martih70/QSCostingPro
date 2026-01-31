import React from 'react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { getProjectBudgetComparison } from '../../utils/dashboardAnalytics'

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
  }
  name?: string
}

interface BudgetPerformanceChartProps {
  projects: ProjectWithEstimates[]
  isLoading?: boolean
}

export default function BudgetPerformanceChart({ projects, isLoading = false }: BudgetPerformanceChartProps) {
  const comparisons = getProjectBudgetComparison(projects, 5)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (comparisons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900">Budget vs Estimate</h3>
          <p className="text-sm text-gray-600">Top 5 projects by estimate value</p>
        </div>
        <p className="text-center text-gray-600 py-8">Set budgets to compare estimates</p>
      </div>
    )
  }

  // Find max value for scaling
  const maxValue = Math.max(...comparisons.flatMap((c) => [c.budget, c.estimate]))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900">Budget vs Estimate</h3>
        <p className="text-sm text-gray-600">Top 5 projects by estimate value</p>
      </div>

      <div className="space-y-5">
        {comparisons.map((comparison) => {
          const budgetPercent = (comparison.budget / maxValue) * 100
          const estimatePercent = (comparison.estimate / maxValue) * 100
          const varianceClass = comparison.isOverBudget ? 'text-khc-accent' : 'text-green-600'

          return (
            <div key={comparison.project_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate flex-1">{comparison.project_name}</h4>
                <span className={`text-xs font-semibold ${varianceClass}`}>
                  {comparison.isOverBudget ? '+' : ''}{formatPercentage(comparison.variancePercentage, 1)}
                </span>
              </div>

              {/* Budget bar (blue) */}
              <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
                <div className="absolute h-full bg-khc-primary rounded" style={{ width: `${budgetPercent}%` }}></div>
                <div className="relative h-full flex items-center px-2 text-xs font-medium text-white">
                  {budgetPercent > 20 && formatCurrency(comparison.budget)}
                </div>
              </div>

              {/* Estimate bar (orange if over, green if under) */}
              <div className="relative h-5 rounded overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                <div
                  className={`absolute h-full rounded ${comparison.isOverBudget ? 'bg-khc-accent' : 'bg-green-500'}`}
                  style={{ width: `${estimatePercent}%` }}
                ></div>
                <div className="relative h-full flex items-center px-2 text-xs font-medium text-white">
                  {estimatePercent > 20 && formatCurrency(comparison.estimate)}
                </div>
              </div>

              {/* Values and legend */}
              <div className="flex justify-between text-xs text-gray-600 px-1">
                <div className="flex gap-3">
                  <span>
                    <span className="font-medium">Budget:</span> {formatCurrency(comparison.budget)}
                  </span>
                  <span>
                    <span className="font-medium">Estimate:</span> {formatCurrency(comparison.estimate)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-khc-primary"></div>
          <span className="text-xs text-gray-600">Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-khc-accent"></div>
          <span className="text-xs text-gray-600">Estimate (Over)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-xs text-gray-600">Estimate (Under)</span>
        </div>
      </div>
    </div>
  )
}
