import { useState, useMemo } from 'react'
import { ProjectEstimate } from '../../types/estimate'
import { formatCurrency } from '../../utils/formatters'

interface CollectionPageViewProps {
  estimates: ProjectEstimate[]
  initialSection?: string
  isLoading: boolean
  isEmpty: boolean
}

interface PageSummary {
  page_number: number
  total: number
  item_count: number
}

interface CollectionSection {
  section_name: string
  pages: PageSummary[]
  section_total: number
  is_complete: boolean
}

export default function CollectionPageView({ estimates, initialSection, isLoading, isEmpty }: CollectionPageViewProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(initialSection || null)

  // Group and aggregate estimates by section and page
  const sectionCollections = useMemo(() => {
    const grouped = new Map<string, CollectionSection>()

    estimates.forEach((est) => {
      const sectionName = est.section_name || 'General'
      const pageNumber = est.page_number || 1

      if (!grouped.has(sectionName)) {
        grouped.set(sectionName, {
          section_name: sectionName,
          pages: [],
          section_total: 0,
          is_complete: true,
        })
      }

      const section = grouped.get(sectionName)!

      // Find or create page summary
      let pageSummary = section.pages.find((p) => p.page_number === pageNumber)
      if (!pageSummary) {
        pageSummary = { page_number: pageNumber, total: 0, item_count: 0 }
        section.pages.push(pageSummary)
      }

      // Add to page total
      pageSummary.total += est.line_total || 0
      pageSummary.item_count += 1

      // Update completion status
      if (!est.is_page_complete) {
        section.is_complete = false
      }
    })

    // Sort pages and calculate section totals
    const collections = Array.from(grouped.values())
    collections.forEach((section) => {
      section.pages.sort((a, b) => a.page_number - b.page_number)
      section.section_total = section.pages.reduce((sum, p) => sum + p.total, 0)
    })

    return collections.sort((a, b) => a.section_name.localeCompare(b.section_name))
  }, [estimates])

  // Get grand total across all sections
  const grandTotal = useMemo(() => {
    return sectionCollections.reduce((sum, section) => sum + section.section_total, 0)
  }, [sectionCollections])

  // Get current selected section or first one
  const currentSection = useMemo(() => {
    if (!selectedSection && sectionCollections.length > 0) {
      setSelectedSection(sectionCollections[0].section_name)
      return sectionCollections[0]
    }
    return sectionCollections.find((s) => s.section_name === selectedSection) || null
  }, [selectedSection, sectionCollections])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center text-gray-600">Loading estimates...</div>
      </div>
    )
  }

  if (isEmpty || sectionCollections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-semibold mb-2">📋 Build Your Estimate</p>
          <p className="text-sm">Import Standard BoQ or Add Line Item to start estimate build</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Collection Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionCollections.map((section) => (
            <button
              key={section.section_name}
              onClick={() => setSelectedSection(section.section_name)}
              className={`p-4 rounded-lg text-left transition-colors border-2 ${
                selectedSection === section.section_name
                  ? 'bg-khc-primary/10 border-khc-primary'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{section.section_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {section.pages.length} page{section.pages.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div
                  className={`text-sm px-2 py-1 rounded ${
                    section.is_complete
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {section.is_complete ? '✓ Complete' : 'In Progress'}
                </div>
              </div>
              <div className="text-right mt-2">
                <p className="text-xs text-gray-600">Section Total</p>
                <p className="text-lg font-bold text-khc-primary">{formatCurrency(section.section_total)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Collection Page Detail */}
      {currentSection && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-khc-light border-b border-khc-primary p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-khc-primary">{currentSection.section_name}</h2>
                <p className="text-sm text-gray-600 mt-1">Collection Page</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div
                    className={`text-sm px-3 py-1 rounded ${
                      currentSection.is_complete
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentSection.is_complete ? '✓ Complete' : 'In Progress'}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Section Total</p>
                <p className="text-3xl font-bold text-khc-primary">{formatCurrency(currentSection.section_total)}</p>
              </div>
            </div>
          </div>

          {/* Pages List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Page</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Items</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Page Total</th>
                </tr>
              </thead>
              <tbody>
                {currentSection.pages.map((page, idx) => (
                  <tr key={page.page_number} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        Page {page.page_number}/{currentSection.pages.length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {currentSection.section_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {page.item_count} item{page.item_count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-lg font-bold text-khc-primary">{formatCurrency(page.total)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section Footer with Total */}
          <div className="border-t border-gray-200 bg-khc-light p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Section Total:</span>
              <span className="text-2xl font-bold text-khc-primary">
                {formatCurrency(currentSection.section_total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grand Total Summary */}
      {sectionCollections.length > 0 && (
        <div className="bg-gradient-to-r from-khc-primary to-khc-secondary rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold opacity-90">Total Across All Sections</p>
              <p className="text-3xl font-bold mt-2">Grand Total</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{formatCurrency(grandTotal)}</p>
              <p className="text-sm opacity-90 mt-2">
                {sectionCollections.length} section{sectionCollections.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
