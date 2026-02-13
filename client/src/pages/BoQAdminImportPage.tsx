import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BackButton from '../components/ui/BackButton'
import { boqRepositoryAPI } from '../services/api'

export default function BoQAdminImportPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importName, setImportName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Fetch library summary
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['boq-library-summary'],
    queryFn: () => boqRepositoryAPI.getSummary(),
    staleTime: Infinity,
  })

  // Fetch imports history
  const { data: importsData, refetch: refetchImports } = useQuery({
    queryKey: ['boq-library-imports'],
    queryFn: () => boqRepositoryAPI.getImports(),
    staleTime: 5 * 60 * 1000,
  })

  // Extract actual data from nested response structure
  // summaryData = React Query result { data: axios response }
  // axios response = { data: API body { success, data: {...} } }
  const summary = summaryData?.data?.data
  const imports = importsData?.data?.data || []

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a CSV file')
      return
    }

    if (!importName.trim()) {
      setUploadError('Please enter an import name')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('importName', importName)

      await boqRepositoryAPI.importCSV(formData)

      setUploadSuccess(`BoQ imported successfully: ${file.name}`)
      setFile(null)
      setImportName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Force clear and refetch all data
      console.log('🔄 Starting cache invalidation and refetch...')

      // FIRST: Remove all BoQ-related queries from cache
      queryClient.removeQueries({ queryKey: ['boq-library-summary'] })
      queryClient.removeQueries({ queryKey: ['boq-library-imports'] })
      queryClient.removeQueries({ queryKey: ['boq-library-sections'] })

      console.log('✅ Cache cleared, now refetching...')

      // THEN: Refetch with fresh data
      try {
        const [summaryResult, importsResult] = await Promise.all([
          refetchSummary(),
          refetchImports(),
        ])

        console.log('📊 Summary result:', summaryResult)
        console.log('📊 Summary DATA:', summaryResult?.data)
        console.log('📋 Imports result:', importsResult)
        console.log('📋 Imports DATA:', importsResult?.data)

        await queryClient.refetchQueries({ queryKey: ['boq-library-sections'] })
      } catch (refetchErr: any) {
        console.error('❌ Refetch error:', refetchErr)
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Failed to import BoQ')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">BoQ Library Setup</h1>
        <p className="text-gray-600 mt-2">One-time import of Bill of Quantities into the central library</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Statistics */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600">Total Sections</div>
            <div className="text-3xl font-bold text-khc-primary mt-2">{summary?.total_sections || 0}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="text-3xl font-bold text-khc-primary mt-2">{summary?.total_items || 0}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm text-gray-600">Imports</div>
            <div className="text-3xl font-bold text-khc-primary mt-2">{imports.length}</div>
          </div>
        </div>

        {/* Import Form */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Import CSV</h2>

            {uploadError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {uploadSuccess}
              </div>
            )}

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-khc-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">Click to select CSV file</p>
                    <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                  </div>
                )}
              </div>
            </div>

            {/* Import Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import Name <span className="text-red-600">*</span> (Required)
              </label>
              <input
                type="text"
                value={importName}
                onChange={e => setImportName(e.target.value)}
                placeholder="e.g., 9-Section Complete BoQ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">Used to identify this import</p>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || !importName.trim() || isUploading}
              className="w-full px-4 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUploading ? 'Uploading...' : 'Import to Library'}
            </button>

            <p className="text-xs text-gray-500 border-t border-gray-200 pt-4">
              CSV Format: Item No. | Description | Unit | Quantity | Rate (£) | Amount (£) | Notes (optional)
            </p>
          </div>

          {/* Import History */}
          {imports.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Import History</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {imports.map((imp: any) => (
                  <div key={imp.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{imp.import_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {imp.total_sections} sections · {imp.total_items} items
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(imp.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
