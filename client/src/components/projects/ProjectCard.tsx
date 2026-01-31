import { Link } from 'react-router-dom'
import { useState } from 'react'
import DuplicateProjectDialog, { DuplicateOptions } from './DuplicateProjectDialog'

interface ProjectCardProps {
  id: number
  name: string
  status: 'draft' | 'in_progress' | 'completed'
  estimateStatus: 'draft' | 'submitted' | 'approved' | 'rejected'
  description?: string
  budgetCost?: number
  createdBy?: number
  currentUserId?: number
  isAdmin?: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onDuplicate?: (options: DuplicateOptions) => Promise<void>
  isSelected?: boolean
  onToggleSelect?: (id: number) => void
}

export default function ProjectCard({
  id,
  name,
  status,
  estimateStatus,
  description,
  budgetCost,
  createdBy,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  onDuplicate,
  isSelected = false,
  onToggleSelect,
}: ProjectCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const canEdit = isAdmin || createdBy === currentUserId

  const handleDuplicate = async (options: DuplicateOptions) => {
    if (!onDuplicate) return
    setIsDuplicating(true)
    try {
      await onDuplicate(options)
      setShowDuplicateDialog(false)
    } catch (error) {
      // Error is handled by parent
    } finally {
      setIsDuplicating(false)
    }
  }

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }

  const estimateStatusColors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 ${
        isSelected ? 'ring-2 ring-khc-primary' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-6 space-y-4">
        {/* Checkbox for bulk selection */}
        {onToggleSelect && (
          <div className="flex items-start justify-between mb-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(id)}
              className="w-5 h-5 rounded border-2 border-khc-primary cursor-pointer mt-0.5"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {/* Header with Title and Status Badges */}
        <div>
          <Link
            to={`/projects/${id}`}
            className="block"
          >
            <h3 className="text-lg font-bold text-khc-primary hover:text-khc-secondary transition-colors mb-2">
              {name}
            </h3>
          </Link>
          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                statusColors[status]
              }`}
            >
              {status}
            </span>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                estimateStatusColors[estimateStatus]
              }`}
            >
              {estimateStatus}
            </span>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        )}

        {/* Budget Info */}
        {budgetCost && (
          <div className="text-sm text-gray-700">
            <span className="font-medium">Budget:</span>{' '}
            <span>£{budgetCost.toLocaleString('en-GB')}</span>
          </div>
        )}

        {/* Quick Actions - Hover State */}
        {showActions && canEdit && (
          <div className="pt-2 flex gap-2 border-t border-gray-200">
            <Link
              to={`/projects/${id}`}
              className="flex-1 px-3 py-2 text-center bg-khc-light text-khc-primary hover:bg-khc-primary hover:text-white rounded text-sm transition-colors"
            >
              View
            </Link>
            <button
              onClick={() => onEdit(id)}
              className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded text-sm transition-colors"
            >
              Edit
            </button>
            {onDuplicate && (
              <button
                onClick={() => setShowDuplicateDialog(true)}
                className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded text-sm transition-colors"
              >
                Duplicate
              </button>
            )}
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Delete project "${name}"? This cannot be undone.`
                  )
                ) {
                  onDelete(id)
                }
              }}
              className="flex-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        )}

        {/* Static View Button for non-editors */}
        {!showActions && !canEdit && (
          <Link
            to={`/projects/${id}`}
            className="block px-3 py-2 text-center bg-khc-light text-khc-primary hover:bg-khc-primary hover:text-white rounded text-sm transition-colors"
          >
            View Details
          </Link>
        )}
      </div>

      {/* Duplicate Dialog */}
      {onDuplicate && (
        <DuplicateProjectDialog
          isOpen={showDuplicateDialog}
          onClose={() => setShowDuplicateDialog(false)}
          onDuplicate={handleDuplicate}
          projectName={name}
          isLoading={isDuplicating}
        />
      )}
    </div>
  )
}
