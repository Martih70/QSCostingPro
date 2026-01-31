/**
 * Dashboard analytics calculations
 * Client-side calculations for professional KPIs
 */

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
    categories?: Array<{
      category_name: string
      subtotal: number
      [key: string]: any
    }>
  }
}

/**
 * Calculate the total project value (sum of active project estimates)
 */
export function calculateTotalProjectValue(projects: ProjectWithEstimates[]): number {
  return projects
    .filter((p) => p.status !== 'completed')
    .reduce((sum, project) => {
      const value = project.estimate_totals?.grand_total || project.budget_cost || 0
      return sum + value
    }, 0)
}

/**
 * Calculate average project value across all projects
 */
export function calculateAverageProjectValue(projects: ProjectWithEstimates[]): number {
  if (projects.length === 0) return 0

  const totalValue = projects.reduce((sum, project) => {
    const value = project.estimate_totals?.grand_total || project.budget_cost || 0
    return sum + value
  }, 0)

  return totalValue / projects.length
}

/**
 * Calculate number and percentage of projects exceeding budget
 */
export function calculateProjectsOverBudget(
  projects: ProjectWithEstimates[]
): { count: number; percentage: number } {
  if (projects.length === 0) return { count: 0, percentage: 0 }

  const overBudget = projects.filter((p) => {
    if (!p.budget_cost || !p.estimate_totals?.grand_total) return false
    return p.estimate_totals.grand_total > p.budget_cost
  })

  const percentage = (overBudget.length / projects.length) * 100

  return {
    count: overBudget.length,
    percentage: Math.round(percentage * 10) / 10,
  }
}

/**
 * Calculate estimate approval rate: (Approved / Submitted + Approved) × 100%
 */
export function calculateApprovalRate(projects: ProjectWithEstimates[]): number {
  const submittedOrApproved = projects.filter(
    (p) => p.estimate_status === 'submitted' || p.estimate_status === 'approved'
  ).length

  if (submittedOrApproved === 0) return 0

  const approved = projects.filter((p) => p.estimate_status === 'approved').length

  return Math.round((approved / submittedOrApproved) * 1000) / 10
}

/**
 * Calculate average cost per square meter across projects with floor_area_m2
 */
export function calculateAvgCostPerM2(projects: ProjectWithEstimates[]): number | null {
  const projectsWithArea = projects.filter(
    (p) => p.estimate_totals?.floor_area_m2 && p.estimate_totals.floor_area_m2 > 0 && p.estimate_totals?.grand_total
  )

  if (projectsWithArea.length === 0) return null

  const sum = projectsWithArea.reduce((total, p) => {
    const costPerM2 = p.estimate_totals!.grand_total / p.estimate_totals!.floor_area_m2!
    return total + costPerM2
  }, 0)

  return Math.round((sum / projectsWithArea.length) * 100) / 100
}

/**
 * Calculate status breakdown: percentage of active vs completed
 */
export function calculateStatusBreakdown(
  projects: ProjectWithEstimates[]
): { active: number; completed: number; activePercentage: number; completedPercentage: number } {
  if (projects.length === 0) {
    return { active: 0, completed: 0, activePercentage: 0, completedPercentage: 0 }
  }

  const completed = projects.filter((p) => p.status === 'completed').length
  const active = projects.length - completed

  return {
    active,
    completed,
    activePercentage: Math.round((active / projects.length) * 1000) / 10,
    completedPercentage: Math.round((completed / projects.length) * 1000) / 10,
  }
}

/**
 * Calculate estimate submission rate: (Submitted + Approved / Total) × 100%
 */
export function calculateEstimateSubmissionRate(projects: ProjectWithEstimates[]): number {
  if (projects.length === 0) return 0

  const submitted = projects.filter(
    (p) => p.estimate_status === 'submitted' || p.estimate_status === 'approved'
  ).length

  return Math.round((submitted / projects.length) * 1000) / 10
}

/**
 * Get projects by status for pipeline view
 */
export function getProjectsByStatus(
  projects: ProjectWithEstimates[]
): {
  draft: number
  submitted: number
  approved: number
  rejected: number
  completed: number
} {
  return {
    draft: projects.filter((p) => p.estimate_status === 'draft').length,
    submitted: projects.filter((p) => p.estimate_status === 'submitted').length,
    approved: projects.filter((p) => p.estimate_status === 'approved').length,
    rejected: projects.filter((p) => p.estimate_status === 'rejected').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }
}

/**
 * Calculate budget variance: total budget vs total estimate
 * Returns variance metrics for project view
 */
export interface BudgetVarianceResult {
  totalBudget: number
  totalEstimate: number
  variance: number
  variancePercentage: number
  projectsOverBudget: number
  projectsUnderBudget: number
}

export function calculateBudgetVariance(projects: ProjectWithEstimates[]): BudgetVarianceResult {
  const projectsWithBoth = projects.filter((p) => p.budget_cost && p.estimate_totals?.grand_total)

  const totalBudget = projectsWithBoth.reduce((sum, p) => sum + (p.budget_cost || 0), 0)
  const totalEstimate = projectsWithBoth.reduce((sum, p) => sum + (p.estimate_totals?.grand_total || 0), 0)

  const variance = totalEstimate - totalBudget
  const variancePercentage = totalBudget > 0 ? Math.round((variance / totalBudget) * 1000) / 10 : 0

  const overBudget = projectsWithBoth.filter((p) => (p.estimate_totals?.grand_total || 0) > (p.budget_cost || 0))
    .length
  const underBudget = projectsWithBoth.filter((p) => (p.estimate_totals?.grand_total || 0) < (p.budget_cost || 0))
    .length

  return {
    totalBudget,
    totalEstimate,
    variance,
    variancePercentage,
    projectsOverBudget: overBudget,
    projectsUnderBudget: underBudget,
  }
}

/**
 * Get category cost distribution across all projects
 * Aggregates estimate_totals.categories[] across projects
 */
export interface CategoryCost {
  category_name: string
  total_cost: number
  project_count: number
  percentage: number
  avg_cost_per_project: number
}

export function getCategoryCostDistribution(projects: ProjectWithEstimates[]): CategoryCost[] {
  const categoryMap: Record<string, { total_cost: number; project_count: number }> = {}
  let totalCost = 0

  projects.forEach((project) => {
    const categories = project.estimate_totals?.categories || []

    categories.forEach((cat) => {
      if (!categoryMap[cat.category_name]) {
        categoryMap[cat.category_name] = { total_cost: 0, project_count: 0 }
      }
      categoryMap[cat.category_name].total_cost += cat.subtotal || 0
      categoryMap[cat.category_name].project_count += 1
      totalCost += cat.total || 0
    })
  })

  const result: CategoryCost[] = Object.entries(categoryMap).map(([name, data]) => ({
    category_name: name,
    total_cost: data.total_cost,
    project_count: data.project_count,
    percentage: totalCost > 0 ? Math.round((data.total_cost / totalCost) * 1000) / 10 : 0,
    avg_cost_per_project: Math.round((data.total_cost / data.project_count) * 100) / 100,
  }))

  return result.sort((a, b) => b.total_cost - a.total_cost)
}

/**
 * Get project budget comparison for top projects
 * Shows variance per project, sorted by estimate value
 */
export interface ProjectBudgetComparison {
  project_id: number
  project_name: string
  budget: number
  estimate: number
  variance: number
  variancePercentage: number
  isOverBudget: boolean
}

export function getProjectBudgetComparison(
  projects: ProjectWithEstimates[],
  limit = 5
): ProjectBudgetComparison[] {
  const withBudgets = projects
    .filter((p) => p.budget_cost && p.estimate_totals?.grand_total)
    .map((p) => ({
      project_id: p.id,
      project_name: (p as any).name || `Project ${p.id}`,
      budget: p.budget_cost || 0,
      estimate: p.estimate_totals?.grand_total || 0,
      variance: (p.estimate_totals?.grand_total || 0) - (p.budget_cost || 0),
      variancePercentage:
        (p.budget_cost || 0) > 0
          ? Math.round(
              (((p.estimate_totals?.grand_total || 0) - (p.budget_cost || 0)) / (p.budget_cost || 0)) * 1000
            ) / 10
          : 0,
      isOverBudget: (p.estimate_totals?.grand_total || 0) > (p.budget_cost || 0),
    }))
    .sort((a, b) => b.estimate - a.estimate)
    .slice(0, limit)

  return withBudgets
}

/**
 * Get top cost drivers (categories by total cost)
 * Returns top N categories sorted by total cost
 */
export function calculateTopCostDrivers(
  projects: ProjectWithEstimates[],
  limit = 3
): CategoryCost[] {
  const distribution = getCategoryCostDistribution(projects)
  return distribution.slice(0, limit)
}
