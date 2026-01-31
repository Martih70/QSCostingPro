/**
 * Cost Items Store
 * Zustand store for managing cost database state
 */

import { create } from 'zustand'
import { costItemsAPI } from '../services/api'
import {
  CostCategory,
  CostSubElement,
  CostItem,
  Unit,
  CreateCostItemRequest,
  UpdateCostItemRequest,
  CreateCostCategoryRequest,
  UpdateCostCategoryRequest,
  CreateCostSubElementRequest,
  UpdateCostSubElementRequest,
  CostItemFilter,
} from '../types/cost'

interface CostItemsState {
  // State
  categories: CostCategory[]
  subElements: CostSubElement[]
  costItems: CostItem[]
  units: Unit[]
  isLoading: boolean
  error: string | null

  // Filters
  selectedCategoryId: number | null
  searchTerm: string

  // Actions
  fetchCategories: () => Promise<void>
  fetchSubElements: (categoryId?: number) => Promise<void>
  fetchCostItems: (filters?: CostItemFilter) => Promise<void>
  fetchUnits: () => Promise<void>

  // Category CRUD
  createCategory: (data: CreateCostCategoryRequest) => Promise<CostCategory>
  updateCategory: (id: number, data: UpdateCostCategoryRequest) => Promise<CostCategory>
  deleteCategory: (id: number) => Promise<void>

  // Sub-element CRUD
  createSubElement: (data: CreateCostSubElementRequest) => Promise<CostSubElement>
  updateSubElement: (id: number, data: UpdateCostSubElementRequest) => Promise<CostSubElement>
  deleteSubElement: (id: number) => Promise<void>

  // Cost item CRUD
  createCostItem: (data: CreateCostItemRequest) => Promise<CostItem>
  updateCostItem: (id: number, data: UpdateCostItemRequest) => Promise<CostItem>
  deleteCostItem: (id: number) => Promise<void>

  // Utilities
  setSelectedCategory: (categoryId: number | null) => void
  setSearchTerm: (term: string) => void
  clearError: () => void
  getSubElementsByCategory: (categoryId: number) => CostSubElement[]
  getCostItemsBySubElement: (subElementId: number) => CostItem[]
  searchCostItems: (term: string) => CostItem[]
}

export const useCostItemsStore = create<CostItemsState>((set, get) => ({
  // Initial state
  categories: [],
  subElements: [],
  costItems: [],
  units: [],
  isLoading: false,
  error: null,
  selectedCategoryId: null,
  searchTerm: '',

  // Fetch categories
  fetchCategories: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await costItemsAPI.getCategories()
      set({ categories: response.data.data || response.data, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
      set({ error: errorMessage, isLoading: false })
    }
  },

  // Fetch sub-elements
  fetchSubElements: async (categoryId?: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = categoryId
        ? await costItemsAPI.getSubElementsByCategory(categoryId)
        : await costItemsAPI.getSubElements()
      set({ subElements: response.data.data || response.data, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sub-elements'
      set({ error: errorMessage, isLoading: false })
    }
  },

  // Fetch cost items
  fetchCostItems: async (filters?: CostItemFilter) => {
    set({ isLoading: true, error: null })
    try {
      const response = await costItemsAPI.getCostItems(filters)
      set({ costItems: response.data.data || response.data, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cost items'
      set({ error: errorMessage, isLoading: false })
    }
  },

  // Fetch units
  fetchUnits: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await costItemsAPI.getUnits()
      set({ units: response.data.data || response.data, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch units'
      set({ error: errorMessage, isLoading: false })
    }
  },

  // Create category
  createCategory: async (data: CreateCostCategoryRequest) => {
    try {
      const response = await costItemsAPI.createCategory(data)
      set((state) => ({
        categories: [...state.categories, response.data.data || response.data],
      }))
      return response.data.data || response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category'
      set({ error: errorMessage })
      throw err
    }
  },

  // Update category
  updateCategory: async (id: number, data: UpdateCostCategoryRequest) => {
    try {
      const response = await costItemsAPI.updateCategory(id, data)
      set((state) => ({
        categories: state.categories.map((cat) => (cat.id === id ? (response.data.data || response.data) : cat)),
      }))
      return response.data.data || response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category'
      set({ error: errorMessage })
      throw err
    }
  },

  // Delete category
  deleteCategory: async (id: number) => {
    try {
      await costItemsAPI.deleteCategory(id)
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      set({ error: errorMessage })
      throw err
    }
  },

  // Create sub-element
  createSubElement: async (data: CreateCostSubElementRequest) => {
    try {
      const response = await costItemsAPI.createSubElement(data)
      set((state) => ({
        subElements: [...state.subElements, response.data.data || response.data],
      }))
      return response.data.data || response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sub-element'
      set({ error: errorMessage })
      throw err
    }
  },

  // Update sub-element
  updateSubElement: async (id: number, data: UpdateCostSubElementRequest) => {
    try {
      const response = await costItemsAPI.updateSubElement(id, data)
      set((state) => ({
        subElements: state.subElements.map((se) => (se.id === id ? (response.data.data || response.data) : se)),
      }))
      return response.data.data || response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update sub-element'
      set({ error: errorMessage })
      throw err
    }
  },

  // Delete sub-element
  deleteSubElement: async (id: number) => {
    try {
      await costItemsAPI.deleteSubElement(id)
      set((state) => ({
        subElements: state.subElements.filter((se) => se.id !== id),
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sub-element'
      set({ error: errorMessage })
      throw err
    }
  },

  // Create cost item
  createCostItem: async (data: CreateCostItemRequest) => {
    try {
      const response = await costItemsAPI.createCostItem(data)
      set((state) => ({
        costItems: [...state.costItems, response.data.data || response.data],
      }))
      return response.data.data || response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create cost item'
      set({ error: errorMessage })
      throw err
    }
  },

  // Update cost item
  updateCostItem: async (id: number, data: UpdateCostItemRequest) => {
    try {
      const response = await costItemsAPI.updateCostItem(id, data)
      set((state) => ({
        costItems: state.costItems.map((item) => (item.id === id ? (response.data.data || response.data) : item)),
      }))
      return response.data.data || response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cost item'
      set({ error: errorMessage })
      throw err
    }
  },

  // Delete cost item
  deleteCostItem: async (id: number) => {
    try {
      await costItemsAPI.deleteCostItem(id)
      set((state) => ({
        costItems: state.costItems.filter((item) => item.id !== id),
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cost item'
      set({ error: errorMessage })
      throw err
    }
  },

  // Set selected category
  setSelectedCategory: (categoryId: number | null) => {
    set({ selectedCategoryId: categoryId })
  },

  // Set search term
  setSearchTerm: (term: string) => {
    set({ searchTerm: term })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Get sub-elements by category
  getSubElementsByCategory: (categoryId: number) => {
    return get().subElements.filter((se) => se.category_id === categoryId)
  },

  // Get cost items by sub-element
  getCostItemsBySubElement: (subElementId: number) => {
    return get().costItems.filter((item) => item.sub_element_id === subElementId)
  },

  // Search cost items
  searchCostItems: (term: string) => {
    const lowerTerm = term.toLowerCase()
    return get().costItems.filter(
      (item) =>
        item.description.toLowerCase().includes(lowerTerm) ||
        item.code.toLowerCase().includes(lowerTerm)
    )
  },
}))
