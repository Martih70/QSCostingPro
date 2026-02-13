import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReportingStore } from '../stores/reportingStore'
import { useProjectsStore } from '../stores/projectsStore'
import { Card, Button, LoadingSpinner, ErrorAlert } from '../components/ui'
import BackButton from '../components/ui/BackButton'
import { formatCurrency } from '../utils/formatters'

type GroupByOption = 'none' | 'pdCode' | 'areaCode' | 'projectNumber' | 'itemDescription'

interface CostBreakdown {
  [key: string]: number
}

interface ExportData {
  projectName: string
  projectId: number
  contingencyPercentage: number
  estimatedCosts: {
    subtotal: number
    contingency: number
    grand_total: number
    cost_per_m2?: number
  }
  actualCosts?: {
    subtotal: number
    contingency: number
    grand_total: number
    cost_per_m2?: number
  }
  lineItems: Array<{
    description: string
    category: string
    estimated: number
    actual?: number
    variance?: number
  }>
  breakdown: CostBreakdown
  exportedAt: string
}

export default function ProjectCostTotalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const { reportData, isLoading, error, fetchReportData, clearError } = useReportingStore()
  const { currentProject, fetchProjectById } = useProjectsStore()

  const [groupBy, setGroupBy] = useState<GroupByOption>('none')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [breakdown, setBreakdown] = useState<CostBreakdown>({})

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId)
      fetchReportData(projectId)
    }
  }, [projectId, fetchProjectById, fetchReportData])

  useEffect(() => {
    if (reportData && reportData.line_items) {
      const breakdownMap: CostBreakdown = {}

      if (groupBy === 'none') {
        // No grouping, just show totals
        setBreakdown({})
      } else {
        // Group by selected field
        reportData.line_items.forEach((item) => {
          // Extract grouping key from item based on groupBy
          let key = ''
          if (groupBy === 'pdCode') {
            key = item.category || 'Uncategorized'
          } else if (groupBy === 'areaCode') {
            key = 'Area: ' + item.category || 'Uncategorized'
          } else if (groupBy === 'projectNumber') {
            key = String(projectId) || 'Unknown'
          } else if (groupBy === 'itemDescription') {
            key = item.description || 'Uncategorized'
          }

          if (key) {
            breakdownMap[key] = (breakdownMap[key] || 0) + (item.estimated || 0)
          }
        })
        setBreakdown(breakdownMap)
      }
    }
  }, [reportData, groupBy, projectId])

  const handleExport = () => {
    if (!reportData) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `project-cost-total-${currentProject?.name || 'project'}-${timestamp}`

    const costData: ExportData = {
      projectName: reportData.project_name,
      projectId: reportData.project_id,
      contingencyPercentage: 10,
      estimatedCosts: reportData.estimated_costs,
      actualCosts: reportData.actual_costs,
      lineItems: reportData.line_items,
      breakdown,
      exportedAt: new Date().toISOString(),
    }

    if (exportFormat === 'csv') {
      exportToCSV(costData, `${filename}.csv`)
    } else {
      exportToJSON(costData, `${filename}.json`)
    }
  }

  const exportToCSV = (data: ExportData, filename: string) => {
    const rows: string[][] = []
    rows.push(['PROJECT COST TOTAL REPORT'])
    rows.push([])
    rows.push(['Project Name', data.projectName])
    rows.push(['Project ID', String(data.projectId)])
    rows.push(['Contingency %', String(data.contingencyPercentage) + '%'])
    rows.push([])
    rows.push(['COST SUMMARY'])
    rows.push(['Estimated Subtotal', String(data.estimatedCosts?.subtotal)])
    rows.push(['Contingency Amount', String(data.estimatedCosts?.contingency)])
    rows.push(['Estimated Total', String(data.estimatedCosts?.grand_total)])
    if (data.estimatedCosts?.cost_per_m2) {
      rows.push(['Cost per m²', String(data.estimatedCosts.cost_per_m2)])
    }
    if (data.actualCosts) {
      rows.push([])
      rows.push(['Actual Subtotal', String(data.actualCosts.subtotal)])
      rows.push(['Actual Contingency', String(data.actualCosts.contingency)])
      rows.push(['Actual Total', String(data.actualCosts.grand_total)])
      if (data.actualCosts.cost_per_m2) {
        rows.push(['Actual Cost per m²', String(data.actualCosts.cost_per_m2)])
      }
    }

    rows.push([])
    rows.push(['LINE ITEMS'])
    rows.push(['Description', 'Category', 'Estimated', 'Actual', 'Variance'])
    data.lineItems?.forEach((item: { description?: string; category?: string; estimated?: number; actual?: number; variance?: number }) => {
      rows.push([
        item.description || '',
        item.category || '',
        String(item.estimated || 0),
        String(item.actual || ''),
        String(item.variance || ''),
      ])
    })

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    downloadFile(csv, filename, 'text/csv')
  }

  const exportToJSON = (data: ExportData, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, filename, 'application/json')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading project costs..." />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Cost data not available</p>
        <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}`)}>
          Back to Project
        </Button>
      </div>
    )
  }

  const estimatedTotal = reportData.estimated_costs?.grand_total || 0
  const actualTotal = reportData.actual_costs?.grand_total
  const contingencyPercent = 10
  const costPerM2 = reportData.estimated_costs?.cost_per_m2

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">Project Cost Total</h1>
        <p className="text-gray-600 mt-2">{reportData.project_name}</p>
        <p className="text-xs text-gray-500 mt-1">Project ID: {projectId}</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Contingency %</p>
          <p className="text-4xl font-bold text-khc-primary mt-2">{contingencyPercent}%</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Project Total</p>
          <p className="text-3xl font-bold text-khc-primary mt-2">{formatCurrency(estimatedTotal)}</p>
          {actualTotal && <p className="text-sm text-gray-600 mt-1">Actual: {formatCurrency(actualTotal)}</p>}
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Cost per m²</p>
          <p className="text-3xl font-bold text-khc-primary mt-2">{costPerM2 ? formatCurrency(costPerM2) : 'N/A'}</p>
        </Card>
      </div>

      {/* Cost Breakdown Card */}
      <Card title="Cost Breakdown">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-khc-primary focus:border-transparent"
              >
                <option value="none">No Grouping (Total Only)</option>
                <option value="pdCode">PD Code / Category</option>
                <option value="areaCode">Area Code</option>
                <option value="projectNumber">Project Number</option>
                <option value="itemDescription">Item Description</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-khc-primary focus:border-transparent"
              >
                <option value="csv">CSV (Excel)</option>
                <option value="json">JSON (Data)</option>
              </select>
            </div>
          </div>

          <Button variant="primary" onClick={handleExport} fullWidth>
            📥 Export Cost Total
          </Button>
        </div>
      </Card>

      {/* Breakdown Table */}
      {groupBy !== 'none' && Object.keys(breakdown).length > 0 && (
        <Card title="Cost Breakdown by Category">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percent = ((amount / estimatedTotal) * 100).toFixed(1)
                    return (
                      <tr key={category} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{category}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-khc-primary">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{percent}%</td>
                      </tr>
                    )
                  })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-khc-primary text-lg">
                    {formatCurrency(estimatedTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-600">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Cost Summary */}
      <Card title="Summary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(reportData.estimated_costs.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Contingency ({contingencyPercent}%):</span>
              <span className="font-semibold">{formatCurrency(reportData.estimated_costs.contingency)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-bold text-khc-primary">Estimated Total:</span>
              <span className="font-bold text-khc-primary text-lg">{formatCurrency(estimatedTotal)}</span>
            </div>
            {reportData.estimated_costs.cost_per_m2 && (
              <div className="text-sm text-gray-600 pt-2">
                Cost per m²: {formatCurrency(reportData.estimated_costs.cost_per_m2)}
              </div>
            )}
          </div>

          {actualTotal && reportData.actual_costs && (
            <div className="space-y-3 border-l pl-6">
              <div className="flex justify-between">
                <span className="text-gray-700">Actual Subtotal:</span>
                <span className="font-semibold">{formatCurrency(reportData.actual_costs.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Actual Contingency:</span>
                <span className="font-semibold">{formatCurrency(reportData.actual_costs.contingency)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-khc-primary">Actual Total:</span>
                <span className="font-bold text-khc-primary text-lg">{formatCurrency(actualTotal)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Variance:</span>
                  <span
                    className={`font-bold text-lg ${
                      actualTotal > estimatedTotal ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(actualTotal - estimatedTotal)}
                  </span>
                </div>
              </div>
              {reportData.actual_costs.cost_per_m2 && (
                <div className="text-sm text-gray-600 pt-2">
                  Actual cost per m²: {formatCurrency(reportData.actual_costs.cost_per_m2)}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
