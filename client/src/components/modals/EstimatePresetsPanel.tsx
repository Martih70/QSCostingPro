import { useEstimatePresets } from '../../hooks/useEstimatePresets'

interface EstimatePresetsPanelProps {
  onSelectPreset: (preset: any) => void
  onSaveAsPreset?: (preset: any) => void
  showSaveOption?: boolean
}

export default function EstimatePresetsPanel({
  onSelectPreset,
  onSaveAsPreset,
  showSaveOption = false,
}: EstimatePresetsPanelProps) {
  const { getTopPresets, deletePreset } = useEstimatePresets()
  const presets = getTopPresets(5)

  if (presets.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No presets saved yet</p>
        {showSaveOption && (
          <p className="text-xs mt-2">Save frequently used items as presets to reuse them</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-khc-primary hover:bg-khc-light transition-all"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {preset.custom_description}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {preset.quantity} × £{preset.custom_unit_rate} {preset.custom_unit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Used {preset.usage_count} times
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => onSelectPreset(preset)}
                className="px-2 py-1 bg-khc-primary hover:bg-khc-secondary text-white text-xs rounded transition-colors"
              >
                Use
              </button>
              <button
                onClick={() => deletePreset(preset.id)}
                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded transition-colors"
                title="Delete preset"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
