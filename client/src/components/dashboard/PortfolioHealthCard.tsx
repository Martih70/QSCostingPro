import { formatCurrency } from '../../utils/formatters'

interface ProjectHealthCardProps {
  portfolioValue: number
  activeProjects: number
  completedProjects: number
  avgProjectValue: number
  isLoading?: boolean
}

export default function ProjectHealthCard({
  portfolioValue,
  activeProjects,
  completedProjects,
  avgProjectValue,
  isLoading = false,
}: ProjectHealthCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md p-8 animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const totalProjects = activeProjects + completedProjects
  const completionRate = totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : 0

  return (
    <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg overflow-hidden text-white">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2">Project Portfolio Health 💪</h3>
          <p className="text-purple-100">Complete view of your projects</p>
        </div>

        {/* Main metrics grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Total Project Value */}
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
            <p className="text-purple-100 text-xs font-medium mb-1">Total Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(portfolioValue)}</p>
            <p className="text-xs text-purple-100 mt-2">across all projects</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
            <p className="text-purple-100 text-xs font-medium mb-1">Completion</p>
            <p className="text-2xl font-bold text-white">{completionRate}%</p>
            <p className="text-xs text-purple-100 mt-2">{completedProjects} of {totalProjects}</p>
          </div>

          {/* Active Projects */}
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
            <p className="text-purple-100 text-xs font-medium mb-1">Active</p>
            <p className="text-2xl font-bold text-white">{activeProjects}</p>
            <p className="text-xs text-purple-100 mt-2">in progress</p>
          </div>

          {/* Average Value */}
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
            <p className="text-purple-100 text-xs font-medium mb-1">Average Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgProjectValue)}</p>
            <p className="text-xs text-purple-100 mt-2">per project</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 border border-white border-opacity-20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Pipeline Progress</span>
            <span className="text-xs text-purple-100">{completionRate}% done</span>
          </div>
          <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-300 to-pink-100 rounded-full transition-all" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
