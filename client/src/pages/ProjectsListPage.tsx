import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjectsStore } from '../stores/projectsStore'
import { useBulkSelection } from '../hooks/useBulkSelection'
import BulkOperationsToolbar from '../components/projects/BulkOperationsToolbar'
import DuplicateProjectDialog, { DuplicateOptions } from '../components/projects/DuplicateProjectDialog'
import { useToast } from '../components/ui/ToastContainer'
import { handleApiError, logError } from '../utils/errorHandler'

export default function ProjectsListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isEstimator, isAdmin } = useAuth()
  const { projects, isLoading, error, fetchProjects, deleteProject, updateProject, duplicateProject } = useProjectsStore()
  const [filters, setFilters] = useState({ status: '', estimateStatus: '', progress: '', search: '' })
  const [bulkLoading, setBulkLoading] = useState(false)
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateProjectId, setDuplicateProjectId] = useState<number | null>(null)
  const [duplicateProjectName, setDuplicateProjectName] = useState('')
  const bulkSelection = useBulkSelection(projects)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Filter projects
  const filtered = projects.filter((p) => {
    if (filters.status && p.status !== filters.status) return false
    if (filters.estimateStatus && p.estimate_status !== filters.estimateStatus) return false
    if (filters.progress && (p as any).progress !== filters.progress) return false
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id)
      } catch (error) {
        logError(error, 'DeleteProject')
      }
    }
  }

  const handleBulkDelete = async () => {
    const selectedProjects = bulkSelection.getSelectedItems()
    const confirmMsg = `Delete ${selectedProjects.length} project${selectedProjects.length !== 1 ? 's' : ''}? This cannot be undone.`

    if (window.confirm(confirmMsg)) {
      try {
        setBulkLoading(true)
        let successCount = 0
        let errorCount = 0

        for (const project of selectedProjects) {
          try {
            await deleteProject(project.id)
            successCount++
          } catch (error) {
            errorCount++
            logError(error, `BulkDelete-${project.id}`)
          }
        }

        bulkSelection.clearSelection()
        toast.success(`Deleted ${successCount} project${successCount !== 1 ? 's' : ''}`)
        if (errorCount > 0) {
          toast.error(`Failed to delete ${errorCount} project${errorCount !== 1 ? 's' : ''}`)
        }
      } finally {
        setBulkLoading(false)
      }
    }
  }

  const handleBulkStatusChange = async (newStatus: 'draft' | 'in_progress' | 'completed') => {
    const selectedProjects = bulkSelection.getSelectedItems()

    try {
      setBulkLoading(true)
      let successCount = 0

      for (const project of selectedProjects) {
        try {
          await updateProject(project.id, { status: newStatus })
          successCount++
        } catch (error) {
          logError(error, `BulkStatusChange-${project.id}`)
        }
      }

      bulkSelection.clearSelection()
      await fetchProjects()
      toast.success(`Updated ${successCount} project${successCount !== 1 ? 's' : ''}`)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleOpenDuplicateDialog = (id: number, name: string) => {
    setDuplicateProjectId(id)
    setDuplicateProjectName(name)
    setShowDuplicateDialog(true)
  }

  const handleDuplicateProject = async (options: DuplicateOptions) => {
    if (!duplicateProjectId) return

    try {
      setDuplicateLoading(true)
      await duplicateProject(duplicateProjectId, options.name, options.includeEstimates, options.copyStatus)
      await fetchProjects()
      toast.success(`Project duplicated successfully`)
      setShowDuplicateDialog(false)
    } catch (error) {
      logError(error, `DuplicateProject-${duplicateProjectId}`)
      toast.error('Failed to duplicate project')
    } finally {
      setDuplicateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Bulk Operations Toolbar */}
      {bulkSelection.selectedCount > 0 && (
        <BulkOperationsToolbar
          selectedCount={bulkSelection.selectedCount}
          totalCount={projects.length}
          isAllSelected={bulkSelection.isAllSelected}
          isPartiallySelected={bulkSelection.isPartiallySelected}
          onSelectAll={bulkSelection.selectAll}
          onDeselectAll={bulkSelection.deselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
          isLoading={bulkLoading}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-khc-primary">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your estimation projects</p>
        </div>
        {(isAdmin || isEstimator) && (
          <Link
            to="/projects/new"
            className="bg-khc-primary hover:bg-khc-secondary text-white font-medium py-2 px-4 rounded-lg transition"
          >
            + New Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Estimate Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimate Status</label>
            <select
              value={filters.estimateStatus}
              onChange={(e) => setFilters({ ...filters, estimateStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            >
              <option value="">All Estimates</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Progress Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
            <select
              value={filters.progress}
              onChange={(e) => setFilters({ ...filters, progress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            >
              <option value="">All Progress</option>
              <option value="Not Started">Not Started</option>
              <option value="Progressing">Progressing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-600">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {projects.length === 0 ? 'No projects yet.' : 'No projects match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={bulkSelection.isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = bulkSelection.isPartiallySelected
                      }}
                      onChange={bulkSelection.toggleAll}
                      className="w-5 h-5 rounded border-2 border-khc-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estimate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className={`hover:bg-gray-50 transition ${
                      bulkSelection.isSelected(project.id) ? 'bg-khc-light' : ''
                    }`}
                  >
                    <td className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(project.id)}
                        onChange={() => bulkSelection.toggleSelection(project.id)}
                        className="w-5 h-5 rounded border-2 border-khc-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-khc-primary hover:underline font-medium"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.project_address || project.description || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        (project as any).progress === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : (project as any).progress === 'Progressing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {(project as any).progress || 'Not Started'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        project.estimate_status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : project.estimate_status === 'submitted'
                          ? 'bg-blue-100 text-blue-700'
                          : project.estimate_status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {project.estimate_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 space-x-2 flex">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-khc-primary hover:text-khc-secondary text-sm font-medium"
                      >
                        View
                      </Link>
                      {(isAdmin || (user?.id === project.created_by && isEstimator)) && (
                        <>
                          <Link
                            to={`/projects/${project.id}/edit`}
                            className="text-khc-primary hover:text-khc-secondary text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleOpenDuplicateDialog(project.id, project.name)}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Duplicate
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center">
        Showing {filtered.length} of {projects.length} projects
      </p>

      {/* Duplicate Dialog */}
      <DuplicateProjectDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        onDuplicate={handleDuplicateProject}
        projectName={duplicateProjectName}
        isLoading={duplicateLoading}
      />
    </div>
  )
}
