import { useMemo } from 'react'
import { formatCurrency } from '../../utils/formatters'
import type { BoQItem, BoQSection } from '../../types/boq'

interface BoQPreviewTableProps {
  items: BoQItem[]
  sections: BoQSection[]
  totalAmount: number
}

export default function BoQPreviewTable({
  items,
  sections,
  totalAmount
}: BoQPreviewTableProps) {
  // Group items by section for display
  const groupedItems = useMemo(() => {
    if (sections.length > 0) {
      return sections
    }

    // If no sections, group by sectionNumber
    const grouped: Map<number, BoQItem[]> = new Map()
    items.forEach((item) => {
      const sectionNum = item.sectionNumber || 0
      if (!grouped.has(sectionNum)) {
        grouped.set(sectionNum, [])
      }
      grouped.get(sectionNum)!.push(item)
    })

    return Array.from(grouped.entries()).map(([sectionNumber, sectionItems]) => ({
      sectionNumber,
      sectionTitle: `Section ${sectionNumber}`,
      items: sectionItems,
      sectionTotal: sectionItems.reduce((sum, item) => sum + item.amount, 0)
    }))
  }, [items, sections])

  // If no items but we have sections, show section summary
  if (items.length === 0 && sections.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">📊 Import Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-600 font-medium">TOTAL SECTIONS</p>
              <p className="text-2xl font-bold text-blue-900">{sections.length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">TOTAL ITEMS</p>
              <p className="text-2xl font-bold text-blue-900">
                {sections.reduce((sum, s) => sum + (s.itemCount || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">TOTAL AMOUNT</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Sections to Import:</h4>
          {sections.map((section) => (
            <div key={section.sectionId || section.sectionNumber} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    {section.sectionNumber}. {section.sectionTitle}
                  </p>
                  <p className="text-sm text-gray-600">
                    {section.itemCount || 0} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-khc-primary">
                    {formatCurrency(section.sectionTotal)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No items to preview</p>
        <p className="text-sm mt-2">Upload a BoQ file to see items here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-khc-light border-b-2 border-khc-primary">
              <th className="px-4 py-3 text-left text-sm font-semibold text-khc-primary">
                Item No.
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-khc-primary">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-khc-primary">
                Unit
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-khc-primary">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-khc-primary">
                Rate (£)
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-khc-primary">
                Amount (£)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-khc-primary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedItems.map((section) => (
              <tbody key={section.sectionNumber}>
                {/* Section Header */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={7} className="px-4 py-2">
                    <div className="font-semibold text-gray-900">
                      {section.sectionTitle || `Section ${section.sectionNumber}`}
                    </div>
                  </td>
                </tr>

                {/* Items */}
                {section.items?.map((item, itemIndex) => (
                  <tr
                    key={`${section.sectionNumber}-${itemIndex}`}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {item.itemNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {item.quantity.toLocaleString('en-GB', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.notes ? (
                        <span className="italic text-gray-500" title={item.notes}>
                          {item.notes.length > 20
                            ? item.notes.substring(0, 20) + '...'
                            : item.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Section Total */}
                <tr className="bg-gray-100 border-b border-gray-200">
                  <td colSpan={5} className="px-4 py-2 text-right font-semibold text-gray-900">
                    {section.sectionTitle || `Section ${section.sectionNumber}`} Total:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-khc-primary">
                    {formatCurrency(section.sectionTotal)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grand Total */}
      <div className="bg-khc-light rounded-lg p-6 border-2 border-khc-primary">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-khc-primary">Grand Total:</span>
          <span className="text-2xl font-bold text-khc-primary">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">Total Items</div>
          <div className="text-2xl font-bold text-khc-primary mt-1">
            {items.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">Total Sections</div>
          <div className="text-2xl font-bold text-khc-primary mt-1">
            {sections.length > 0 ? sections.length : groupedItems.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 font-medium">Total Quantity</div>
          <div className="text-2xl font-bold text-khc-primary mt-1">
            {items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-GB', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
