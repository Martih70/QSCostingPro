import { create } from 'zustand';
import type {
  NRM2Group,
  NRM2Element,
  NRM2SubElement,
  NRM2WorkSection,
  NRM2SearchResult,
  NRM2Statistics,
} from '../types/nrm2.js';

interface NRM2StoreState {
  // Data
  groups: NRM2Group[];
  currentGroup: NRM2Group | null;
  currentElement: NRM2Element | null;
  currentSubElement: NRM2SubElement | null;
  currentWorkSection: NRM2WorkSection | null;
  pendingWorkSection: NRM2WorkSection | null;
  searchResults: NRM2SearchResult[];
  statistics: NRM2Statistics | null;

  // State
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  searchKeyword: string;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchTree: () => Promise<void>;
  fetchGroupDetails: (id: number) => Promise<void>;
  fetchElementDetails: (id: number) => Promise<void>;
  fetchSubElementDetails: (id: number) => Promise<void>;
  searchNRM2: (keyword: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  setCurrentGroup: (group: NRM2Group | null) => void;
  setCurrentElement: (element: NRM2Element | null) => void;
  setCurrentSubElement: (subElement: NRM2SubElement | null) => void;
  setCurrentWorkSection: (workSection: NRM2WorkSection | null) => void;
  setPendingWorkSection: (workSection: NRM2WorkSection | null) => void;
  fetchStatistics: () => Promise<void>;
}

export const useNRM2Store = create<NRM2StoreState>((set) => ({
  // Initial state
  groups: [],
  currentGroup: null,
  currentElement: null,
  currentSubElement: null,
  currentWorkSection: null,
  pendingWorkSection: null,
  searchResults: [],
  statistics: null,
  isLoading: false,
  isSearching: false,
  error: null,
  searchKeyword: '',

  // Actions
  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/nrm2/groups');
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch groups');
      }

      set({ groups: json.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },

  fetchTree: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/nrm2/tree');
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch NRM 2 hierarchy');
      }

      set({ groups: json.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
      console.error('Failed to fetch NRM 2 tree:', error);
    }
  },

  fetchGroupDetails: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/nrm2/groups/${id}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch group details');
      }

      set({ currentGroup: json.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },

  fetchElementDetails: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/nrm2/elements/${id}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch element details');
      }

      set({ currentElement: json.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },

  fetchSubElementDetails: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/nrm2/sub-elements/${id}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch sub-element details');
      }

      set({ currentSubElement: json.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },

  searchNRM2: async (keyword: string) => {
    if (!keyword.trim()) {
      set({ searchResults: [], searchKeyword: '' });
      return;
    }

    set({ isSearching: true, error: null, searchKeyword: keyword });
    try {
      const response = await fetch(`/api/v1/nrm2/search?q=${encodeURIComponent(keyword)}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Search failed');
      }

      set({ searchResults: json.data, isSearching: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message, isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchKeyword: '', error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentGroup: (group: NRM2Group | null) => {
    set({ currentGroup: group });
  },

  setCurrentElement: (element: NRM2Element | null) => {
    set({ currentElement: element });
  },

  setCurrentSubElement: (subElement: NRM2SubElement | null) => {
    set({ currentSubElement: subElement });
  },

  setCurrentWorkSection: (workSection: NRM2WorkSection | null) => {
    set({ currentWorkSection: workSection });
  },

  setPendingWorkSection: (workSection: NRM2WorkSection | null) => {
    set({ pendingWorkSection: workSection });
  },

  fetchStatistics: async () => {
    try {
      const response = await fetch('/api/v1/nrm2/stats');
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch statistics');
      }

      set({ statistics: json.data });
    } catch (error) {
      console.error('Failed to fetch NRM 2 statistics:', error);
    }
  },
}));
