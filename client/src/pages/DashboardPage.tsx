import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjectsStore } from '../stores/projectsStore'
import StatCard from '../components/dashboard/StatCard'
import BudgetVarianceSummaryCard from '../components/dashboard/BudgetVarianceSummaryCard'
import BudgetPerformanceChart from '../components/dashboard/BudgetPerformanceChart'
import CategoryCostDistributionChart from '../components/dashboard/CategoryCostDistributionChart'
import CategoryCostBreakdownTable from '../components/dashboard/CategoryCostBreakdownTable'
import {
  calculateTotalProjectValue,
  calculateAvgCostPerM2,
  getProjectBudgetComparison,
} from '../utils/dashboardAnalytics'
import { formatCurrency } from '../utils/formatters'

export default function DashboardPage() {
  const { user } = useAuth()
  const { projects, isLoading, fetchProjects } = useProjectsStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Calculate financial metrics
  const projectsTotalValue = calculateTotalProjectValue(projects)
  const avgCostPerM2 = calculateAvgCostPerM2(projects)
  const activeProjectsCount = projects.filter((p) => p.status !== 'completed').length
  const projectsOverBudget = getProjectBudgetComparison(projects).length

  // Determine visible sections based on role
  const canViewFinancials = user?.role === 'admin' || user?.role === 'estimator'

  return (
    <div className="space-y-6">
      {canViewFinancials && (
        <>
          {/* VARIED CARD LAYOUT - Dynamic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Large Featured Card - Project Value (2x2 span) */}
            <div className="md:col-span-2 lg:col-span-6 lg:row-span-2">
              <div className="bg-gradient-to-br from-khc-primary to-khc-secondary rounded-lg shadow-md p-8 text-white h-full flex flex-col justify-between overflow-hidden relative"
                style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-1/3 mb-4"></div>
                    <div className="h-12 bg-white bg-opacity-20 rounded w-1/2"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-white text-opacity-80 mb-2">Total Project Value</p>
                      <h2 className="text-4xl font-bold mb-1">{formatCurrency(projectsTotalValue)}</h2>
                      <p className="text-xs text-white text-opacity-70">{projects.length} active projects</p>
                    </div>

                    {/* Mini sparkline-style visualization */}
                    <div className="mt-6 pt-6 border-t border-white border-opacity-20">
                      <svg className="w-full h-16" viewBox="0 0 200 60">
                        <polyline
                          points="0,40 25,35 50,30 75,25 100,20 125,25 150,30 175,35 200,40"
                          fill="none"
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth="2"
                        />
                        <polyline
                          points="0,45 25,40 50,35 75,30 100,25 125,30 150,35 175,40 200,45"
                          fill="rgba(255,255,255,0.1)"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="1"
                        />
                      </svg>
                      <p className="text-xs text-white text-opacity-70 mt-2">Cumulative estimate trend</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Budget Variance Card (1x2 span) */}
            <div className="md:col-span-1 lg:col-span-3 lg:row-span-2">
              <BudgetVarianceSummaryCard projects={projects} isLoading={isLoading} />
            </div>

            {/* Small KPI - Active Projects */}
            <div className="md:col-span-1 lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 h-full flex flex-col justify-between"
                style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Active Projects</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{activeProjectsCount}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 rounded p-2">
                        <p className="text-gray-600">In Progress</p>
                        <p className="font-bold text-green-700">{projects.filter(p => p.status === 'in_progress').length}</p>
                      </div>
                      <div className="bg-blue-50 rounded p-2">
                        <p className="text-gray-600">Draft</p>
                        <p className="font-bold text-blue-700">{projects.filter(p => p.status === 'draft').length}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Small KPI - Avg Cost per m² */}
            {avgCostPerM2 && (
              <div className="md:col-span-1 lg:col-span-3">
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 h-full flex flex-col justify-between"
                  style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
                  {isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Avg Cost per m²</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(avgCostPerM2)}</p>
                      </div>
                      <div className="mt-4">
                        <div className="text-xs text-gray-500">
                          <p>Per square meter</p>
                          <p className="text-purple-600 font-semibold">Industry metric</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Projects at Risk Card (highlighted) */}
            <div className="md:col-span-1 lg:col-span-3">
              <Link
                to="/projects"
                className="block bg-gradient-to-br from-khc-accent to-orange-600 rounded-lg shadow-md p-6 text-white h-full hover:shadow-lg transition-shadow cursor-pointer"
                style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-white bg-opacity-20 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-white bg-opacity-20 rounded w-1/3"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white text-opacity-90 mb-2">Projects at Risk</p>
                        <p className="text-4xl font-bold">{projectsOverBudget}</p>
                        <p className="text-xs text-white text-opacity-80 mt-1">Over budget</p>
                      </div>
                      <div className="text-4xl">⚠️</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                      <p className="text-xs text-white text-opacity-70">View details →</p>
                    </div>
                  </>
                )}
              </Link>
            </div>

            {/* Budget Performance Chart (2-col span) */}
            <div className="md:col-span-2 lg:col-span-7">
              <BudgetPerformanceChart projects={projects} isLoading={isLoading} />
            </div>

            {/* Category Distribution Donut (1-col span) */}
            <div className="md:col-span-1 lg:col-span-5">
              <CategoryCostDistributionChart projects={projects} isLoading={isLoading} />
            </div>
          </div>

          {/* SECONDARY SECTION - Full width tables */}
          <div className="space-y-6">
            {/* Category breakdown table */}
            <CategoryCostBreakdownTable projects={projects} isLoading={isLoading} />

            {/* Quick Actions Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/projects/new"
                className="group block bg-khc-primary hover:bg-khc-neutral text-white rounded-lg p-6 transition-all text-center hover:scale-105 transform"
                style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="font-semibold">Create Project</h3>
                <p className="text-xs text-gray-200 mt-2">Start a new project</p>
              </Link>

              <Link
                to="/projects"
                className="group block bg-khc-secondary hover:bg-khc-primary text-white rounded-lg p-6 transition-all text-center hover:scale-105 transform"
                style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-semibold">All Projects</h3>
                <p className="text-xs text-gray-200 mt-2">View {projects.length} projects</p>
              </Link>

              <Link
                to="/projects"
                className="group block bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg p-6 transition-all text-center hover:scale-105 transform"
                style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
                <div className="text-4xl mb-3">✓</div>
                <h3 className="font-semibold">Completed</h3>
                <p className="text-xs text-gray-200 mt-2">{projects.filter(p => p.status === 'completed').length} finished</p>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Non-Financial Users Message */}
      {!canViewFinancials && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Financial metrics are available to administrators and estimators.</p>
        </div>
      )}
    </div>
  )
}
