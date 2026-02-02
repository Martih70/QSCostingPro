import { useState } from 'react'
import React from 'react'

import { BCISGroupedEstimates, CostComponent } from '../../types/estimate'

interface LineItemsTableProps {
  data: BCISGroupedEstimates | null
  onUpdateQuantity: (estimateId: number, newQuantity: number) => Promise<void>
  onDeleteItem: (estimateId: number) => Promise<void>
  onUpdateComponent: (componentId: number, unitRate: number, wasteFactor: number) => Promise<void>
  onAddComponent: (estimateId: number, componentType: 'material' | 'labor' | 'plant', unitRate: number, wasteFactor: number) => Promise<void>
  onDeleteComponent: (componentId: number) => Promise<void>
  isLoading: boolean
  isEmpty: boolean
}

export default function LineItemsTable({
  data,
  onUpdateQuantity,
  onDeleteItem,
  onUpdateComponent,
  onAddComponent,
  onDeleteComponent,
  isLoading,
  isEmpty,
}: LineItemsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingComponentId, setEditingComponentId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnitRate, setEditUnitRate] = useState('')
  const [editWasteFactor, setEditWasteFactor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItemExpanded = (estimateId: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(estimateId)) {
      newExpanded.delete(estimateId)
    } else {
      newExpanded.add(estimateId)
    }
    setExpandedItems(newExpanded)
  }

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

  const handleSaveComponent = async (componentId: number) => {
    const rate = parseFloat(editUnitRate)
    const waste = parseFloat(editWasteFactor)

    if (isNaN(rate) || rate < 0) {
      alert('Please enter a valid unit rate')
      return
    }
    if (isNaN(waste) || waste <= 0) {
      alert('Please enter a valid waste factor (e.g., 1.05 for 5% waste)')
      return
    }

    try {
      setIsSubmitting(true)
      await onUpdateComponent(componentId, rate, waste)
      setEditingComponentId(null)
      setEditUnitRate('')
      setEditWasteFactor('')
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

  const handleDeleteComponent = async (componentId: number) => {
    if (window.confirm('Remove this cost component?')) {
      try {
        setIsSubmitting(true)
        await onDeleteComponent(componentId)
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
          <p className="text-sm">No line items yet. Click "Add Line Item" or "Import from BOQ" to start building your estimate.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">NRM2</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Qty</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Unit</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Component</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Unit Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Waste</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.elements.map((element) => (
              <React.Fragment key={element.bcis_code}>
                {/* BCIS Element Header Row */}
                <tr className="bg-khc-light border-b">
                  <td colSpan={10} className="px-4 py-3">
                    <p className="font-bold text-khc-primary text-sm">
                      {element.bcis_code}. {element.bcis_name}
                    </p>
                  </td>
                </tr>

                {/* Line Items */}
                {element.items.map((item, itemIdx) => {
                  const hasComponents = Object.keys(item.components).length > 0
                  const componentEntries = Object.entries(item.components).filter(([_, comp]) => comp)
                  const isExpanded = expandedItems.has(item.id)

                  return (
                    <React.Fragment key={item.id}>
                      {/* Item Summary Row */}
                      <tr className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-600 w-8">{itemIdx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.description}</p>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.nrm2_code ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                              {item.nrm2_code}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingId === item.id ? (
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
                        <td className="px-4 py-3 text-center text-gray-600">{item.unit}</td>
                        <td colSpan={4} className="px-4 py-3 text-right font-bold text-khc-primary">
                          £{item.subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            {editingId === item.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveQuantity(item.id)}
                                  disabled={isSubmitting}
                                  className="px-2 py-1 bg-khc-primary text-white text-xs rounded hover:bg-khc-secondary disabled:bg-gray-400"
                                  title="Save quantity"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-100"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingId(item.id)
                                    setEditQuantity(item.quantity.toString())
                                  }}
                                  className="text-khc-primary hover:text-khc-secondary text-xs hover:underline"
                                  title="Edit quantity"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => toggleItemExpanded(item.id)}
                                  className="text-blue-600 hover:text-blue-700 text-xs hover:underline"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item.id)}
                                  disabled={isSubmitting}
                                  className="text-red-600 hover:text-red-700 text-xs hover:underline disabled:text-gray-400"
                                  title="Delete item"
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Cost Components View */}
                      {isExpanded && (
                        <>
                          {/* Header for components */}
                          {componentEntries.length > 0 && (
                            <tr className="bg-gray-50 border-b">
                              <td colSpan={2} className="px-8 py-2 text-xs font-semibold text-gray-600">
                                Cost Components
                              </td>
                              <td colSpan={2} className="text-xs text-gray-600">Unit Rate</td>
                              <td colSpan={1} className="text-xs text-gray-600">Waste</td>
                              <td className="text-right text-xs font-semibold text-gray-600">Total</td>
                              <td colSpan={2}></td>
                            </tr>
                          )}

                          {/* Cost Component Rows */}
                          {componentEntries.map(([type, component]) => (
                            <tr key={component.id} className="bg-gray-50 border-b hover:bg-gray-100 transition">
                              <td colSpan={2} className="px-8 py-2">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800 capitalize">
                                  {type}
                                </span>
                              </td>
                              <td colSpan={2} className="px-4 py-2 text-right">
                                {editingComponentId === component.id ? (
                                  <div className="flex gap-1 justify-end">
                                    <span className="text-xs text-gray-600">£</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editUnitRate}
                                      onChange={(e) => setEditUnitRate(e.target.value)}
                                      autoFocus
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                                      placeholder="Rate"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium">£{component.unit_rate.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {editingComponentId === component.id ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editWasteFactor}
                                    onChange={(e) => setEditWasteFactor(e.target.value)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                                    placeholder="Waste"
                                  />
                                ) : (
                                  <span className="text-sm">{component.waste_factor.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-purple-600">
                                £{component.total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                              </td>
                              <td colSpan={2} className="px-4 py-2 text-center">
                                <div className="flex gap-1 justify-center">
                                  {editingComponentId === component.id ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveComponent(component.id)}
                                        disabled={isSubmitting}
                                        className="px-2 py-1 bg-khc-primary text-white text-xs rounded hover:bg-khc-secondary disabled:bg-gray-400"
                                        title="Save"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => setEditingComponentId(null)}
                                        className="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-100"
                                        title="Cancel"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingComponentId(component.id)
                                          setEditUnitRate(component.unit_rate.toString())
                                          setEditWasteFactor(component.waste_factor.toString())
                                        }}
                                        className="text-khc-primary hover:text-khc-secondary text-xs hover:underline"
                                        title="Edit"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComponent(component.id)}
                                        disabled={isSubmitting}
                                        className="text-red-600 hover:text-red-700 text-xs hover:underline disabled:text-gray-400"
                                        title="Delete"
                                      >
                                        🗑
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}

                          {/* Add Component Buttons */}
                          {isExpanded && (
                            <tr className="bg-blue-50 border-b">
                              <td colSpan={10} className="px-8 py-2">
                                <div className="flex gap-2">
                                  {!item.components.material && (
                                    <button
                                      onClick={() =>
                                        onAddComponent(item.id, 'material', 0, 1.0).catch((err) =>
                                          alert('Error adding component: ' + err.message)
                                        )
                                      }
                                      disabled={isSubmitting}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:bg-gray-400"
                                    >
                                      + Material
                                    </button>
                                  )}
                                  {!item.components.labor && (
                                    <button
                                      onClick={() =>
                                        onAddComponent(item.id, 'labor', 0, 1.0).catch((err) =>
                                          alert('Error adding component: ' + err.message)
                                        )
                                      }
                                      disabled={isSubmitting}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:bg-gray-400"
                                    >
                                      + Labor
                                    </button>
                                  )}
                                  {!item.components.plant && (
                                    <button
                                      onClick={() =>
                                        onAddComponent(item.id, 'plant', 0, 1.0).catch((err) =>
                                          alert('Error adding component: ' + err.message)
                                        )
                                      }
                                      disabled={isSubmitting}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:bg-gray-400"
                                    >
                                      + Plant
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  )
                })}

                {/* Element Subtotal */}
                <tr className="bg-khc-light border-b font-semibold">
                  <td colSpan={8} className="px-4 py-3 text-right text-gray-700">
                    {element.bcis_name} SUBTOTAL:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-khc-primary">
                    £{element.subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
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
