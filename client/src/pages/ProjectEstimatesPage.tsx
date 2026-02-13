import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectsStore } from '../stores/projectsStore'
import { useEstimatesStore } from '../stores/estimatesStore'
import { useEstimateTemplatesStore } from '../stores/estimateTemplatesStore'
import { useNRM2Store } from '../stores/nrm2Store'
import { costItemsAPI, unitsAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import BackButton from '../components/ui/BackButton'
import UnifiedAddLineItemModal from '../components/modals/UnifiedAddLineItemModal'
import BoQLibraryModal from '../components/modals/BoQLibraryModal'
import LineItemsTable from '../components/estimates/LineItemsTable'
import SectionPageView from '../components/estimates/SectionPageView'
import CollectionPageView from '../components/estimates/CollectionPageView'
import SummaryPageView from '../components/estimates/SummaryPageView'
import ExportPDFButton from '../components/estimates/ExportPDFButton'
import SaveAsTemplateDialog from '../components/estimates/SaveAsTemplateDialog'
import TemplateLibraryModal from '../components/estimates/TemplateLibraryModal'
import { useToast } from '../components/ui/ToastContainer'
import { handleApiError, logError } from '../utils/errorHandler'
import type { EstimateTemplate } from '../types/estimateTemplate'
import type { BCISGroupedEstimates } from '../types/estimate'

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

export default function ProjectEstimatesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const projectId = Number(id)

  const { currentProject, fetchProjectById, fetchProjects, isLoading: projectLoading } = useProjectsStore()
  const { estimates, estimateTotals, isLoading: estimatesLoading, error, fetchEstimates, addEstimate, updateEstimate, deleteEstimate } = useEstimatesStore()
  const { saveTemplate, applyTemplate } = useEstimateTemplatesStore()
  const { pendingWorkSection, setPendingWorkSection } = useNRM2Store()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showBoQLibrary, setShowBoQLibrary] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editRate, setEditRate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissedError, setDismissedError] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [bcisGroupedData, setBcisGroupedData] = useState<BCISGroupedEstimates | null>(null)
  const [bcisLoading, setBcisLoading] = useState(false)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [viewMode, setViewMode] = useState<'bcis' | 'section' | 'collection' | 'summary'>('bcis')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  // Fetch project and estimates
  useEffect(() => {
    if (projectId) {
      console.log('ProjectEstimatesPage: Loading data for project', projectId)
      fetchProjectById(projectId)
      fetchEstimates(projectId)
      fetchUnits()
      // BCIS data fetch (don't await, let it complete in background)
      fetchBCISGroupedData()
    }
  }, [projectId])

  // Fetch BCIS grouped estimates
  const fetchBCISGroupedData = async () => {
    try {
      setBcisLoading(true)
      // Use 'accessToken' key (same as axios interceptors in api.ts)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        console.error('No auth token found in localStorage - user may not be logged in')
        setBcisGroupedData(null)
        return
      }

      const response = await fetch(`/api/v1/projects/${projectId}/estimates/by-bcis-element`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('BCIS data loaded:', data.data)
        setBcisGroupedData(data.data)
      } else if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed - token may be invalid or expired. Status:', response.status)
        setBcisGroupedData(null)
        toast.error('Session expired - please refresh the page and log in again')
      } else {
        console.error('Failed to fetch BCIS grouped data: HTTP', response.status)
        setBcisGroupedData(null)
      }
    } catch (err) {
      console.error('Failed to fetch BCIS grouped data:', err)
      setBcisGroupedData(null)
    } finally {
      setBcisLoading(false)
    }
  }

  // Fetch units from backend
  const fetchUnits = async () => {
    try {
      const response = await unitsAPI.getAll()
      setUnits(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch units:', err)
    }
  }

  const handleAddFromLibrary = async (data: {
    cost_item_id: number
    quantity: number
    unit_cost_override?: number
    notes?: string
  }) => {
    try {
      setSubmitting(true)
      await addEstimate(projectId, {
        cost_item_id: data.cost_item_id,
        quantity: data.quantity,
        unit_cost_override: data.unit_cost_override,
        notes: data.notes,
      })
      await fetchBCISGroupedData()
      await fetchProjects()
      setShowAddModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddFromBoQ = async (items: any[]) => {
    try {
      setSubmitting(true)
      // Get first category as default (optional for BoQ items)
      const defaultCategoryId = categories.length > 0 ? categories[0].id : undefined

      let addedCount = 0
      for (const item of items) {
        try {
          const estimateData: any = {
            custom_description: item.description,
            quantity: item.quantity || 0,
            custom_unit: item.unit,
            custom_unit_rate: item.standard_rate,
            notes: `From BoQ Library - ${item.item_number}`,
            // Elemental estimate fields
            section_name: item.section_name || 'General',
            page_number: item.page_number || 1,
            is_page_complete: false,
          }
          // Only add category_id if a category exists
          if (defaultCategoryId) {
            estimateData.category_id = defaultCategoryId
          }

          await addEstimate(projectId, estimateData)
          addedCount++
        } catch (itemError: any) {
          console.error(`Failed to add item ${item.item_number}:`, itemError)
          toast.error(`Failed to add "${item.description}": ${itemError.response?.data?.error || itemError.message}`)
        }
      }

      if (addedCount > 0) {
        // Force hard refresh to ensure UI consistency
        // Wait a moment to allow backend to finalize
        await new Promise(resolve => setTimeout(resolve, 500))
        // Hard refresh all data
        await fetchEstimates(projectId)
        await fetchBCISGroupedData()
        await fetchProjects()
        toast.success(`Added ${addedCount} of ${items.length} item(s) to estimate`)
        setShowBoQLibrary(false)
      }
    } catch (error) {
      console.error('Error in handleAddFromBoQ:', error)
      logError(error, 'AddFromBoQ')
      toast.error(handleApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddCustom = async (data: {
    custom_description: string
    quantity: number
    custom_unit: string
    custom_unit_rate: number
    category_id: number
    notes?: string
    nrm2_work_section_id?: number
    nrm2_code?: string
  }) => {
    try {
      setSubmitting(true)
      await addEstimate(projectId, {
        custom_description: data.custom_description,
        quantity: data.quantity,
        custom_unit: data.custom_unit,
        custom_unit_rate: data.custom_unit_rate,
        category_id: data.category_id,
        notes: data.notes,
        nrm2_work_section_id: data.nrm2_work_section_id,
        nrm2_code: data.nrm2_code,
      })
      await fetchBCISGroupedData()
      await fetchProjects()
      setShowAddModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateEstimate = async (estimateId: number, updates: any) => {
    try {
      setSubmitting(true)
      await updateEstimate(projectId, estimateId, updates)
      await fetchBCISGroupedData()
      await fetchProjects()
      toast.success('Item updated successfully')
      setEditingId(null)
      setEditQuantity('')
      setEditDescription('')
      setEditUnit('')
      setEditRate('')
      setEditNotes('')
      setSubmitting(false)
    } catch (error) {
      logError(error, 'UpdateEstimate')
      toast.error(handleApiError(error))
      setSubmitting(false)
    }
  }

  const handleSectionUpdateQuantity = async (estimateId: number, newQuantity: number) => {
    await handleUpdateEstimate(estimateId, { quantity: newQuantity })
  }

  const handleDeleteEstimate = async (estimateId: number) => {
    if (window.confirm('Remove this item from the estimate?')) {
      try {
        setSubmitting(true)
        await deleteEstimate(projectId, estimateId)
        await fetchBCISGroupedData()
        await fetchProjects()
        toast.success('Item removed successfully')
        setSubmitting(false)
      } catch (error) {
        logError(error, 'DeleteEstimate')
        toast.error(handleApiError(error))
        setSubmitting(false)
      }
    }
  }

  const handleDeleteAllEstimates = async () => {
    if (window.confirm(`Delete all ${estimates.length} items from this estimate? This cannot be undone.`)) {
      try {
        setSubmitting(true)
        let deletedCount = 0
        for (const estimate of estimates) {
          try {
            await deleteEstimate(projectId, estimate.id)
            deletedCount++
          } catch (err) {
            console.error(`Failed to delete estimate ${estimate.id}:`, err)
          }
        }
        await fetchEstimates(projectId)
        await fetchBCISGroupedData()
        await fetchProjects()
        toast.success(`Deleted ${deletedCount} item(s) from estimate`)
        setSubmitting(false)
      } catch (error) {
        logError(error, 'DeleteAllEstimates')
        toast.error(handleApiError(error))
        setSubmitting(false)
      }
    }
  }

  const getEstimateIdFromComponent = (componentId: number): number | null => {
    if (!bcisGroupedData) return null
    for (const element of bcisGroupedData.elements) {
      for (const item of element.items) {
        for (const component of Object.values(item.components)) {
          if (component && component.id === componentId) {
            return item.id
          }
        }
      }
    }
    return null
  }

  const handleUpdateComponent = async (componentId: number, unitRate: number, wasteFactor: number) => {
    const estimateId = getEstimateIdFromComponent(componentId)
    if (!estimateId) {
      toast.error('Could not find estimate for this component')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(
        `/api/v1/projects/${projectId}/estimates/${estimateId}/cost-components/${componentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            unit_rate: unitRate,
            waste_factor: wasteFactor
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Update component failed:', response.status, errorData)
        throw new Error(errorData.error || `Failed to update component (HTTP ${response.status})`)
      }

      await fetchBCISGroupedData()
      await fetchProjects()
      toast.success('Cost component updated')
      setSubmitting(false)
    } catch (error) {
      console.error('UpdateComponent error:', error)
      logError(error, 'UpdateComponent')
      toast.error(handleApiError(error) || 'Failed to update component')
      setSubmitting(false)
    }
  }

  const handleAddComponent = async (estimateId: number, componentType: 'material' | 'labor' | 'plant', unitRate: number, wasteFactor: number) => {
    try {
      setSubmitting(true)
      const token = localStorage.getItem('accessToken')
      console.log('AddComponent - Token exists:', !!token, 'Token length:', token?.length)
      const response = await fetch(
        `/api/v1/projects/${projectId}/estimates/${estimateId}/cost-components`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            component_type: componentType,
            unit_rate: unitRate,
            waste_factor: wasteFactor
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Add component failed:', response.status, errorData)
        throw new Error(errorData.error || `Failed to add component (HTTP ${response.status})`)
      }

      await fetchBCISGroupedData()
      await fetchProjects()
      toast.success(`${componentType.charAt(0).toUpperCase() + componentType.slice(1)} cost component added`)
      setSubmitting(false)
    } catch (error) {
      console.error('AddComponent error:', error)
      logError(error, 'AddComponent')
      toast.error(handleApiError(error) || 'Failed to add component')
      setSubmitting(false)
    }
  }

  const handleDeleteComponent = async (componentId: number) => {
    const estimateId = getEstimateIdFromComponent(componentId)
    if (!estimateId) {
      toast.error('Could not find estimate for this component')
      return
    }

    if (window.confirm('Remove this cost component?')) {
      try {
        setSubmitting(true)
        const response = await fetch(
          `/api/v1/projects/${projectId}/estimates/${estimateId}/cost-components/${componentId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Delete component failed:', response.status, errorData)
          throw new Error(errorData.error || `Failed to delete component (HTTP ${response.status})`)
        }

        await fetchBCISGroupedData()
        await fetchProjects()
        toast.success('Cost component removed')
        setSubmitting(false)
      } catch (error) {
        console.error('DeleteComponent error:', error)
        logError(error, 'DeleteComponent')
        toast.error(handleApiError(error) || 'Failed to delete component')
        setSubmitting(false)
      }
    }
  }

  const handleSaveAsTemplate = async (
    name: string,
    description: string,
    templateType: string,
    isPublic: boolean
  ) => {
    try {
      setTemplateLoading(true)

      // Build line items from current estimates
      const lineItems = estimates.map((est) => ({
        cost_item_id: est.cost_item_id || undefined,
        custom_description: est.custom_description || undefined,
        custom_unit_rate: est.custom_unit_rate || undefined,
        custom_unit: est.custom_unit || undefined,
        category_id: est.category_id || undefined,
        quantity: est.quantity,
        unit_cost_override: est.unit_cost_override || undefined,
        notes: est.notes || undefined,
      }))

      await saveTemplate({
        name,
        description,
        template_type: templateType as 'quick' | 'standard' | 'complex',
        is_public: isPublic,
        line_items: lineItems,
      })

      toast.success('Template saved successfully')
      setShowSaveTemplateDialog(false)
    } catch (error) {
      logError(error, 'SaveTemplate')
      toast.error('Failed to save template')
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleLoadTemplate = async (template: EstimateTemplate) => {
    try {
      setTemplateLoading(true)

      // Fetch template with line items
      await applyTemplate(template.id, projectId)

      // User will see the template and add items with quantities
      toast.success(`Template "${template.name}" loaded. Add quantities to create estimates.`)
    } catch (error) {
      logError(error, 'LoadTemplate')
      toast.error('Failed to load template')
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleMarkPageComplete = async (pageKey: string, isComplete: boolean) => {
    try {
      setSubmitting(true)
      // Parse pageKey format: "section_name-page_number"
      const lastDashIndex = pageKey.lastIndexOf('-')
      const sectionName = pageKey.substring(0, lastDashIndex)
      const pageNumber = parseInt(pageKey.substring(lastDashIndex + 1), 10)

      // Find all estimates with matching section_name and page_number
      const matchingEstimates = estimates.filter(
        (est) => est.section_name === sectionName && est.page_number === pageNumber
      )

      // Update each matching estimate
      let updatedCount = 0
      for (const estimate of matchingEstimates) {
        try {
          await updateEstimate(projectId, estimate.id, { is_page_complete: isComplete })
          updatedCount++
        } catch (err) {
          console.error(`Failed to update estimate ${estimate.id}:`, err)
        }
      }

      // Re-fetch estimates after all updates
      await fetchEstimates(projectId)
      await fetchBCISGroupedData()
      await fetchProjects()

      if (updatedCount > 0) {
        toast.success(
          isComplete
            ? `Page marked as complete (${updatedCount} item${updatedCount !== 1 ? 's' : ''})`
            : `Page marked as incomplete (${updatedCount} item${updatedCount !== 1 ? 's' : ''})`
        )
      }
      setSubmitting(false)
    } catch (error) {
      logError(error, 'MarkPageComplete')
      toast.error(handleApiError(error))
      setSubmitting(false)
    }
  }

  const handleDrillIntoSection = (sectionName: string) => {
    setSelectedSection(sectionName)
    setViewMode('collection')
    toast.info(`Viewing collection page for ${sectionName}`)
  }

  const isLoading = projectLoading || estimatesLoading

  if (isLoading && !currentProject) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>
  }

  if (!currentProject) {
    return <div className="text-center py-12">Project not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-khc-primary">Build Estimate</h1>
          <p className="text-gray-600 mt-2">{currentProject.name}</p>
          <p className="text-xs text-gray-500 mt-1">Project ID: {projectId}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end relative">
          {/* Estimate Templates Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm"
              title="Manage estimate templates"
            >
              📚 Estimate Templates
              <span className="text-xs">▼</span>
            </button>
            {showTemplateMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                <button
                  onClick={() => {
                    setShowTemplateLibrary(true)
                    setShowTemplateMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-900 text-sm border-b border-gray-100"
                >
                  📚 Load Template
                </button>
                {estimates.length > 0 && (
                  <button
                    onClick={() => {
                      setShowSaveTemplateDialog(true)
                      setShowTemplateMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-900 text-sm"
                  >
                    💾 Save Template
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg flex items-center gap-2"
            >
              ➕ Add Line Item
            </button>
            <button
              onClick={() => setShowBoQLibrary(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              📚 Add from BoQ Library
            </button>
          </div>
          {estimates.length > 0 && (
            <>
              <ExportPDFButton
                projectId={projectId}
                projectName={currentProject.name}
                isDisabled={estimates.length === 0}
              />
              <button
                onClick={handleDeleteAllEstimates}
                disabled={submitting || estimates.length === 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Delete all estimates from this project"
              >
                🗑️ Delete All
              </button>
            </>
          )}
        </div>
      </div>

      {error && !dismissedError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setDismissedError(true)}
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* View Mode Selector */}
      {estimates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold text-gray-700">View Mode:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode('bcis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'bcis'
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 NRM 2
              </button>
              <button
                onClick={() => setViewMode('section')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'section'
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📑 Section Pages
              </button>
              <button
                onClick={() => setViewMode('collection')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'collection'
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 Collection Pages
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'summary'
                    ? 'bg-khc-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📈 Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Add Line Item Modal */}
      <UnifiedAddLineItemModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
        }}
        onAddFromLibrary={handleAddFromLibrary}
        onAddCustom={handleAddCustom}
        costItems={costItems}
        categories={categories}
        units={units}
        isSubmitting={submitting}
        costItemsLoading={false}
      />

      {/* BoQ Library Modal */}
      <BoQLibraryModal
        isOpen={showBoQLibrary}
        onClose={() => setShowBoQLibrary(false)}
        onSelectItems={handleAddFromBoQ}
        projectId={projectId}
      />

      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        isOpen={showSaveTemplateDialog}
        onClose={() => setShowSaveTemplateDialog(false)}
        onSave={handleSaveAsTemplate}
        isLoading={templateLoading}
      />

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={handleLoadTemplate}
        showShared={true}
      />

      {/* Line Items Section - Choose view based on viewMode */}
      {viewMode === 'bcis' && (
        <LineItemsTable
          data={bcisGroupedData}
          onUpdateQuantity={handleUpdateEstimate}
          onDeleteItem={handleDeleteEstimate}
          onUpdateComponent={handleUpdateComponent}
          onAddComponent={handleAddComponent}
          onDeleteComponent={handleDeleteComponent}
          isLoading={bcisLoading}
          isEmpty={!bcisGroupedData || bcisGroupedData.elements.length === 0}
        />
      )}

      {viewMode === 'section' && (
        <SectionPageView
          estimates={estimates}
          onUpdateQuantity={handleSectionUpdateQuantity}
          onDeleteItem={handleDeleteEstimate}
          onMarkPageComplete={handleMarkPageComplete}
          isLoading={estimatesLoading}
          isEmpty={estimates.length === 0}
        />
      )}

      {viewMode === 'collection' && (
        <CollectionPageView
          estimates={estimates}
          initialSection={selectedSection || undefined}
          isLoading={estimatesLoading}
          isEmpty={estimates.length === 0}
        />
      )}

      {viewMode === 'summary' && (
        <SummaryPageView
          estimates={estimates}
          onDrillIntoSection={handleDrillIntoSection}
          isLoading={estimatesLoading}
          isEmpty={estimates.length === 0}
        />
      )}

      {/* Fallback: Show estimates if BCIS data is empty but estimates exist (only in BCIS view) */}
      {viewMode === 'bcis' && (!bcisGroupedData || bcisGroupedData.elements.length === 0) && estimates.length > 0 && (
        <div className="mt-8 bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">📋 Imported BoQ Items ({estimates.length})</h3>
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-sm border-collapse bg-white">
              <thead>
                <tr className="bg-khc-primary text-white sticky top-0">
                  <th className="px-3 py-3 text-center font-semibold border border-gray-300 w-12">Item No.</th>
                  <th className="px-4 py-3 text-left font-semibold border border-gray-300 min-w-64">Description</th>
                  <th className="px-3 py-3 text-center font-semibold border border-gray-300 w-20">Unit</th>
                  <th className="px-3 py-3 text-right font-semibold border border-gray-300 w-24">Quantity</th>
                  <th className="px-3 py-3 text-right font-semibold border border-gray-300 w-28">Rate (£)</th>
                  <th className="px-3 py-3 text-right font-semibold border border-gray-300 w-28">Amount (£)</th>
                  <th className="px-4 py-3 text-left font-semibold border border-gray-300 min-w-60">Notes</th>
                  <th className="px-3 py-3 text-center font-semibold border border-gray-300 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est, idx) => (
                  <tr key={est.id || idx} className={`border-b border-gray-300 transition-colors ${editingId === est.id ? 'bg-yellow-50' : 'hover:bg-blue-50'}`}>
                    <td className="px-3 py-3 text-gray-900 border border-gray-300 font-medium text-center align-top">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-900 border border-gray-300 align-top">
                      {editingId === est.id ? (
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      ) : (
                        <span className="break-words whitespace-pre-wrap">{est.custom_description || <span className="text-gray-400">—</span>}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700 border border-gray-300 text-center align-top">
                      {editingId === est.id ? (
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        />
                      ) : (
                        est.custom_unit || '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 border border-gray-300 align-top font-medium">
                      {editingId === est.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm"
                        />
                      ) : (
                        est.quantity
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700 border border-gray-300 align-top">
                      {editingId === est.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm"
                        />
                      ) : (
                        formatCurrency(est.custom_unit_rate || 0)
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900 border border-gray-300 align-top">{formatCurrency(est.line_total || 0)}</td>
                    <td className="px-4 py-3 text-gray-600 border border-gray-300 align-top text-sm">
                      {editingId === est.id ? (
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          rows={2}
                        />
                      ) : (
                        <span className="break-words whitespace-pre-wrap">{est.notes ? est.notes : <span className="text-gray-400">—</span>}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border border-gray-300 align-top text-center space-y-1">
                      {editingId === est.id ? (
                        <>
                          <button
                            onClick={() => {
                              const updates: any = {}
                              if (editDescription !== est.custom_description) updates.custom_description = editDescription
                              if (editUnit !== est.custom_unit) updates.custom_unit = editUnit
                              if (editQuantity !== est.quantity?.toString()) updates.quantity = parseFloat(editQuantity)
                              if (editRate !== est.custom_unit_rate?.toString()) updates.custom_unit_rate = parseFloat(editRate)
                              if (editNotes !== est.notes) updates.notes = editNotes
                              if (Object.keys(updates).length > 0) {
                                handleUpdateEstimate(est.id || 0, updates)
                              } else {
                                setEditingId(null)
                              }
                            }}
                            disabled={submitting}
                            className="block w-full px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors disabled:opacity-50"
                          >
                            ✅ Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              setEditQuantity('')
                              setEditDescription('')
                              setEditUnit('')
                              setEditRate('')
                              setEditNotes('')
                            }}
                            className="block w-full px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                          >
                            ✕ Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(est.id || null)
                              setEditDescription(est.custom_description || '')
                              setEditUnit(est.custom_unit || '')
                              setEditQuantity(est.quantity?.toString() || '')
                              setEditRate(est.custom_unit_rate?.toString() || '')
                              setEditNotes(est.notes || '')
                            }}
                            className="block w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEstimate(est.id || 0)}
                            className="block w-full px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm font-semibold text-gray-900">
              <span>TOTAL:</span>
              <span>{formatCurrency(
                estimates.reduce((sum, est) => sum + (est.line_total || 0), 0)
              )}</span>
            </div>
          </div>
        </div>
      )}


      {/* Totals Summary */}
      {estimateTotals && (
        <div className="bg-khc-light rounded-lg p-6 border border-khc-primary">
          <h3 className="font-bold text-lg text-khc-primary mb-4">Estimate Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">
                {formatCurrency(estimateTotals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Contingency ({estimateTotals.contingency_percentage}%):</span>
              <span className="font-semibold">
                {formatCurrency(estimateTotals.contingency_amount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-khc-primary pt-3">
              <span className="font-bold text-khc-primary">Grand Total:</span>
              <span className="font-bold text-khc-primary text-lg">
                {formatCurrency(estimateTotals.grand_total)}
              </span>
            </div>
            {estimateTotals.cost_per_m2 && (
              <div className="text-sm text-gray-600 text-right pt-2">
                {formatCurrency(estimateTotals.cost_per_m2)} per m²
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
