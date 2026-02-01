import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjectsStore } from '../stores/projectsStore'
import { useEstimatesStore } from '../stores/estimatesStore'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import BackButton from '../components/ui/BackButton'
import ExportPDFButton from '../components/estimates/ExportPDFButton'
import BudgetTracker from '../components/projects/BudgetTracker'
import ProjectNotesPanel from '../components/projects/ProjectNotesPanel'
import { useToast } from '../components/ui/ToastContainer'
import { handleApiError, logError } from '../utils/errorHandler'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const { addRecent } = useRecentlyViewed()
  const projectId = Number(id)

  const { currentProject, isLoading: projectLoading, error: projectError, fetchProjectById } = useProjectsStore()
  const { estimateTotals, isLoading: estimatesLoading, error: estimatesError, fetchEstimateSummary, clearEstimates } = useEstimatesStore()

  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [projectNotes, setProjectNotes] = useState<any[]>([])

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId)
      fetchEstimateSummary(projectId)
    }
    return () => {
      clearEstimates()
    }
  }, [projectId, fetchProjectById, fetchEstimateSummary, clearEstimates])

  // Track recently viewed project
  useEffect(() => {
    if (currentProject?.name) {
      addRecent(projectId, currentProject.name)
    }
  }, [projectId, currentProject?.name, addRecent])

  const { submitEstimate, approveEstimate, rejectEstimate } = useProjectsStore()

  const handleSubmitEstimate = async () => {
    if (!projectId) return
    try {
      setSubmitting(true)
      await submitEstimate(projectId)
      // Refresh project and estimate
      await fetchProjectById(projectId)
      await fetchEstimateSummary(projectId)
      toast.success('Estimate submitted for approval')
      setSubmitting(false)
    } catch (error) {
      logError(error, 'SubmitEstimate')
      toast.error(handleApiError(error))
      setSubmitting(false)
    }
  }

  const handleApproveEstimate = async () => {
    if (!projectId) return
    try {
      setSubmitting(true)
      await approveEstimate(projectId, approvalNotes)
      await fetchProjectById(projectId)
      await fetchEstimateSummary(projectId)
      toast.success('Estimate approved successfully')
      setShowApprovalModal(false)
      setApprovalNotes('')
      setSubmitting(false)
    } catch (error) {
      logError(error, 'ApproveEstimate')
      toast.error(handleApiError(error))
      setSubmitting(false)
    }
  }

  const handleRejectEstimate = async () => {
    if (!projectId) return
    try {
      setSubmitting(true)
      await rejectEstimate(projectId, rejectionReason)
      await fetchProjectById(projectId)
      await fetchEstimateSummary(projectId)
      toast.success('Estimate rejected')
      setShowRejectionModal(false)
      setRejectionReason('')
      setSubmitting(false)
    } catch (error) {
      logError(error, 'RejectEstimate')
      toast.error(handleApiError(error))
      setSubmitting(false)
    }
  }

  const handleAddNote = async (content: string) => {
    const newNote = {
      id: Date.now().toString(),
      author: user?.username || 'Unknown',
      content,
      createdAt: new Date().toISOString(),
    }
    setProjectNotes([newNote, ...projectNotes])
    toast.success('Note added successfully')
  }

  const handleDeleteNote = async (noteId: string) => {
    setProjectNotes(projectNotes.filter(note => note.id !== noteId))
    toast.success('Note deleted successfully')
  }

  const isLoading = projectLoading || estimatesLoading
  const error = projectError || estimatesError
  const canEdit = !projectLoading && currentProject && (isAdmin || user?.id === currentProject.created_by)
  const canApprove = isAdmin && currentProject?.estimate_status === 'submitted'
  const canReject = isAdmin && currentProject?.estimate_status === 'submitted'
  const canSubmit = !projectLoading && currentProject && (user?.id === currentProject.created_by || isAdmin) && currentProject.estimate_status === 'draft'

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600">Loading project...</div>
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Project not found</p>
        <Link to="/projects" className="text-khc-primary hover:underline">
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-khc-primary">{currentProject.name}</h1>
          <p className="text-gray-600 mt-2">{currentProject.project_address || currentProject.description || 'No address provided'}</p>
        </div>
        <div className="flex gap-2">
          {estimateTotals && estimateTotals.grand_total > 0 && (
            <ExportPDFButton
              projectId={projectId}
              projectName={currentProject.name}
            />
          )}
          {canEdit && (
            <Link
              to={`/projects/${projectId}/edit`}
              className="px-4 py-2 border border-khc-primary text-khc-primary hover:bg-khc-light rounded-lg transition"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Project Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-semibold text-khc-primary mt-1">{currentProject.status}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Estimate Status</p>
          <p className={`text-lg font-semibold mt-1 ${
            currentProject.estimate_status === 'approved'
              ? 'text-green-600'
              : currentProject.estimate_status === 'submitted'
              ? 'text-blue-600'
              : currentProject.estimate_status === 'rejected'
              ? 'text-red-600'
              : 'text-gray-600'
          }`}>
            {currentProject.estimate_status}
          </p>
        </div>
        {currentProject.budget_cost && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Budget Cost</p>
            <p className="text-lg font-semibold text-khc-primary mt-1">£{currentProject.budget_cost.toLocaleString()}</p>
          </div>
        )}
        {currentProject.start_date && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-lg font-semibold text-khc-primary mt-1">{new Date(currentProject.start_date).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Budget Tracker */}
      {currentProject.budget_cost && estimateTotals && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-khc-primary mb-4">Budget Overview</h3>
          <BudgetTracker
            budgetCost={currentProject.budget_cost}
            actualCost={estimateTotals.grand_total}
            contingencyAmount={estimateTotals.contingency_amount}
          />
        </div>
      )}

      {/* Project Description */}
      {currentProject.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-khc-primary mb-2">Description</h3>
          <p className="text-gray-700">{currentProject.description}</p>
        </div>
      )}

      {/* Estimate Summary */}
      {estimateTotals && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-khc-primary">Estimate Summary</h2>
            <Link
              to={`/projects/${projectId}/estimates`}
              className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg transition"
            >
              Manage Estimates
            </Link>
          </div>

          {/* Categories Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Cost Breakdown by Category</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Items</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Subtotal</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Contractor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {estimateTotals.categories.map((category) => (
                    <tr key={category.category_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{category.category_name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{category.line_count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-khc-primary">
                        £{category.subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        £{category.contractor_items_subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">£{estimateTotals.subtotal.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Contingency ({estimateTotals.contingency_percentage}%):</span>
                <span className="font-semibold">£{estimateTotals.contingency_amount.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-3">
                <span className="font-bold text-khc-primary">Grand Total:</span>
                <span className="font-bold text-khc-primary text-xl">
                  £{estimateTotals.grand_total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {estimateTotals.floor_area_m2 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Cost per m²:</span>
                  <span className="font-semibold">
                    £{estimateTotals.cost_per_m2?.toLocaleString('en-GB', { maximumFractionDigits: 2 })} / m²
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700">Volunteer Cost:</span>
                <span className="font-semibold">£{estimateTotals.volunteer_cost_total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Contractor Cost:</span>
                <span className="font-semibold">£{estimateTotals.contractor_cost_total.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(canSubmit || canApprove || canReject) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-khc-primary mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {canSubmit && (
              <button
                onClick={handleSubmitEstimate}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit Estimate for Approval'}
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                Approve Estimate
              </button>
            )}
            {canReject && (
              <button
                onClick={() => setShowRejectionModal(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Reject Estimate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Project Notes */}
      <ProjectNotesPanel
        projectId={projectId}
        notes={projectNotes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
      />

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Approve Estimate</h3>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add approval notes (optional)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-khc-primary"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovalNotes('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveEstimate}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400"
              >
                {submitting ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Reject Estimate</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-khc-primary"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectionModal(false)
                  setRejectionReason('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectEstimate}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-gray-400"
              >
                {submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
