import { useState } from 'react';
import Modal from '../ui/Modal';

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, templateType: string, isPublic: boolean) => Promise<void>;
  isLoading?: boolean;
}

export default function SaveAsTemplateDialog({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<'quick' | 'standard' | 'complex'>('standard');
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (name.length > 255) {
      newErrors.name = 'Template name must be less than 255 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave(name, description, templateType, isPublic);
      setName('');
      setDescription('');
      setTemplateType('standard');
      setIsPublic(false);
      setErrors({});
      onClose();
    } catch (error) {
      // Error is handled by parent
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save as Template" size="md">
      <div className="space-y-6">
        {/* Template Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors({ ...errors, name: '' });
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
            placeholder="e.g., Residential Interior"
            maxLength={255}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary resize-none"
            placeholder="Describe what this template is for..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
        </div>

        {/* Template Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Type
          </label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as 'quick' | 'standard' | 'complex')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
          >
            <option value="quick">Quick (5-10 items)</option>
            <option value="standard">Standard (10-50 items)</option>
            <option value="complex">Complex (50+ items)</option>
          </select>
        </div>

        {/* Public/Private Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 cursor-pointer">
            Share template with team
          </label>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ℹ️ Save this estimate as a template to quickly create similar estimates in the future.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded-lg disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
