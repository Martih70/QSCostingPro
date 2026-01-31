import { useState } from 'react'
import Modal from '../ui/Modal'

interface DuplicateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onDuplicate: (options: DuplicateOptions) => Promise<void>
  projectName: string
  isLoading?: boolean
}

export interface DuplicateOptions {
  name: string
  includeEstimates: boolean
  copyStatus: boolean
}

export default function DuplicateProjectDialog({
  isOpen,
  onClose,
  onDuplicate,
  projectName,
  isLoading = false,
}: DuplicateProjectDialogProps) {
  const [name, setName] = useState(`${projectName} - Copy`)
  const [includeEstimates, setIncludeEstimates] = useState(false)
  const [copyStatus, setCopyStatus] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }
    if (name.length > 255) {
      newErrors.name = 'Project name must be less than 255 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onDuplicate({
        name: name.trim(),
        includeEstimates,
        copyStatus,
      })
      setName(`${projectName} - Copy`)
      setIncludeEstimates(false)
      setCopyStatus(false)
      setErrors({})
      onClose()
    } catch (error) {
      // Error is handled by parent
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duplicate Project" size="md">
      <div className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Project Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) {
                setErrors({ ...errors, name: '' })
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            placeholder="e.g., Project Name - Copy"
            maxLength={255}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Options */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Copy Options</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEstimates}
              onChange={(e) => setIncludeEstimates(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Include Estimates</p>
              <p className="text-xs text-gray-600">Copy all line items and estimates from the original project</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={copyStatus}
              onChange={(e) => setCopyStatus(e.target.checked)}
              disabled={!includeEstimates}
              className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer disabled:opacity-50"
            />
            <div>
              <p className={`text-sm font-medium ${copyStatus ? 'text-gray-900' : 'text-gray-600'}`}>
                Copy Status (if estimates included)
              </p>
              <p className="text-xs text-gray-600">Copy estimate status (approved, rejected, etc.)</p>
            </div>
          </label>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ℹ️ The new project will be created as a draft. You can edit it after creation.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg disabled:bg-gray-400"
          >
            {isLoading ? 'Duplicating...' : 'Duplicate Project'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
