import { useEffect, useState } from 'react'
import { useCostItemsStore } from '../stores/costItemsStore'
import { useAuth } from '../hooks/useAuth'
import BackButton from '../components/ui/BackButton'
import { formatCurrency } from '../utils/formatters'
import {
  CostCategory,
  CostSubElement,
  CostItem,
  CreateCostItemRequest,
  CreateCostCategoryRequest,
  CreateCostSubElementRequest,
} from '../types/cost'

type TabType = 'categories' | 'subElements' | 'costItems'

export default function CostItemsPage() {
  const { isAdmin } = useAuth()
  const {
    categories,
    subElements,
    costItems,
    units,
    isLoading,
    error,
    selectedCategoryId,
    searchTerm,
    fetchCategories,
    fetchSubElements,
    fetchCostItems,
    fetchUnits,
    setSelectedCategory,
    setSearchTerm,
    clearError,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubElement,
    updateSubElement,
    deleteSubElement,
    createCostItem,
    updateCostItem,
    deleteCostItem,
  } = useCostItemsStore()

  const [activeTab, setActiveTab] = useState<TabType>('costItems')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState<CreateCostCategoryRequest>({
    code: '',
    name: '',
    description: '',
    sort_order: 0,
  })

  const [subElementForm, setSubElementForm] = useState<CreateCostSubElementRequest>({
    category_id: 0,
    code: '',
    name: '',
    description: '',
    sort_order: 0,
  })

  const [costItemForm, setCostItemForm] = useState<CreateCostItemRequest>({
    sub_element_id: 0,
    code: '',
    description: '',
    unit_id: 0,
    material_cost: 0,
    management_cost: 0,
    contractor_cost: 0,
    is_contractor_required: false,
    waste_factor: 1.05,
  })

  // Fetch data on mount
  useEffect(() => {
    fetchCategories()
    fetchSubElements()
    fetchCostItems()
    fetchUnits()
  }, [fetchCategories, fetchSubElements, fetchCostItems, fetchUnits])

  // Category handlers
  const handleSaveCategory = async () => {
    try {
      if (editingId) {
        await updateCategory(editingId, categoryForm)
        setEditingId(null)
      } else {
        await createCategory(categoryForm)
      }
      setCategoryForm({ code: '', name: '', description: '', sort_order: 0 })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to save category:', err)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Delete this category? This will affect all sub-elements.')) {
      try {
        await deleteCategory(id)
      } catch (err) {
        console.error('Failed to delete category:', err)
      }
    }
  }

  // Sub-element handlers
  const handleSaveSubElement = async () => {
    try {
      if (editingId) {
        await updateSubElement(editingId, subElementForm)
        setEditingId(null)
      } else {
        await createSubElement(subElementForm)
      }
      setSubElementForm({
        category_id: 0,
        code: '',
        name: '',
        description: '',
        sort_order: 0,
      })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to save sub-element:', err)
    }
  }

  const handleDeleteSubElement = async (id: number) => {
    if (window.confirm('Delete this sub-element? This will affect all cost items.')) {
      try {
        await deleteSubElement(id)
      } catch (err) {
        console.error('Failed to delete sub-element:', err)
      }
    }
  }

  // Cost item handlers
  const handleSaveCostItem = async () => {
    try {
      if (editingId) {
        await updateCostItem(editingId, costItemForm)
        setEditingId(null)
      } else {
        await createCostItem(costItemForm)
      }
      setCostItemForm({
        sub_element_id: 0,
        code: '',
        description: '',
        unit_id: 0,
        material_cost: 0,
        management_cost: 0,
        contractor_cost: 0,
        is_contractor_required: false,
        waste_factor: 1.05,
      })
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to save cost item:', err)
    }
  }

  const handleDeleteCostItem = async (id: number) => {
    if (window.confirm('Delete this cost item?')) {
      try {
        await deleteCostItem(id)
      } catch (err) {
        console.error('Failed to delete cost item:', err)
      }
    }
  }

  // Filter sub-elements by category
  const filteredSubElements = selectedCategoryId
    ? subElements.filter((se) => se.category_id === selectedCategoryId)
    : subElements

  // Search cost items
  const filteredCostItems = costItems.filter(
    (item) =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">You don't have permission to access cost management</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">Cost Database Management</h1>
        <p className="text-gray-600 mt-2">Manage categories, sub-elements, and cost items</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-2 border-b-2 font-medium transition ${
              activeTab === 'categories'
                ? 'border-khc-primary text-khc-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('subElements')}
            className={`py-4 px-2 border-b-2 font-medium transition ${
              activeTab === 'subElements'
                ? 'border-khc-primary text-khc-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Sub-Elements
          </button>
          <button
            onClick={() => setActiveTab('costItems')}
            className={`py-4 px-2 border-b-2 font-medium transition ${
              activeTab === 'costItems'
                ? 'border-khc-primary text-khc-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cost Items
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Cost Categories</h2>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setEditingId(null)
                  setCategoryForm({ code: '', name: '', description: '', sort_order: 0 })
                }}
                className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
              >
                {showAddForm ? 'Cancel' : '+ Add Category'}
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="e.g., CAT-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="Category name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingId(null)
                      setCategoryForm({ code: '', name: '', description: '', sort_order: 0 })
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCategory}
                    className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Categories Table */}
            {isLoading && !categories.length ? (
              <div className="text-center py-8 text-gray-600">Loading categories...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{cat.code}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cat.description || '-'}</td>
                        <td className="px-6 py-4 text-center text-sm">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setCategoryForm(cat)
                                setEditingId(cat.id)
                                setShowAddForm(true)
                              }}
                              className="text-khc-primary hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sub-Elements Tab */}
        {activeTab === 'subElements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Cost Sub-Elements</h2>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setEditingId(null)
                  setSubElementForm({
                    category_id: 0,
                    code: '',
                    name: '',
                    description: '',
                    sort_order: 0,
                  })
                }}
                className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
              >
                {showAddForm ? 'Cancel' : '+ Add Sub-Element'}
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  selectedCategoryId === null
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    selectedCategoryId === cat.id
                      ? 'bg-khc-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={subElementForm.category_id}
                      onChange={(e) =>
                        setSubElementForm({ ...subElementForm, category_id: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                    >
                      <option value={0}>Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      value={subElementForm.code}
                      onChange={(e) => setSubElementForm({ ...subElementForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="e.g., SUB-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={subElementForm.name}
                      onChange={(e) => setSubElementForm({ ...subElementForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="Sub-element name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={subElementForm.description || ''}
                    onChange={(e) =>
                      setSubElementForm({ ...subElementForm, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingId(null)
                      setSubElementForm({
                        category_id: 0,
                        code: '',
                        name: '',
                        description: '',
                        sort_order: 0,
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubElement}
                    className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Elements Table */}
            {isLoading && !subElements.length ? (
              <div className="text-center py-8 text-gray-600">Loading sub-elements...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSubElements.map((se) => {
                      const category = categories.find((c) => c.id === se.category_id)
                      return (
                        <tr key={se.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600">{category?.name || '-'}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{se.code}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{se.name}</td>
                          <td className="px-6 py-4 text-center text-sm">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSubElementForm(se)
                                  setEditingId(se.id)
                                  setShowAddForm(true)
                                }}
                                className="text-khc-primary hover:underline text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubElement(se.id)}
                                className="text-red-600 hover:underline text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cost Items Tab */}
        {activeTab === 'costItems' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Cost Items</h2>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setEditingId(null)
                  setCostItemForm({
                    sub_element_id: 0,
                    code: '',
                    description: '',
                    unit_id: 0,
                    material_cost: 0,
                    management_cost: 0,
                    contractor_cost: 0,
                    is_contractor_required: false,
                    waste_factor: 1.05,
                  })
                }}
                className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
              >
                {showAddForm ? 'Cancel' : '+ Add Cost Item'}
              </button>
            </div>

            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search cost items by description or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
              />
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Element *</label>
                    <select
                      value={costItemForm.sub_element_id}
                      onChange={(e) =>
                        setCostItemForm({
                          ...costItemForm,
                          sub_element_id: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                    >
                      <option value={0}>Select a sub-element</option>
                      {subElements.map((se) => (
                        <option key={se.id} value={se.id}>
                          {se.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      value={costItemForm.code}
                      onChange={(e) => setCostItemForm({ ...costItemForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="e.g., ITM-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input
                    type="text"
                    value={costItemForm.description}
                    onChange={(e) =>
                      setCostItemForm({ ...costItemForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                    placeholder="Item description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      value={costItemForm.unit_id}
                      onChange={(e) =>
                        setCostItemForm({ ...costItemForm, unit_id: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                    >
                      <option value={0}>Select unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waste Factor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costItemForm.waste_factor}
                      onChange={(e) =>
                        setCostItemForm({ ...costItemForm, waste_factor: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="1.05"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Required</label>
                    <input
                      type="checkbox"
                      checked={costItemForm.is_contractor_required}
                      onChange={(e) =>
                        setCostItemForm({
                          ...costItemForm,
                          is_contractor_required: e.target.checked,
                        })
                      }
                      className="w-4 h-4 mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costItemForm.material_cost}
                      onChange={(e) =>
                        setCostItemForm({
                          ...costItemForm,
                          material_cost: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Management Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costItemForm.management_cost}
                      onChange={(e) =>
                        setCostItemForm({
                          ...costItemForm,
                          management_cost: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costItemForm.contractor_cost}
                      onChange={(e) =>
                        setCostItemForm({
                          ...costItemForm,
                          contractor_cost: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingId(null)
                      setCostItemForm({
                        sub_element_id: 0,
                        code: '',
                        description: '',
                        unit_id: 0,
                        material_cost: 0,
                        management_cost: 0,
                        contractor_cost: 0,
                        is_contractor_required: false,
                        waste_factor: 1.05,
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCostItem}
                    className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Cost Items Table */}
            {isLoading && !costItems.length ? (
              <div className="text-center py-8 text-gray-600">Loading cost items...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sub-Element</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Material Cost</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Mgmt Cost</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Contractor Cost</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredCostItems.map((item) => {
                      const subElem = subElements.find((se) => se.id === item.sub_element_id)
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{item.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{subElem?.name || '-'}</td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                            {formatCurrency(item.material_cost)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                            {formatCurrency(item.management_cost)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                            {formatCurrency(item.contractor_cost)}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setCostItemForm(item)
                                  setEditingId(item.id)
                                  setShowAddForm(true)
                                }}
                                className="text-khc-primary hover:underline text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCostItem(item.id)}
                                className="text-red-600 hover:underline text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
