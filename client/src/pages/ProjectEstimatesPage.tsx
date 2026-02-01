import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectsStore } from '../stores/projectsStore'
import { useEstimatesStore } from '../stores/estimatesStore'
import { useEstimateTemplatesStore } from '../stores/estimateTemplatesStore'
import { useNRM2Store } from '../stores/nrm2Store'
import { costItemsAPI, unitsAPI } from '../services/api'
import BackButton from '../components/ui/BackButton'
import UnifiedAddLineItemModal from '../components/modals/UnifiedAddLineItemModal'
import LineItemsTable from '../components/estimates/LineItemsTable'
import ExportPDFButton from '../components/estimates/ExportPDFButton'
import SaveAsTemplateDialog from '../components/estimates/SaveAsTemplateDialog'
import TemplateLibraryModal from '../components/estimates/TemplateLibraryModal'
import { useToast } from '../components/ui/ToastContainer'
import { handleApiError, logError } from '../utils/errorHandler'
import BOQBrowserModal from '../components/boq/BOQBrowserModal'
import type { EstimateTemplate } from '../types/estimateTemplate'

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

  const { currentProject, fetchProjectById, isLoading: projectLoading } = useProjectsStore()
  const { estimates, estimateTotals, isLoading: estimatesLoading, error, fetchEstimates, addEstimate, updateEstimate, deleteEstimate } = useEstimatesStore()
  const { saveTemplate, applyTemplate } = useEstimateTemplatesStore()
  const { pendingWorkSection, setPendingWorkSection } = useNRM2Store()

  const [showAddModal, setShowAddModal] = useState(false)
  const [initialNRM2Code, setInitialNRM2Code] = useState<string | null>(null)
  const [initialNRM2WorkSectionId, setInitialNRM2WorkSectionId] = useState<number | null>(null)
  const [showBOQBrowser, setShowBOQBrowser] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [costItemsLoading, setCostItemsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissedError, setDismissedError] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)

  // Fetch project and estimates
  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId)
      fetchEstimates(projectId)
      fetchCostItems()
      fetchUnits()
      fetchCategories()
    }
  }, [projectId, fetchProjectById, fetchEstimates])

  // Check for pending NRM 2 work section and open modal
  useEffect(() => {
    if (pendingWorkSection && !showAddModal) {
      setInitialNRM2Code(pendingWorkSection.code)
      setShowAddModal(true)
      // Clear the pending work section after opening the modal
      setPendingWorkSection(null)
    }
  }, [pendingWorkSection, showAddModal, setPendingWorkSection])

  // Fetch cost items from backend
  const fetchCostItems = async () => {
    setCostItemsLoading(true)
    try {
      const response = await costItemsAPI.getAll()
      setCostItems(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch cost items:', err)
    } finally {
      setCostItemsLoading(false)
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

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await costItemsAPI.getCategories()
      setCategories(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
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
      setShowAddModal(false)
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
      setShowAddModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBOQItemSelected = (workSection: {
    id: number
    code: string
    title: string
    description?: string
    unit?: string
  }) => {
    // Pre-fill the add modal with NRM 2 data
    setInitialNRM2Code(workSection.code)
    setInitialNRM2WorkSectionId(workSection.id)
    setShowBOQBrowser(false)
    setShowAddModal(true)
  }

  const handleUpdateEstimate = async (estimateId: number, newQuantity: number) => {
    try {
      setSubmitting(true)
      await updateEstimate(projectId, estimateId, {
        quantity: newQuantity,
      })
      toast.success('Quantity updated successfully')
      setEditingId(null)
      setEditQuantity('')
      setSubmitting(false)
    } catch (error) {
      logError(error, 'UpdateEstimate')
      toast.error(handleApiError(error))
      setSubmitting(false)
    }
  }

  const handleDeleteEstimate = async (estimateId: number) => {
    if (window.confirm('Remove this item from the estimate?')) {
      try {
        setSubmitting(true)
        await deleteEstimate(projectId, estimateId)
        toast.success('Item removed successfully')
        setSubmitting(false)
      } catch (error) {
        logError(error, 'DeleteEstimate')
        toast.error(handleApiError(error))
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

  const isLoading = projectLoading || estimatesLoading || costItemsLoading

  if (isLoading && !currentProject) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>
  }

  if (!currentProject) {
    return <div className="text-center py-12">Project not found</div>
  }

  // Group estimates by category
  const estimatesByCategory = estimateTotals?.categories || []

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-khc-primary">Build Estimate</h1>
          <p className="text-gray-600 mt-2">{currentProject.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setShowTemplateLibrary(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm"
            title="Load a saved estimate template"
          >
            📚 Load Template
          </button>
          <button
            onClick={() => setShowBOQBrowser(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm"
            title="Import items from NRM 2 BOQ"
          >
            📋 Import from BOQ
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg flex items-center gap-2"
          >
            ➕ Add Line Item
          </button>
          {estimates.length > 0 && (
            <>
              <button
                onClick={() => setShowSaveTemplateDialog(true)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm"
                title="Save current estimate as template"
              >
                💾 Save Template
              </button>
              <ExportPDFButton
                projectId={projectId}
                projectName={currentProject.name}
                isDisabled={estimates.length === 0}
              />
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

      {/* BOQ Browser Modal */}
      <BOQBrowserModal
        isOpen={showBOQBrowser}
        onClose={() => setShowBOQBrowser(false)}
        onSelectItem={handleBOQItemSelected}
      />

      {/* Unified Add Line Item Modal */}
      <UnifiedAddLineItemModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setInitialNRM2Code(null)
          setInitialNRM2WorkSectionId(null)
        }}
        onAddFromLibrary={handleAddFromLibrary}
        onAddCustom={handleAddCustom}
        costItems={costItems}
        categories={categories}
        units={units}
        isSubmitting={submitting}
        costItemsLoading={costItemsLoading}
        initialNRM2Code={initialNRM2Code}
        initialNRM2WorkSectionId={initialNRM2WorkSectionId}
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

      {/* Line Items Section */}
      <LineItemsTable
        categories={estimatesByCategory}
        onUpdateQuantity={handleUpdateEstimate}
        onDeleteItem={handleDeleteEstimate}
        isLoading={estimatesLoading}
        isEmpty={estimates.length === 0}
      />


      {/* Totals Summary */}
      {estimateTotals && (
        <div className="bg-khc-light rounded-lg p-6 border border-khc-primary">
          <h3 className="font-bold text-lg text-khc-primary mb-4">Estimate Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">
                £{estimateTotals.subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Contingency ({estimateTotals.contingency_percentage}%):</span>
              <span className="font-semibold">
                £{estimateTotals.contingency_amount.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t border-khc-primary pt-3">
              <span className="font-bold text-khc-primary">Grand Total:</span>
              <span className="font-bold text-khc-primary text-lg">
                £{estimateTotals.grand_total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
              </span>
            </div>
            {estimateTotals.cost_per_m2 && (
              <div className="text-sm text-gray-600 text-right pt-2">
                £{estimateTotals.cost_per_m2.toLocaleString('en-GB', { maximumFractionDigits: 2 })} per m²
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
