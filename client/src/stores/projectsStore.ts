import { create } from 'zustand'
import { projectsAPI } from '../services/api'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project'

interface ProjectsState {
  // State
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  filters: {
    status?: string
    estimateStatus?: string
    searchTerm?: string
  }

  // Actions
  fetchProjects: () => Promise<void>
  fetchProjectById: (id: number) => Promise<void>
  createProject: (data: CreateProjectRequest) => Promise<Project>
  updateProject: (id: number, data: UpdateProjectRequest) => Promise<Project>
  deleteProject: (id: number) => Promise<void>
  duplicateProject: (id: number, name: string, includeEstimates: boolean, copyStatus: boolean) => Promise<Project>
  submitEstimate: (id: number) => Promise<void>
  approveEstimate: (id: number, notes?: string) => Promise<void>
  rejectEstimate: (id: number, reason?: string) => Promise<void>
  setFilters: (filters: Partial<ProjectsState['filters']>) => void
  clearError: () => void
  setCurrentProject: (project: Project | null) => void
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  filters: {},

  // Actions
  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.getAll()
      set({ projects: response.data.data, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch projects'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  fetchProjectById: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.getById(id)
      set({ currentProject: response.data.data, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch project'
      set({ error: message, isLoading: false, currentProject: null })
      throw error
    }
  },

  createProject: async (data: CreateProjectRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.create(data)
      const newProject = response.data.data
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }))
      return newProject
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create project'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  updateProject: async (id: number, data: UpdateProjectRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.update(id, data)
      const updatedProject = response.data.data
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }))
      return updatedProject
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update project'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  deleteProject: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await projectsAPI.delete(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }))
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete project'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  duplicateProject: async (id: number, name: string, includeEstimates: boolean, copyStatus: boolean) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.duplicate(id, {
        name,
        include_estimates: includeEstimates,
        copy_status: copyStatus,
      })
      const newProject = response.data.data
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }))
      return newProject
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to duplicate project'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  submitEstimate: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.submitEstimate(id)
      const updatedProject = response.data.data
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }))
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit estimate'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  approveEstimate: async (id: number, notes?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.approveEstimate(id, notes)
      const updatedProject = response.data.data
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }))
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to approve estimate'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  rejectEstimate: async (id: number, reason?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await projectsAPI.rejectEstimate(id, reason)
      const updatedProject = response.data.data
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }))
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to reject estimate'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  clearError: () => {
    set({ error: null })
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
  },
}))
