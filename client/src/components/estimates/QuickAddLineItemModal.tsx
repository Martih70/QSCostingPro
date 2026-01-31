import { useState, useEffect } from 'react'
import { z } from 'zod'

interface Unit {
  id: number
  code: string
  name: string
}

interface Category {
  id: number
  code: string
  name: string
}

interface QuickAddLineItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    custom_description: string
    quantity: number
    custom_unit: string
    custom_unit_rate: number
    category_id: number
    notes?: string
  }) => Promise<void>
  categories: Category[]
  units: Unit[]
  isSubmitting: boolean
}

export default function QuickAddLineItemModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  units,
  isSubmitting,
}: QuickAddLineItemModalProps) {
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState(units[0]?.code || 'nr')
  const [unitRate, setUnitRate] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id?.toString() || '1')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDescription('')
      setQuantity('1')
      setUnit(units[0]?.code || 'nr')
      setUnitRate('')
      setCategoryId(categories[0]?.id?.toString() || '1')
      setNotes('')
      setErrors({})
    }
  }, [isOpen, units, categories])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!description || description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters'
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    const rate = parseFloat(unitRate)
    if (isNaN(rate) || rate < 0) {
      newErrors.unitRate = 'Unit rate must be a non-negative number'
    }

    if (!unit) {
      newErrors.unit = 'Unit is required'
    }

    if (!categoryId) {
      newErrors.categoryId = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await onSubmit({
        custom_description: description,
        quantity: parseFloat(quantity),
        custom_unit: unit,
        custom_unit_rate: parseFloat(unitRate),
        category_id: parseInt(categoryId, 10),
        notes: notes || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-khc-primary">Quick Add Line Item</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Foundation excavation"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                  errors.unit ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {units.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.code}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="text-red-600 text-xs mt-1">{errors.unit}</p>}
            </div>
          </div>

          {/* Unit Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Rate (£) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitRate}
              onChange={(e) => setUnitRate(e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                errors.unitRate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.unitRate && <p className="text-red-600 text-xs mt-1">{errors.unitRate}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-red-600 text-xs mt-1">{errors.categoryId}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            />
          </div>

          {/* Line Total Preview */}
          {unitRate && quantity && (
            <div className="p-3 bg-khc-light rounded-lg">
              <p className="text-sm text-gray-700">
                Line Total: <span className="font-bold text-khc-primary">
                  £{(parseFloat(unitRate) * parseFloat(quantity)).toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:text-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg disabled:bg-gray-400"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
