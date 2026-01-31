import { create } from 'zustand';
import { estimateTemplatesAPI } from '../services/api';
import type {
  EstimateTemplate,
  EstimateTemplateWithItems,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../types/estimateTemplate';

interface EstimateTemplatesState {
  // State
  templates: EstimateTemplate[];
  currentTemplate: EstimateTemplateWithItems | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTemplates: (includeShared?: boolean) => Promise<void>;
  fetchTemplateById: (id: number) => Promise<void>;
  saveTemplate: (data: CreateTemplateRequest) => Promise<EstimateTemplateWithItems>;
  updateTemplate: (id: number, data: UpdateTemplateRequest) => Promise<EstimateTemplateWithItems>;
  deleteTemplate: (id: number) => Promise<void>;
  applyTemplate: (templateId: number, projectId: number) => Promise<EstimateTemplateWithItems>;
  setCurrentTemplate: (template: EstimateTemplateWithItems | null) => void;
  clearError: () => void;
}

export const useEstimateTemplatesStore = create<EstimateTemplatesState>((set, get) => ({
  // Initial state
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTemplates: async (includeShared = true) => {
    set({ isLoading: true, error: null });
    try {
      const response = await estimateTemplatesAPI.getAll(includeShared);
      set({ templates: response.data.data || [], isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch templates';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchTemplateById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await estimateTemplatesAPI.getById(id);
      set({ currentTemplate: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch template';
      set({ error: message, isLoading: false, currentTemplate: null });
      throw error;
    }
  },

  saveTemplate: async (data: CreateTemplateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await estimateTemplatesAPI.create(data);
      const newTemplate = response.data.data;
      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false,
      }));
      return newTemplate;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save template';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id: number, data: UpdateTemplateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await estimateTemplatesAPI.update(id, data);
      const updatedTemplate = response.data.data;
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updatedTemplate : t)),
        currentTemplate: state.currentTemplate?.id === id ? updatedTemplate : state.currentTemplate,
        isLoading: false,
      }));
      return updatedTemplate;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update template';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await estimateTemplatesAPI.delete(id);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete template';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  applyTemplate: async (templateId: number, projectId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await estimateTemplatesAPI.applyToProject(templateId, projectId);
      const template = response.data.data;
      set({ currentTemplate: template, isLoading: false });
      return template;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to apply template';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setCurrentTemplate: (template) => {
    set({ currentTemplate: template });
  },

  clearError: () => {
    set({ error: null });
  },
}));
