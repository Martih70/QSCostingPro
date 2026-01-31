import { useState } from 'react'
import Modal from '../ui/Modal'
import Tabs from './Tabs'
import CostLibrarySearch from '../estimates/CostLibrarySearch'
import EstimatePresetsPanel from './EstimatePresetsPanel'
import { useToast } from '../ui/ToastContainer'
import { useEstimatePresets } from '../../hooks/useEstimatePresets'
import { handleApiError, logError } from '../../utils/errorHandler'

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

interface LibraryItemData {
  cost_item_id: number
  quantity: number
  unit_cost_override?: number
  notes?: string
}

interface CustomItemData {
  custom_description: string
  quantity: number
  custom_unit: string
  custom_unit_rate: number
  category_id: number
  notes?: string
}

interface UnifiedAddLineItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddFromLibrary: (data: LibraryItemData) => Promise<void>
  onAddCustom: (data: CustomItemData) => Promise<void>
  costItems: CostItem[]
  categories: Category[]
  units: Unit[]
  isSubmitting: boolean
  costItemsLoading?: boolean
}

export default function UnifiedAddLineItemModal({
  isOpen,
  onClose,
  onAddFromLibrary,
  onAddCustom,
  costItems,
  categories,
  units,
  isSubmitting,
  costItemsLoading = false,
}: UnifiedAddLineItemModalProps) {
  const toast = useToast()
  const { incrementUsageCount, savePreset } = useEstimatePresets()
  const [activeTab, setActiveTab] = useState('library')

  // Library Tab State
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [libraryQuantity, setLibraryQuantity] = useState('1')
  const [costOverride, setCostOverride] = useState('')
  const [libraryNotes, setLibraryNotes] = useState('')

  // Custom Tab State
  const [customDescription, setCustomDescription] = useState('')
  const [customQuantity, setCustomQuantity] = useState('1')
  const [customUnit, setCustomUnit] = useState('')
  const [customUnitRate, setCustomUnitRate] = useState('')
  const [customCategoryId, setCustomCategoryId] = useState<number | string>('')
  const [customNotes, setCustomNotes] = useState('')

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSavePresetPrompt, setShowSavePresetPrompt] = useState(false)
  const [presetName, setPresetName] = useState('')

  const selectedItem = costItems.find((i) => i.id === selectedItemId)

  const resetForm = () => {
    setSelectedItemId(null)
    setLibraryQuantity('1')
    setCostOverride('')
    setLibraryNotes('')

    setCustomDescription('')
    setCustomQuantity('1')
    setCustomUnit('')
    setCustomUnitRate('')
    setCustomCategoryId('')
    setCustomNotes('')

    setErrors({})
  }

  const handleSelectPreset = (preset: any) => {
    setCustomDescription(preset.custom_description)
    setCustomQuantity(String(preset.quantity))
    setCustomUnit(preset.custom_unit)
    setCustomUnitRate(String(preset.custom_unit_rate))
    setCustomCategoryId(preset.category_id)
    setActiveTab('custom')
    incrementUsageCount(preset.id)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateLibraryForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedItemId) {
      newErrors.item = 'Please select an item'
    }
    if (!libraryQuantity || parseFloat(libraryQuantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    if (costOverride && isNaN(parseFloat(costOverride))) {
      newErrors.costOverride = 'Cost override must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateCustomForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customDescription.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!customQuantity || parseFloat(customQuantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    if (!customUnit.trim()) {
      newErrors.unit = 'Unit is required'
    }
    if (!customUnitRate || parseFloat(customUnitRate) < 0) {
      newErrors.unitRate = 'Unit rate must be 0 or greater'
    }
    if (!customCategoryId) {
      newErrors.category = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddFromLibrary = async () => {
    if (!validateLibraryForm()) return

    try {
      await onAddFromLibrary({
        cost_item_id: selectedItemId!,
        quantity: parseFloat(libraryQuantity),
        unit_cost_override: costOverride ? parseFloat(costOverride) : undefined,
        notes: libraryNotes || undefined,
      })
      toast.success('Line item added successfully')
      resetForm()
    } catch (error) {
      logError(error, 'AddFromLibrary')
      const message = handleApiError(error)
      toast.error(message)
    }
  }

  const handleAddCustom = async () => {
    if (!validateCustomForm()) return

    try {
      await onAddCustom({
        custom_description: customDescription,
        quantity: parseFloat(customQuantity),
        custom_unit: customUnit,
        custom_unit_rate: parseFloat(customUnitRate),
        category_id: Number(customCategoryId),
        notes: customNotes || undefined,
      })
      toast.success('Custom item added successfully')
      resetForm()
    } catch (error) {
      logError(error, 'AddCustom')
      const message = handleApiError(error)
      toast.error(message)
    }
  }

  const handleSaveAsPreset = () => {
    if (!validateCustomForm()) return
    if (!presetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    const result = savePreset(presetName, {
      name: presetName,
      description: `${customDescription} - ${customQuantity} × £${customUnitRate}`,
      custom_description: customDescription,
      quantity: parseFloat(customQuantity),
      custom_unit: customUnit,
      custom_unit_rate: parseFloat(customUnitRate),
      category_id: Number(customCategoryId),
    })

    if (result) {
      toast.success(`Preset "${presetName}" saved successfully`)
      setShowSavePresetPrompt(false)
      setPresetName('')
    } else {
      toast.error('Failed to save preset')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Line Item" size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'library', label: 'From Library', icon: '📚' },
            { id: 'presets', label: 'Quick Add', icon: '⭐' },
            { id: 'custom', label: 'Custom Item', icon: '✏️' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <EstimatePresetsPanel onSelectPreset={handleSelectPreset} />
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {errors.item && (
              <div className="text-sm text-red-600">{errors.item}</div>
            )}

            <CostLibrarySearch
              items={costItems}
              isLoading={costItemsLoading}
              onSelectItem={setSelectedItemId}
              selectedItemId={selectedItemId}
            />

            {/* Selected Item Form */}
            {selectedItem && (
              <div className="bg-khc-light rounded-lg p-4 border border-khc-primary space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedItem.description}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Material: £
                    {selectedItem.material_cost.toLocaleString('en-GB', {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={libraryQuantity}
                      onChange={(e) => setLibraryQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                    />
                    {errors.quantity && (
                      <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Override (£)
                    </label>
                    <input
                      type="number"
                      value={costOverride}
                      onChange={(e) => setCostOverride(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                    />
                    {errors.costOverride && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.costOverride}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={libraryNotes}
                    onChange={(e) => setLibraryNotes(e.target.value)}
                    placeholder="Optional notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                  />
                </div>
              </div>
            )}
        </div>
        )}

        {/* Custom Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Enter item description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                />
                {errors.quantity && (
                  <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="e.g., m2, sqm, item"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                />
                {errors.unit && (
                  <p className="text-xs text-red-600 mt-1">{errors.unit}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Rate (£) *
                </label>
                <input
                  type="number"
                  value={customUnitRate}
                  onChange={(e) => setCustomUnitRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                />
                {errors.unitRate && (
                  <p className="text-xs text-red-600 mt-1">{errors.unitRate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={customCategoryId}
                  onChange={(e) => setCustomCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-600 mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Optional notes"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
              />
            </div>
          </div>
        )}

        {/* Save Preset Prompt */}
        {showSavePresetPrompt && activeTab === 'custom' && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
            <p className="text-sm font-medium text-blue-900">Save as Preset</p>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name (e.g., 'Standard Labor Cost')"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSavePresetPrompt(false)
                  setPresetName('')
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsPreset}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save Preset
              </button>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex gap-2 justify-between">
          {activeTab === 'custom' && !showSavePresetPrompt && (
            <button
              onClick={() => setShowSavePresetPrompt(true)}
              className="px-4 py-2 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
            >
              💾 Save as Preset
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            {activeTab !== 'presets' && (
              <button
                onClick={
                  activeTab === 'library' ? handleAddFromLibrary : handleAddCustom
                }
                disabled={isSubmitting || (activeTab === 'library' && !selectedItem)}
                className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg disabled:bg-gray-400 text-sm"
              >
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
