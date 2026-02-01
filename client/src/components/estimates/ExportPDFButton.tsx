import { useState } from 'react'
import axios from 'axios'

interface ExportPDFButtonProps {
  projectId: number
  projectName: string
  isDisabled?: boolean
}

export default function ExportPDFButton({ projectId, projectName, isDisabled = false }: ExportPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'category' | 'nrm2'>('nrm2')
  const [showOptions, setShowOptions] = useState(false)

  const handleExportPDF = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.get(
        `http://localhost:3000/api/v1/projects/${projectId}/estimates/export-pdf?groupBy=${groupBy}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      )

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Format filename
      const date = new Date().toISOString().split('T')[0]
      const filename = `BOQ_${projectName.replace(/[^a-z0-9]/gi, '_')}_${date}.pdf`
      link.setAttribute('download', filename)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('PDF export failed:', err)
      setError(err.response?.data?.error || 'Failed to export PDF. Please ensure there are line items to export.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center relative">
        <button
          onClick={handleExportPDF}
          disabled={isDisabled || isLoading}
          className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg disabled:bg-gray-400 flex items-center gap-2 justify-center"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Generating...
            </>
          ) : (
            <>
              📄 Export PDF
            </>
          )}
        </button>
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isDisabled || isLoading}
          className="px-2 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg disabled:bg-gray-200 text-xs"
          title="PDF export options"
        >
          ⚙️
        </button>

        {showOptions && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-max">
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Group By:</p>
              <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="radio"
                  name="groupBy"
                  value="nrm2"
                  checked={groupBy === 'nrm2'}
                  onChange={(e) => setGroupBy(e.target.value as 'nrm2')}
                  className="cursor-pointer"
                />
                <span>NRM 2 Structure (recommended)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="radio"
                  name="groupBy"
                  value="category"
                  checked={groupBy === 'category'}
                  onChange={(e) => setGroupBy(e.target.value as 'category')}
                  className="cursor-pointer"
                />
                <span>By Category</span>
              </label>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  )
}
