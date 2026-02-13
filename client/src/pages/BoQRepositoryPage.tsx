import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/ui/BackButton'
import { boqLibraryAPI } from '../services/api'

export default function BoQRepositoryPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [copierProjectId, setCopierProjectId] = useState<number | null>(null)
  const [copierType, setCopierType] = useState<'items' | 'section'>('items')

  // Fetch sections
  const { data: sectionsData, isLoading: loadingSections } = useQuery({
    queryKey: ['boq-library-sections'],
    queryFn: () => boqLibraryAPI.getSections(),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch selected section details
  const { data: sectionData, isLoading: loadingSection } = useQuery({
    queryKey: ['boq-library-section', selectedSection],
    queryFn: () =>
      selectedSection ? boqLibraryAPI.getSection(selectedSection) : Promise.resolve(null),
    enabled: selectedSection !== null,
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

  const handleCopyToProject = async () => {
    if (!copierProjectId) return

    try {
      if (copierType === 'items' && selectedItems.size > 0) {
        await boqLibraryAPI.copyItems(copierProjectId, Array.from(selectedItems))
      } else if (copierType === 'section' && selectedSection) {
        await boqLibraryAPI.copySection(copierProjectId, selectedSection)
      }

      // Invalidate project estimates cache
      queryClient.invalidateQueries({ queryKey: ['project-estimates', copierProjectId] })

      // Reset and navigate
      setSelectedItems(new Set())
      setCopierProjectId(null)
      navigate(`/projects/${copierProjectId}/estimates`)
    } catch (err) {
      console.error('Failed to copy items:', err)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">BoQ Library</h1>
        <p className="text-gray-600 mt-2">Browse and select items or sections to add to your projects</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sections List */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sections ({sections.length})</h2>

            {loadingSections ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
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
                    <div className="font-medium text-sm text-gray-900">
                      {section.section_number}. {section.section_title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{section.item_count} items</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Details */}
        <div className="col-span-2">
          {selectedSection === null ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Select a section to view items</p>
            </div>
          ) : loadingSection ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : currentSection ? (
            <div className="space-y-4">
              {/* Section Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-bold text-khc-primary">
                  {currentSection.section.section_number}. {currentSection.section.section_title}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {currentSection.section.item_count} items · {currentSection.pages?.length || 0} pages
                </p>

                {selectedItems.size > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-900 font-medium">{selectedItems.size} item(s) selected</p>
                  </div>
                )}
              </div>

              {/* Pages & Items */}
              {currentSection.pages && currentSection.pages.length > 0 ? (
                currentSection.pages.map((page: any, idx: number) => (
                  <div key={page.page_number} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Page Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Page {page.page_number} of {page.total_pages}
                      </h3>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={page.items.every((item: any) => selectedItems.has(item.id))}
                          onChange={() => handleSelectAllInPage(page.items)}
                          className="w-4 h-4"
                        />
                        Select all
                      </label>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                            <th className="px-4 py-2 text-left font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={page.items.every((item: any) => selectedItems.has(item.id))}
                                onChange={() => handleSelectAllInPage(page.items)}
                                className="w-4 h-4"
                              />
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Item No.</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Unit</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-700">Rate (£)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {page.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.item_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.description}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.unit}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                £{item.standard_rate?.toFixed(2) || '0.00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">No items in this section</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Copy Actions Footer */}
      {selectedItems.size > 0 || selectedSection !== null ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedItems.size > 0
                ? `${selectedItems.size} item(s) selected`
                : `Section ready to copy`}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Project ID"
                value={copierProjectId || ''}
                onChange={e => setCopierProjectId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khc-primary"
              />

              <select
                value={copierType}
                onChange={e => setCopierType(e.target.value as 'items' | 'section')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-khc-primary"
              >
                <option value="items">Copy selected items</option>
                <option value="section">Copy entire section</option>
              </select>

              <button
                onClick={handleCopyToProject}
                disabled={!copierProjectId || (copierType === 'items' && selectedItems.size === 0)}
                className="px-4 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Add to Project
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
