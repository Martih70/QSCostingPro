import { useState, useCallback } from 'react'

export const useBulkSelection = <T extends { id: number }>(items: T[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map((item) => item.id))
    setSelectedIds(allIds)
  }, [items])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll])

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds]
  )

  const getSelectedItems = useCallback(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  )

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    isPartiallySelected:
      selectedIds.size > 0 && selectedIds.size < items.length,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleAll,
    isSelected,
    getSelectedItems,
    clearSelection,
  }
}
