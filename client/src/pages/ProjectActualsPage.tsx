import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReportingStore } from '../stores/reportingStore'
import { useProjectsStore } from '../stores/projectsStore'
import { Card, Button, Modal, Input, LoadingSpinner, ErrorAlert } from '../components/ui'
import BackButton from '../components/ui/BackButton'
import { formatCurrency, formatDate } from '../utils/formatters'

interface ActualCostForm {
  actual_quantity: number
  actual_cost: number
  variance_reason: string
  completed_date: string
}

export default function ProjectActualsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const { projectActuals, isLoading, error, fetchProjectActuals, updateProjectActual, deleteProjectActual, clearError } = useReportingStore()
  const { currentProject, fetchProjectById } = useProjectsStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ActualCostForm>({
    actual_quantity: 0,
    actual_cost: 0,
    variance_reason: '',
    completed_date: new Date().toISOString().split('T')[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId)
      fetchProjectActuals(projectId)
    }
  }, [projectId, fetchProjectById, fetchProjectActuals])

  const handleOpenModal = (actualId?: number) => {
    if (actualId) {
      const actual = projectActuals.find((a) => a.id === actualId)
      if (actual) {
        setSelectedItemId(actualId)
        setFormData({
          actual_quantity: actual.actual_quantity,
          actual_cost: actual.actual_cost,
          variance_reason: actual.variance_reason || '',
          completed_date: actual.completed_date,
        })
      }
    } else {
      setSelectedItemId(null)
      setFormData({
        actual_quantity: 0,
        actual_cost: 0,
        variance_reason: '',
        completed_date: new Date().toISOString().split('T')[0],
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItemId(null)
    setFormData({
      actual_quantity: 0,
      actual_cost: 0,
      variance_reason: '',
      completed_date: new Date().toISOString().split('T')[0],
    })
  }

  const handleSubmitForm = async () => {
    if (formData.actual_quantity <= 0 || formData.actual_cost < 0) {
      return
    }

    try {
      setIsSubmitting(true)

      if (selectedItemId) {
        // Update existing actual
        await updateProjectActual(projectId, selectedItemId, {
          actual_quantity: formData.actual_quantity,
          actual_cost: formData.actual_cost,
          variance_reason: formData.variance_reason || undefined,
          completed_date: formData.completed_date,
        })
      } else {
        // TODO: When adding new actual, need to get cost_item_id from context
        // For now, this needs to be done differently - need to refactor to select cost item first
        console.warn('Adding new actual cost requires cost item selection')
      }

      setIsSubmitting(false)
      handleCloseModal()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Failed to save actual cost:', err)
    }
  }

  const handleDeleteActual = async (actualId: number) => {
    if (confirm('Are you sure you want to delete this actual cost record?')) {
      try {
        await deleteProjectActual(projectId, actualId)
      } catch (err) {
        console.error('Failed to delete actual cost:', err)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading project actuals..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-khc-primary">Project Actuals</h1>
        <p className="text-gray-600 mt-2">{currentProject?.name}</p>
        <p className="text-xs text-gray-500 mt-1">Project ID: {projectId}</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* Info Box */}
      <Card>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Record Actual Costs:</strong>
          </p>
          <p>
            Enter actual quantities and costs for completed work items. The system will calculate variances
            between estimated and actual costs to help track project performance.
          </p>
        </div>
      </Card>

      {/* Actuals List */}
      {projectActuals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No actual cost records yet</p>
          <p className="text-sm text-gray-500 mt-2">Complete project work items and record actual costs here</p>
        </div>
      ) : (
        <Card title="Recorded Actuals">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Completed Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actual Quantity</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actual Cost</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Variance Reason</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projectActuals.map((actual) => (
                  <tr key={actual.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{formatDate(actual.completed_date)}</td>
                    <td className="px-4 py-3 text-right">{actual.actual_quantity}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-khc-primary">
                      {formatCurrency(actual.actual_cost)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {actual.variance_reason || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                      <button
                        onClick={() => handleOpenModal(actual.id)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteActual(actual.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Edit Actual Cost">
        <div className="space-y-4 p-4">
          <Input
            label="Actual Quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.actual_quantity}
            onChange={(e) => setFormData({ ...formData, actual_quantity: parseFloat(e.target.value) || 0 })}
            required
          />
          <Input
            label="Actual Cost (£)"
            type="number"
            min="0"
            step="0.01"
            value={formData.actual_cost}
            onChange={(e) => setFormData({ ...formData, actual_cost: parseFloat(e.target.value) || 0 })}
            required
          />
          <Input
            label="Completed Date"
            type="date"
            value={formData.completed_date}
            onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variance Reason</label>
            <textarea
              value={formData.variance_reason}
              onChange={(e) => setFormData({ ...formData, variance_reason: e.target.value })}
              placeholder="Explain any significant variance from estimate"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-khc-primary focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitForm} loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
