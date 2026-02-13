import { useState } from 'react'
import type { BoQImportResponse, BoQImportState, BoQItem, BoQSection } from '../types/boq'

export function useBoQImport(projectId: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // POST preview endpoint (returns items without saving)
  const previewImport = async (file: File): Promise<BoQImportState | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/v1/projects/${projectId}/boq-import/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to preview BoQ import (HTTP ${response.status})`
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      const data: BoQImportResponse = await response.json()
      if (!data.success || !data.data) {
        const errorMessage = data.error || 'Failed to process BoQ file'
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      // Extract data from preview structure
      if (data.data.preview) {
        return {
          items: [],
          sections: (data.data.preview.sections as any) || [],
          totalAmount: data.data.preview.grandTotal || 0
        }
      }

      // Fallback to flat structure if preview doesn't exist
      return {
        items: data.data.imported_items || [],
        sections: data.data.sections || [],
        totalAmount: data.data.total_amount || 0
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while previewing the import'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // POST import endpoint (saves items)
  const importBoQ = async (file: File, importName?: string): Promise<BoQImportState | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (importName) {
        formData.append('importName', importName)
      }

      const response = await fetch(`/api/v1/projects/${projectId}/boq-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to import BoQ (HTTP ${response.status})`
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      const data: BoQImportResponse = await response.json()
      if (!data.success || !data.data) {
        const errorMessage = data.error || 'Failed to import BoQ file'
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      return {
        items: data.data.imported_items || [],
        sections: data.data.sections || [],
        totalAmount: data.data.total_amount || 0
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while importing BoQ'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // GET exports PDF endpoint
  const exportPDF = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/estimates/export-boq-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to export PDF (HTTP ${response.status})`
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      // Create blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `boq-export-${projectId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while exporting PDF'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // GET list of imports for a project
  const getImports = async (): Promise<any[] | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/boq-imports`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to fetch imports (HTTP ${response.status})`
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching imports'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE import
  const deleteImport = async (importId: number): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/boq-imports/${importId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to delete import (HTTP ${response.status})`
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the import'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    previewImport,
    importBoQ,
    exportPDF,
    getImports,
    deleteImport,
    clearError: () => setError(null)
  }
}
