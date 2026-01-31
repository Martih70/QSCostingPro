import { useState } from 'react'

interface CostItem {
  id: number
  code: string
  description: string
  material_cost: number
  management_cost: number
  contractor_cost: number
  waste_factor: number
  is_contractor_required: boolean
  unit: { code: string; name: string }
  category?: { name: string }
}

interface CostLibrarySearchProps {
  items: CostItem[]
  isLoading: boolean
  onSelectItem: (itemId: number) => void
  selectedItemId: number | null
}

export default function CostLibrarySearch({
  items,
  isLoading,
  onSelectItem,
  selectedItemId,
}: CostLibrarySearchProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter cost items by search
  const filteredItems = items.filter((item) =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-gray-50 rounded p-4">
      <input
        type="text"
        placeholder="Search cost items by description or code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm mb-4"
      />

      <div className="max-h-64 overflow-y-auto divide-y border rounded">
        {isLoading ? (
          <div className="p-4 text-center text-gray-600">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-gray-600">No items found</div>
        ) : (
          filteredItems.slice(0, 20).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`p-4 cursor-pointer transition ${
                selectedItemId === item.id
                  ? 'bg-khc-light border-l-4 border-khc-primary'
                  : 'hover:bg-gray-100'
              }`}
            >
              <p className="font-semibold text-sm text-gray-900">
                {item.description}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                £
                {item.material_cost.toLocaleString('en-GB', {
                  maximumFractionDigits: 2,
                })}{' '}
                / {item.unit?.code || 'unit'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
