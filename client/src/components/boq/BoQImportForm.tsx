import { useState, useRef } from 'react'
import { useToast } from '../ui/ToastContainer'
import { useBoQImport } from '../../hooks/useBoQImport'
import BoQPreviewTable from './BoQPreviewTable'
import LoadingSpinner from '../ui/LoadingSpinner'
import type { BoQItem, BoQSection } from '../../types/boq'

interface BoQImportFormProps {
  projectId: number
  onImportSuccess?: () => void
}

type FormStep = 'upload' | 'preview' | 'confirm'

export default function BoQImportForm({ projectId, onImportSuccess }: BoQImportFormProps) {
  const toast = useToast()
  const { isLoading, error, previewImport, importBoQ, clearError } = useBoQImport(projectId)

  const [step, setStep] = useState<FormStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [items, setItems] = useState<BoQItem[]>([])
  const [sections, setSections] = useState<BoQSection[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF, Excel, or CSV file.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum file size is 10MB.')
      return
    }

    setSelectedFile(file)
    clearError()
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handlePreview = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    try {
      const result = await previewImport(selectedFile)
      if (result) {
        setItems(result.items)
        setSections(result.sections)
        setTotalAmount(result.totalAmount)
        setStep('preview')
        toast.success('BoQ file parsed successfully')
      }
    } catch (err) {
      toast.error(error || 'Failed to preview BoQ file')
    }
  }

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      toast.error('No file selected')
      return
    }

    try {
      setIsConfirming(true)
      const result = await importBoQ(selectedFile)
      if (result) {
        toast.success('BoQ imported successfully')
        setStep('upload')
        setSelectedFile(null)
        setItems([])
        setSections([])
        setTotalAmount(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onImportSuccess?.()
      }
    } catch (err) {
      toast.error(error || 'Failed to import BoQ')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    setStep('upload')
    setSelectedFile(null)
    setItems([])
    setSections([])
    setTotalAmount(0)
    clearError()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'upload' || step === 'preview' || step === 'confirm'
              ? 'bg-khc-primary text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          1
        </div>
        <div className="flex-1 h-1 bg-gray-200"></div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'preview' || step === 'confirm'
              ? 'bg-khc-primary text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          2
        </div>
        <div className="flex-1 h-1 bg-gray-200"></div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 'confirm' ? 'bg-khc-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          3
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Upload BoQ File</h3>
            <p className="text-sm text-gray-600">
              Upload a Bill of Quantities file in PDF, Excel, or CSV format
            </p>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-khc-primary bg-khc-light'
                : 'border-gray-300 bg-gray-50 hover:border-khc-primary'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="hidden"
              id="boq-file-input"
            />
            <label htmlFor="boq-file-input" className="cursor-pointer block">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-900 font-medium">
                Drag and drop your BoQ file here
              </p>
              <p className="text-sm text-gray-600 mt-1">
                or click to select (PDF, Excel, or CSV - max 10MB)
              </p>
            </label>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  clearError()
                }}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Remove
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setSelectedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              disabled={!selectedFile}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handlePreview}
              disabled={!selectedFile || isLoading}
              className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <span>▶</span>
                  Preview Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Review Import Preview</h3>
            <p className="text-sm text-gray-600">
              Review the items that will be imported from your BoQ file
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Loading preview..." />
          ) : (
            <BoQPreviewTable items={items} sections={sections} totalAmount={totalAmount} />
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Select Different File
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span>✓</span>
              Confirm Import
            </button>
          </div>
        </div>
      )}

      {/* Confirm Step */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Import</h3>
            <p className="text-sm text-gray-600">
              Ready to import these items into your project?
            </p>
          </div>

          {/* Summary */}
          <div className="bg-khc-light rounded-lg p-6 border-2 border-khc-primary space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 font-medium">Total Items</div>
                <div className="text-2xl font-bold text-khc-primary mt-1">{items.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Total Sections</div>
                <div className="text-2xl font-bold text-khc-primary mt-1">
                  {sections.length > 0 ? sections.length : 1}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Total Amount</div>
                <div className="text-2xl font-bold text-khc-primary mt-1">
                  £{totalAmount.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Note:</span> These items will be added to your project estimate.
              You can edit quantities and rates after import.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <button
              onClick={() => setStep('preview')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel Import
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isConfirming}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isConfirming ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Importing...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Import Now
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
