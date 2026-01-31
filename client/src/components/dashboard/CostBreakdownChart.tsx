import { formatCurrency } from '../../utils/formatters'

interface Project {
  id: number
  status: 'draft' | 'in_progress' | 'completed'
  estimate_totals?: {
    grand_total: number
  }
}

interface CostBreakdownChartProps {
  projects: Project[]
  isLoading?: boolean
}

export default function CostBreakdownChart({ projects, isLoading = false }: CostBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate cost by status
  const costByStatus = {
    active: projects
      .filter((p) => p.status !== 'completed')
      .reduce((sum, p) => sum + (p.estimate_totals?.grand_total || 0), 0),
    completed: projects
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.estimate_totals?.grand_total || 0), 0),
  }

  const totalCost = costByStatus.active + costByStatus.completed
  const activePercentage = totalCost > 0 ? ((costByStatus.active / totalCost) * 100).toFixed(1) : 0
  const completedPercentage = totalCost > 0 ? ((costByStatus.completed / totalCost) * 100).toFixed(1) : 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Project Cost Breakdown</h3>
        <p className="text-sm text-gray-600">by project status</p>
      </div>

      {totalCost === 0 ? (
        <p className="text-center text-gray-600 py-8">No cost data available</p>
      ) : (
        <div className="space-y-4">
          {/* Stacked bar chart */}
          <div>
            <div className="w-full h-6 bg-gray-200 rounded-lg overflow-hidden flex">
              <div className="bg-blue-500 h-full" style={{ width: `${activePercentage}%` }}></div>
              <div className="bg-gray-400 h-full" style={{ width: `${completedPercentage}%` }}></div>
            </div>
          </div>

          {/* Legend and values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Active Projects</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(costByStatus.active)}</p>
              <p className="text-xs text-gray-600 mt-1">{activePercentage}% of projects</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Completed</span>
              </div>
              <p className="text-xl font-bold text-gray-600">{formatCurrency(costByStatus.completed)}</p>
              <p className="text-xs text-gray-600 mt-1">{completedPercentage}% of projects</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Cost</span>
              <span className="text-lg font-bold text-khc-primary">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
