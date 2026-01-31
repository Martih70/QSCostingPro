import { useCallback } from 'react'

interface EstimatePreset {
  id: string
  name: string
  description: string
  custom_description: string
  quantity: number
  custom_unit: string
  custom_unit_rate: number
  category_id: number
  created_at: number
  usage_count: number
}

const STORAGE_KEY = 'qscostingpro_estimate_presets'
const MAX_PRESETS = 10

export const useEstimatePresets = () => {
  const getPresets = useCallback((): EstimatePreset[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  const savePreset = useCallback(
    (name: string, data: any) => {
      try {
        const presets = getPresets()
        // Only store primitive values to avoid circular references
        const newPreset: EstimatePreset = {
          id: `preset-${Date.now()}`,
          name: String(name || ''),
          description: String(data.description || ''),
          custom_description: String(data.custom_description || ''),
          quantity: Number(data.quantity || 1),
          custom_unit: String(data.custom_unit || ''),
          custom_unit_rate: Number(data.custom_unit_rate || 0),
          category_id: Number(data.category_id || 0),
          created_at: Date.now(),
          usage_count: 0,
        }
        const updated = [newPreset, ...presets].slice(0, MAX_PRESETS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return newPreset
      } catch (error) {
        console.error('Failed to save preset:', error)
        return null
      }
    },
    [getPresets]
  )

  const deletePreset = useCallback((id: string) => {
    try {
      const presets = getPresets()
      const updated = presets.filter((p) => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Fail silently
    }
  }, [getPresets])

  const incrementUsageCount = useCallback((id: string) => {
    try {
      const presets = getPresets()
      const updated = presets.map((p) => ({
        ...p,
        usage_count: p.id === id ? p.usage_count + 1 : p.usage_count,
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to increment usage count:', error)
    }
  }, [getPresets])

  const getTopPresets = useCallback((limit = 5): EstimatePreset[] => {
    return getPresets()
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
  }, [getPresets])

  return {
    getPresets,
    savePreset,
    deletePreset,
    incrementUsageCount,
    getTopPresets,
  }
}
