interface BulkOperationsToolbarProps {
  selectedCount: number
  totalCount: number
  isAllSelected: boolean
  isPartiallySelected: boolean
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkDelete: () => void
  onBulkStatusChange: (status: 'draft' | 'in_progress' | 'completed') => void
  isLoading?: boolean
}

export default function BulkOperationsToolbar({
  selectedCount,
  totalCount,
  isAllSelected,
  isPartiallySelected,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusChange,
  isLoading = false,
}: BulkOperationsToolbarProps) {
  return (
    <div className="bg-khc-light border-b-2 border-khc-primary sticky top-16 z-30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isPartiallySelected
                }}
                onChange={isAllSelected ? onDeselectAll : onSelectAll}
                className="w-5 h-5 rounded border-2 border-khc-primary cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>

            <div className="h-6 w-px bg-gray-300" />

            <span className="text-sm font-medium text-gray-900">
              {selectedCount} of {totalCount} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                disabled={selectedCount === 0 || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400 transition-colors"
                title="Change status for selected projects"
              >
                📊 Change Status
              </button>
              <div className="absolute right-0 mt-0 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => onBulkStatusChange('draft')}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  📝 Draft
                </button>
                <button
                  onClick={() => onBulkStatusChange('in_progress')}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  ⏳ In Progress
                </button>
                <button
                  onClick={() => onBulkStatusChange('completed')}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  ✅ Completed
                </button>
              </div>
            </div>

            <button
              onClick={onBulkDelete}
              disabled={selectedCount === 0 || isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400 transition-colors"
              title="Delete selected projects"
            >
              🗑️ Delete ({selectedCount})
            </button>

            <button
              onClick={onDeselectAll}
              disabled={selectedCount === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
