import { useState } from 'react'
import React from 'react'

import { CategoryTotal } from '../../types/estimate'

interface LineItemsTableProps {
  categories: CategoryTotal[]
  onUpdateQuantity: (estimateId: number, newQuantity: number) => Promise<void>
  onDeleteItem: (estimateId: number) => Promise<void>
  isLoading: boolean
  isEmpty: boolean
}

export default function LineItemsTable({
  categories,
  onUpdateQuantity,
  onDeleteItem,
  isLoading,
  isEmpty,
}: LineItemsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSaveQuantity = async (estimateId: number) => {
    const qty = parseFloat(editQuantity)
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    try {
      setIsSubmitting(true)
      await onUpdateQuantity(estimateId, qty)
      setEditingId(null)
      setEditQuantity('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async (estimateId: number) => {
    if (window.confirm('Remove this item from the estimate?')) {
      try {
        setIsSubmitting(true)
        await onDeleteItem(estimateId)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center text-gray-600">Loading estimates...</div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-semibold mb-2">📋 Build Your Estimate</p>
          <p className="text-sm">No line items yet. Click "Quick Add Item" to start building your estimate.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">#</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">NRM 2 Code</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Qty</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Unit</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <React.Fragment key={category.category_id}>
                {/* Category Header Row */}
                <tr className="bg-khc-light border-b hover:bg-opacity-75">
                  <td colSpan={7} className="px-6 py-3">
                    <p className="font-semibold text-khc-primary text-sm">{category.category_name}</p>
                  </td>
                </tr>

                {/* Line Items */}
                {category.line_items.map((item, idx) => (
                  <tr key={item.estimate_id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600 w-8">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-gray-900">{item.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.nrm2_code ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          {item.nrm2_code}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {editingId === item.estimate_id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          autoFocus
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      ) : (
                        <span className="font-medium">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">{item.unit_code}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="font-bold text-khc-primary">
                        £{item.line_total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2 justify-center">
                        {editingId === item.estimate_id ? (
                          <>
                            <button
                              onClick={() => handleSaveQuantity(item.estimate_id)}
                              disabled={isSubmitting}
                              className="px-3 py-1 bg-khc-primary text-white text-xs rounded hover:bg-khc-secondary disabled:bg-gray-400"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(item.estimate_id)
                                setEditQuantity(item.quantity.toString())
                              }}
                              className="text-khc-primary hover:text-khc-secondary text-xs hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.estimate_id)}
                              disabled={isSubmitting}
                              className="text-red-600 hover:text-red-700 text-xs hover:underline disabled:text-gray-400"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Category Subtotal */}
                <tr className="bg-gray-50 border-b">
                  <td colSpan={5} className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    {category.category_name} Subtotal:
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-khc-primary">
                    £{category.subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
