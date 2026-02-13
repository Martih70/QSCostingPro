import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { boqLibraryAPI } from '../../services/api'

interface BoQLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectItems: (items: Array<{
    item_number: string
    description: string
    unit: string
    quantity: number
    standard_rate: number
  }>) => void
  projectId: number
}

export default function BoQLibraryModal({
  isOpen,
  onClose,
  onSelectItems,
  projectId,
}: BoQLibraryModalProps) {
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [selectionMode, setSelectionMode] = useState<'items' | 'section'>('items')

  // Fetch sections
  const { data: sectionsData } = useQuery({
    queryKey: ['boq-library-sections'],
    queryFn: () => boqLibraryAPI.getSections(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  })

  // Fetch selected section details
  const { data: sectionData } = useQuery({
    queryKey: ['boq-library-section', selectedSection],
    queryFn: () =>
      selectedSection ? boqLibraryAPI.getSection(selectedSection) : Promise.resolve(null),
    enabled: selectedSection !== null && isOpen,
    staleTime: 5 * 60 * 1000,
  })

  const sections = sectionsData?.data?.data || []
  const currentSection = sectionData?.data?.data || null

  const handleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAllInPage = (pageItems: any[]) => {
    const newSelected = new Set(selectedItems)
    const allSelected = pageItems.every(item => newSelected.has(item.id))

    if (allSelected) {
      pageItems.forEach(item => newSelected.delete(item.id))
    } else {
      pageItems.forEach(item => newSelected.add(item.id))
    }
    setSelectedItems(newSelected)
  }

  const handleAddToEstimate = () => {
    if (selectionMode === 'section' && selectedSection && currentSection) {
      // Add all items from the section
      const allItems = currentSection.pages.flatMap((page: any) =>
        page.items.map((item: any) => ({
          item_number: item.item_number,
          description: item.description,
          unit: item.custom_unit || item.unit,
          quantity: item.quantity || 0,
          standard_rate: item.custom_unit_rate || item.standard_rate,
        }))
      )
      onSelectItems(allItems)
    } else if (selectionMode === 'items' && selectedItems.size > 0 && currentSection) {
      // Add selected items
      const items: any[] = []
      for (const page of currentSection.pages) {
        for (const item of page.items) {
          if (selectedItems.has(item.id)) {
            items.push({
              item_number: item.item_number,
              description: item.description,
              unit: item.custom_unit || item.unit,
              quantity: item.quantity || 0,
              standard_rate: item.custom_unit_rate || item.standard_rate,
            })
          }
        }
      }
      onSelectItems(items)
    }

    // Reset and close
    setSelectedItems(new Set())
    setSelectedSection(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-khc-primary text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">📚 Add from BoQ Library</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sections List */}
          <div className="w-64 border-r border-gray-200 overflow-y-auto p-4 space-y-2">
            <h3 className="font-bold text-gray-900 mb-4">Sections ({sections.length})</h3>
            {sections.map((section: any) => (
              <button
                key={section.id}
                onClick={() => {
                  setSelectedSection(section.id)
                  setSelectedItems(new Set())
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${
                  selectedSection === section.id
                    ? 'bg-khc-primary/10 border-khc-primary'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{section.section_title}</div>
                <div className="text-xs text-gray-500 mt-1">{section.item_count} items</div>
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedSection === null ? (
              <div className="text-center text-gray-500 py-8">Select a section to view items</div>
            ) : currentSection ? (
              <div className="space-y-4">
                {/* Selection Mode */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="items"
                      checked={selectionMode === 'items'}
                      onChange={e => setSelectionMode(e.target.value as 'items')}
                    />
                    <span>Select Items</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="section"
                      checked={selectionMode === 'section'}
                      onChange={e => setSelectionMode(e.target.value as 'section')}
                    />
                    <span>Entire Section</span>
                  </label>
                </div>

                {/* Items Table */}
                {currentSection.pages && currentSection.pages.length > 0 ? (
                  <div className="space-y-2">
                    {currentSection.pages.map((page: any) => (
                      <div key={page.page_number}>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          Page {page.page_number} of {page.total_pages}
                        </div>
                        <table className="w-full text-xs border border-gray-200 rounded">
                          <thead>
                            <tr className="bg-gray-50">
                              {selectionMode === 'items' && <th className="px-2 py-1 w-8"></th>}
                              <th className="px-2 py-1 text-left">Item No.</th>
                              <th className="px-2 py-1 text-left">Description</th>
                              <th className="px-2 py-1 text-left">Unit</th>
                              <th className="px-2 py-1 text-right">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {page.items.map((item: any) => (
                              <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                                {selectionMode === 'items' && (
                                  <td className="px-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedItems.has(item.id)}
                                      onChange={() => handleSelectItem(item.id)}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                )}
                                <td className="px-2 py-1 font-medium">{item.item_number}</td>
                                <td className="px-2 py-1">{item.description}</td>
                                <td className="px-2 py-1">{item.custom_unit || item.unit}</td>
                                <td className="px-2 py-1 text-right">
                                  £{(item.custom_unit_rate || item.standard_rate).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No items in this section</div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">Loading section details...</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectionMode === 'items'
              ? selectedItems.size > 0
                ? `${selectedItems.size} item(s) selected`
                : 'Select items to add'
              : selectedSection
                ? 'Entire section selected'
                : 'Select a section'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToEstimate}
              disabled={
                selectionMode === 'items' ? selectedItems.size === 0 : selectedSection === null
              }
              className="px-4 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Estimate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
