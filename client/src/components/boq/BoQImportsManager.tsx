import { useEffect, useState } from 'react'
import { useToast } from '../ui/ToastContainer'
import { useBoQImport } from '../../hooks/useBoQImport'
import BoQImportModal from './BoQImportModal'
import LoadingSpinner from '../ui/LoadingSpinner'

interface BoQImport {
  id: number
  projectId: number
  fileName: string
  importedAt: string
  totalItems: number
  totalAmount: number
}

interface BoQImportsManagerProps {
  projectId: number
  onImportSuccess?: () => void
}

export default function BoQImportsManager({ projectId, onImportSuccess }: BoQImportsManagerProps) {
  const toast = useToast()
  const { isLoading, getImports, deleteImport, exportPDF } = useBoQImport(projectId)

  const [imports, setImports] = useState<BoQImport[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState<number | null>(null)

  const loadImports = async () => {
    try {
      const result = await getImports()
      if (result) {
        setImports(result)
      }
    } catch (err) {
      toast.error('Failed to load imports')
    }
  }

  useEffect(() => {
    loadImports()
  }, [projectId])

  const handleDelete = async (importId: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this BoQ import? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      setIsDeleting(importId)
      await deleteImport(importId)
      setImports((prev) => prev.filter((imp) => imp.id !== importId))
      toast.success('BoQ import deleted successfully')
    } catch (err) {
      toast.error('Failed to delete BoQ import')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleExport = async (importId: number) => {
    try {
      setIsExporting(importId)
      await exportPDF()
      toast.success('PDF exported successfully')
    } catch (err) {
      toast.error('Failed to export PDF')
    } finally {
      setIsExporting(null)
    }
  }

  const handleImportSuccess = () => {
    loadImports()
    onImportSuccess?.()
  }

  if (isLoading && imports.length === 0) {
    return <LoadingSpinner text="Loading imports..." />
  }

  return (
    <div className="space-y-4">
      {/* Header with Import Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">BoQ Imports</h3>
        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <span>+</span>
          Import New BoQ
        </button>
      </div>

      {/* Import Modal */}
      <BoQImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        projectId={projectId}
        onImportSuccess={handleImportSuccess}
      />

      {/* Imports List */}
      {imports.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600 font-medium">No BoQ imports yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click "Import New BoQ" to upload your first Bill of Quantities
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {imports.map((imp) => (
            <div
              key={imp.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-khc-primary transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📁</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{imp.fileName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Imported on {new Date(imp.importedAt).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-right">
                  <div>
                    <div className="text-sm text-gray-600">Items</div>
                    <div className="font-semibold text-gray-900">{imp.totalItems}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Amount</div>
                    <div className="font-semibold text-khc-primary">
                      £{imp.totalAmount.toLocaleString('en-GB', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(imp.id)}
                    disabled={isExporting === imp.id}
                    className="px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                    title="Export as PDF"
                  >
                    {isExporting === imp.id ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      </>
                    ) : (
                      <>
                        <span>⬇</span>
                        PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(imp.id)}
                    disabled={isDeleting === imp.id}
                    className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                    title="Delete import"
                  >
                    {isDeleting === imp.id ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                      </>
                    ) : (
                      <>
                        <span>🗑</span>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
