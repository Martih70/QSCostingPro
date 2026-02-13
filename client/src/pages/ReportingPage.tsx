import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useReportingStore } from '../stores/reportingStore'
import { Button, Card, LoadingSpinner, ErrorAlert } from '../components/ui'
import BackButton from '../components/ui/BackButton'
import { exportToCSV, exportToJSON, printReportToPDF, generateHTMLReport } from '../utils/exporters'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function ReportingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const {
    reportData,
    isLoading,
    error,
    fetchReportData,
    clearReportData,
    clearError,
  } = useReportingStore()

  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'html'>('csv')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchReportData(projectId)
    }

    return () => {
      clearReportData()
    }
  }, [projectId, fetchReportData, clearReportData])

  const handleExport = async () => {
    if (!reportData) return

    try {
      setExporting(true)

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `report-${reportData.project_name}-${timestamp}`

      switch (exportFormat) {
        case 'csv':
          exportToCSV(reportData, `${filename}.csv`)
          break
        case 'json':
          exportToJSON(reportData, `${filename}.json`)
          break
        case 'html':
          const html = generateHTMLReport(reportData)
          const blob = new Blob([html], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}.html`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          break
      }

      setExporting(false)
    } catch (err) {
      console.error('Export failed:', err)
      setExporting(false)
    }
  }

  const handlePrint = () => {
    if (reportData) {
      printReportToPDF(reportData)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading report..." />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Report data not available</p>
        <Link to="/projects" className="text-khc-primary hover:underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">{reportData.project_name}</h1>
        <p className="text-gray-600 mt-2">Project Report</p>
        <p className="text-xs text-gray-500 mt-1">Project ID: {projectId}</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* Export Section */}
      <Card title="Export Report">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value as 'csv')}
              />
              <span>Export as CSV</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value as 'json')}
              />
              <span>Export as JSON</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="html"
                checked={exportFormat === 'html'}
                onChange={(e) => setExportFormat(e.target.value as 'html')}
              />
              <span>Export as HTML</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" onClick={handleExport} loading={exporting}>
              📥 Download Report
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              🖨️ Print to PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Cost Summary */}
      <Card title="Cost Summary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">
                {formatCurrency(reportData.estimated_costs.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Contingency:</span>
              <span className="font-semibold">
                {formatCurrency(reportData.estimated_costs.contingency)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-bold text-khc-primary">Estimated Total:</span>
              <span className="font-bold text-khc-primary text-lg">
                {formatCurrency(reportData.estimated_costs.grand_total)}
              </span>
            </div>
            {reportData.estimated_costs.cost_per_m2 && (
              <div className="text-sm text-gray-600 pt-2">
                Cost per m²: {formatCurrency(reportData.estimated_costs.cost_per_m2)}
              </div>
            )}
          </div>

          {reportData.actual_costs && (
            <div className="space-y-3 border-l pl-6">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">
                  {formatCurrency(reportData.actual_costs.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Contingency:</span>
                <span className="font-semibold">
                  {formatCurrency(reportData.actual_costs.contingency)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-khc-primary">Actual Total:</span>
                <span className="font-bold text-khc-primary text-lg">
                  {formatCurrency(reportData.actual_costs.grand_total)}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Variance:</span>
                  <span
                    className={`font-bold text-lg ${
                      reportData.actual_costs.grand_total > reportData.estimated_costs.grand_total
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(
                      reportData.actual_costs.grand_total - reportData.estimated_costs.grand_total
                    )}
                  </span>
                </div>
              </div>
              {reportData.actual_costs.cost_per_m2 && (
                <div className="text-sm text-gray-600 pt-2">
                  Cost per m²: {formatCurrency(reportData.actual_costs.cost_per_m2)}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Project ID</p>
          <p className="text-lg font-semibold text-khc-primary mt-1">{reportData.project_id}</p>
        </Card>
        {reportData.completion_date && (
          <Card>
            <p className="text-sm text-gray-600">Completion Date</p>
            <p className="text-lg font-semibold text-khc-primary mt-1">
              {formatDate(reportData.completion_date)}
            </p>
          </Card>
        )}
      </div>

      {/* Line Items */}
      <Card title="Line Items Breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Estimated</th>
                {reportData.actual_costs && (
                  <>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Actual</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Variance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {reportData.line_items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(item.estimated)}
                  </td>
                  {reportData.actual_costs && (
                    <>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.actual ? formatCurrency(item.actual) : '-'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          item.variance && item.variance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {item.variance ? formatCurrency(item.variance) : '-'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notes */}
      {reportData.notes && (
        <Card title="Notes">
          <p className="text-gray-700 whitespace-pre-wrap">{reportData.notes}</p>
        </Card>
      )}
    </div>
  )
}
