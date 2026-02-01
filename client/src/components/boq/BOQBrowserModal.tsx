import { useState, useMemo, useEffect } from 'react'
import Modal from '../ui/Modal'
import { useNRM2Store } from '../../stores/nrm2Store'
import { useToast } from '../ui/ToastContainer'
import type { NRM2Group, NRM2Element, NRM2SubElement, NRM2WorkSection } from '../../types/nrm2'

interface BOQWorkSection {
  id: number
  code: string
  title: string
  description?: string
  unit?: string
  sub_element_id?: number
}

interface BOQBrowserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectItem: (workSections: BOQWorkSection[]) => void
}

export default function BOQBrowserModal({
  isOpen,
  onClose,
  onSelectItem,
}: BOQBrowserModalProps) {
  const toast = useToast()
  const { groups, isLoading, fetchGroups } = useNRM2Store()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())

  // Fetch groups when modal opens
  useEffect(() => {
    if (isOpen && groups.length === 0) {
      fetchGroups()
    }
  }, [isOpen, groups.length, fetchGroups])

  // Filter work sections based on search query
  const filteredWorkSections = useMemo(() => {
    if (!groups || groups.length === 0 || searchQuery.trim() === '') {
      return []
    }

    const query = searchQuery.toLowerCase()
    const results: BOQWorkSection[] = []

    groups.forEach((group: NRM2Group) => {
      group.elements?.forEach((element: NRM2Element) => {
        element.sub_elements?.forEach((subElement: NRM2SubElement) => {
          subElement.work_sections?.forEach((workSection: NRM2WorkSection) => {
            if (
              workSection.code.toLowerCase().includes(query) ||
              workSection.title.toLowerCase().includes(query) ||
              workSection.description?.toLowerCase().includes(query)
            ) {
              results.push({
                id: workSection.id,
                code: workSection.code,
                title: workSection.title,
                description: workSection.description,
                unit: workSection.unit,
                sub_element_id: subElement.id,
              })
            }
          })
        })
      })
    })

    return results
  }, [groups, searchQuery])

  const handleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItemIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItemIds(newSelected)
  }

  const handleImport = () => {
    if (selectedItemIds.size === 0) {
      toast.error('Please select at least one item to import')
      return
    }

    const selectedItems = filteredWorkSections.filter((item) =>
      selectedItemIds.has(item.id)
    )

    if (selectedItems.length === 0) {
      toast.error('Selected items not found')
      return
    }

    onSelectItem(selectedItems)

    // Clear selection but keep modal open for more imports
    setSelectedItemIds(new Set())
    setSearchQuery('')
    toast.success(
      `Imported ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from BOQ">
      <div className="space-y-4">
        {/* Search Bar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search BOQ Items
          </label>
          <input
            type="text"
            placeholder="Search by code, description, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading BOQ data...</div>
        ) : searchQuery.trim() === '' ? (
          <div className="py-8 text-center text-gray-500">
            <p>Enter a search term to browse BOQ items</p>
            <p className="text-sm mt-2">Try searching for "preliminary", "excavation", or "topsoil"</p>
          </div>
        ) : filteredWorkSections.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No items found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {filteredWorkSections.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={`p-3 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedItemIds.has(item.id) ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">
                      {item.code}
                    </div>
                    <div className="text-sm text-gray-700 mt-0.5">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        {item.description}
                      </div>
                    )}
                    {item.unit && (
                      <div className="text-xs text-gray-500 mt-1">
                        Unit: {item.unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {selectedItemIds.size > 0 && filteredWorkSections.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              Selected: <strong>{selectedItemIds.size}</strong> item{selectedItemIds.size !== 1 ? 's' : ''}
            </p>
            <div className="mt-2 space-y-1 text-xs text-blue-800 max-h-20 overflow-y-auto">
              {filteredWorkSections
                .filter((item) => selectedItemIds.has(item.id))
                .map((item) => (
                  <div key={item.id}>
                    • {item.code} - {item.title}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={selectedItemIds.size === 0 || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            Import Selected Items ({selectedItemIds.size})
          </button>
        </div>
      </div>
    </Modal>
  )
}
