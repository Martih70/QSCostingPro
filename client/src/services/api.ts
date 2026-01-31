import axios, { AxiosInstance, AxiosError } from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),

  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  getAllUsers: () =>
    api.get('/auth/users'),

  updateUser: (id: number, data: any) =>
    api.put(`/auth/users/${id}`, data),
};

// Cost Categories API (Phase 3)
export const costCategoriesAPI = {
  getAll: () =>
    api.get('/cost-categories'),

  getById: (id: number) =>
    api.get(`/cost-categories/${id}`),

  create: (data: any) =>
    api.post('/cost-categories', data),

  update: (id: number, data: any) =>
    api.put(`/cost-categories/${id}`, data),

  delete: (id: number) =>
    api.delete(`/cost-categories/${id}`),
};

// Cost Sub-Elements API (Phase 3)
export const costSubElementsAPI = {
  getAll: () =>
    api.get('/cost-sub-elements'),

  getByCategory: (categoryId: number) =>
    api.get('/cost-sub-elements', { params: { category_id: categoryId } }),

  getById: (id: number) =>
    api.get(`/cost-sub-elements/${id}`),

  create: (data: any) =>
    api.post('/cost-sub-elements', data),

  update: (id: number, data: any) =>
    api.put(`/cost-sub-elements/${id}`, data),

  delete: (id: number) =>
    api.delete(`/cost-sub-elements/${id}`),
};

// Units API (Phase 3)
export const unitsAPI = {
  getAll: () =>
    api.get('/units'),
};

// Cost Items API (Phase 3 - expanded)
export const costItemsAPI = {
  getAll: () =>
    api.get('/cost-items'),

  getCostItems: (filters?: any) =>
    api.get('/cost-items', { params: filters }),

  getById: (id: number) =>
    api.get(`/cost-items/${id}`),

  create: (data: any) =>
    api.post('/cost-items', data),

  update: (id: number, data: any) =>
    api.put(`/cost-items/${id}`, data),

  delete: (id: number) =>
    api.delete(`/cost-items/${id}`),

  // Categories
  getCategories: () =>
    api.get('/cost-categories'),

  createCategory: (data: any) =>
    api.post('/cost-categories', data),

  updateCategory: (id: number, data: any) =>
    api.put(`/cost-categories/${id}`, data),

  deleteCategory: (id: number) =>
    api.delete(`/cost-categories/${id}`),

  // Sub-elements
  getSubElements: () =>
    api.get('/cost-sub-elements'),

  getSubElementsByCategory: (categoryId: number) =>
    api.get('/cost-sub-elements', { params: { category_id: categoryId } }),

  createSubElement: (data: any) =>
    api.post('/cost-sub-elements', data),

  updateSubElement: (id: number, data: any) =>
    api.put(`/cost-sub-elements/${id}`, data),

  deleteSubElement: (id: number) =>
    api.delete(`/cost-sub-elements/${id}`),

  // Units
  getUnits: () =>
    api.get('/units'),

  // Cost items CRUD
  createCostItem: (data: any) =>
    api.post('/cost-items', data),

  updateCostItem: (id: number, data: any) =>
    api.put(`/cost-items/${id}`, data),

  deleteCostItem: (id: number) =>
    api.delete(`/cost-items/${id}`),
};

// Projects API (Phase 2C)
export const projectsAPI = {
  getAll: () =>
    api.get('/projects'),

  getById: (id: number) =>
    api.get(`/projects/${id}`),

  create: (data: any) =>
    api.post('/projects', data),

  update: (id: number, data: any) =>
    api.put(`/projects/${id}`, data),

  delete: (id: number) =>
    api.delete(`/projects/${id}`),

  submitEstimate: (id: number) =>
    api.post(`/projects/${id}/submit-estimate`),

  approveEstimate: (id: number, notes?: string) =>
    api.post(`/projects/${id}/approve-estimate`, { notes }),

  rejectEstimate: (id: number, reason?: string) =>
    api.post(`/projects/${id}/reject-estimate`, { reason }),

  duplicate: (id: number, data: any) =>
    api.post(`/projects/${id}/duplicate`, data),
};

// Project Estimates API (Phase 2C)
export const projectEstimatesAPI = {
  getAll: (projectId: number) =>
    api.get(`/projects/${projectId}/estimates`),

  getById: (projectId: number, estimateId: number) =>
    api.get(`/projects/${projectId}/estimates/${estimateId}`),

  create: (projectId: number, data: any) =>
    api.post(`/projects/${projectId}/estimates`, data),

  update: (projectId: number, estimateId: number, data: any) =>
    api.put(`/projects/${projectId}/estimates/${estimateId}`, data),

  delete: (projectId: number, estimateId: number) =>
    api.delete(`/projects/${projectId}/estimates/${estimateId}`),

  getSummary: (projectId: number) =>
    api.get(`/projects/${projectId}/estimate-summary`),
};

// Clients API (Phase 4)
export const clientsAPI = {
  getAll: (filters?: any) =>
    api.get('/clients', { params: filters }),

  getById: (id: number) =>
    api.get(`/clients/${id}`),

  create: (data: any) =>
    api.post('/clients', data),

  update: (id: number, data: any) =>
    api.put(`/clients/${id}`, data),

  delete: (id: number) =>
    api.delete(`/clients/${id}`),
};

// Contractors API (Phase 4)
export const contractorsAPI = {
  getAll: (filters?: any) =>
    api.get('/contractors', { params: filters }),

  getById: (id: number) =>
    api.get(`/contractors/${id}`),

  create: (data: any) =>
    api.post('/contractors', data),

  update: (id: number, data: any) =>
    api.put(`/contractors/${id}`, data),

  delete: (id: number) =>
    api.delete(`/contractors/${id}`),
};

// BCIS API (Phase 5)
export const bcisAPI = {
  getElements: () =>
    api.get('/bcis/elements'),

  getElement: (id: number) =>
    api.get(`/bcis/elements/${id}`),

  getSubElement: (id: number) =>
    api.get(`/bcis/sub-elements/${id}`),

  search: (query: string, elementCode?: string) =>
    api.get('/bcis/search', { params: { q: query, elementCode } }),

  getStructure: () =>
    api.get('/bcis/structure'),

  getItems: (elementCode: string) =>
    api.get(`/bcis/items/${elementCode}`),

  getItem: (id: number) =>
    api.get(`/bcis/item/${id}`),
};

// Spons API
export const sponsAPI = {
  getStructure: () =>
    api.get('/cost-items', { params: { database_type: 'spons' } }),

  getSubElement: (categoryId: number) =>
    api.get('/cost-items', { params: { category_id: categoryId, database_type: 'spons' } }),

  search: (query: string) =>
    api.get('/cost-items', { params: { q: query, database_type: 'spons' } }),
};

// Estimate Templates API
export const estimateTemplatesAPI = {
  getAll: (includeShared = true) =>
    api.get('/estimate-templates', { params: { shared: includeShared } }),

  getById: (id: number) =>
    api.get(`/estimate-templates/${id}`),

  create: (data: any) =>
    api.post('/estimate-templates', data),

  update: (id: number, data: any) =>
    api.put(`/estimate-templates/${id}`, data),

  delete: (id: number) =>
    api.delete(`/estimate-templates/${id}`),

  applyToProject: (templateId: number, projectId: number) =>
    api.post(`/estimate-templates/apply/${templateId}/to/${projectId}`),
};

export { api };
export default api;
