import { useEffect } from 'react'

const STORAGE_KEY = 'qscostingpro_recent_projects'
const MAX_RECENT = 5

interface RecentProject {
  id: number
  name: string
  viewed_at: number
}

export const useRecentlyViewed = () => {
  const getRecent = (): RecentProject[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const addRecent = (id: number, name: string) => {
    try {
      const recent = getRecent()
      // Remove if already exists
      const filtered = recent.filter((p) => p.id !== id)
      // Add to front - ensure we only store primitive values
      const newEntry: RecentProject = {
        id: Number(id),
        name: String(name || 'Unknown'),
        viewed_at: Date.now(),
      }
      const updated = [newEntry, ...filtered].slice(0, MAX_RECENT)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to add recent project:', error)
    }
  }

  const clearRecent = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Fail silently
    }
  }

  return {
    getRecent,
    addRecent,
    clearRecent,
  }
}
