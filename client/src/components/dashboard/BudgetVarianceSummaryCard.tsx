import React from 'react'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { calculateBudgetVariance } from '../../utils/dashboardAnalytics'

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

interface BudgetVarianceSummaryCardProps {
  projects: ProjectWithEstimates[]
  isLoading?: boolean
}

export default function BudgetVarianceSummaryCard({
  projects,
  isLoading = false,
}: BudgetVarianceSummaryCardProps) {
  const variance = calculateBudgetVariance(projects)
  const isOverBudget = variance.variance > 0
  const borderColor = isOverBudget ? 'border-khc-accent' : 'border-green-500'
  const textColor = isOverBudget ? 'text-khc-accent' : 'text-green-600'
  const bgColor = isOverBudget ? 'bg-orange-50' : 'bg-green-50'

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${borderColor}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const projectsAtRisk = variance.projectsOverBudget
  const projectsUnderBudget = variance.projectsUnderBudget

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${borderColor} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">Budget Variance</p>
          <p className={`text-3xl font-bold mt-2 ${textColor}`}>
            {isOverBudget ? '+' : ''}{formatCurrency(variance.variance)}
          </p>

          <div className="mt-3 flex items-center gap-1">
            <span className={`inline-flex items-center ${isOverBudget ? 'text-khc-accent' : 'text-green-600'} text-sm font-medium`}>
              {isOverBudget ? (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 15a1 1 0 01-.707-.293l-2.828-2.829a1 1 0 011.414-1.414L11 11.414V5a1 1 0 112 0v5.414l1.121-1.121a1 1 0 111.414 1.414l-2.828 2.829A1 1 0 0112 15z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 5a1 1 0 01.707.293l2.828 2.829a1 1 0 11-1.414 1.414L13 8.586V15a1 1 0 11-2 0V8.586l-1.121 1.121a1 1 0 11-1.414-1.414l2.828-2.829A1 1 0 0112 5z" clipRule="evenodd" />
                </svg>
              )}
              {formatPercentage(Math.abs(variance.variancePercentage), 1)}
            </span>
            <span className="text-gray-500 text-sm ml-1">({isOverBudget ? 'over' : 'under'} budget)</span>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            {projectsAtRisk > 0 && `${projectsAtRisk} project${projectsAtRisk !== 1 ? 's' : ''} over budget • `}
            {projectsUnderBudget > 0 && `${projectsUnderBudget} under budget`}
            {projectsAtRisk === 0 && projectsUnderBudget === 0 && 'No budget data available'}
          </p>
        </div>

        <div className={`${bgColor} rounded-lg w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl`}>
          {isOverBudget ? '⚠️' : '✓'}
        </div>
      </div>
    </div>
  )
}
