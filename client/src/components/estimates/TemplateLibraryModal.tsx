import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { useEstimateTemplatesStore } from '../../stores/estimateTemplatesStore';
import type { EstimateTemplate } from '../../types/estimateTemplate';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: EstimateTemplate) => void;
  showShared?: boolean;
}

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
  showShared = true,
}: TemplateLibraryModalProps) {
  const { templates, isLoading, fetchTemplates } = useEstimateTemplatesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quick' | 'standard' | 'complex'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates(showShared);
    }
  }, [isOpen, fetchTemplates, showShared]);

  const filtered = templates.filter((template) => {
    if (typeFilter !== 'all' && template.template_type !== typeFilter) return false;
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Library" size="lg">
      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
          />

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
          >
            <option value="all">All Types</option>
            <option value="quick">Quick</option>
            <option value="standard">Standard</option>
            <option value="complex">Complex</option>
          </select>
        </div>

        {/* Templates List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading templates...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {templates.length === 0 ? 'No templates available' : 'No templates match your search'}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((template) => (
                <div key={template.id} className="p-4 hover:bg-gray-50 cursor-pointer transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          template.template_type === 'quick'
                            ? 'bg-blue-100 text-blue-700'
                            : template.template_type === 'standard'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {template.template_type}
                        </span>
                        {template.is_public && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="ml-4 px-3 py-2 bg-khc-primary hover:bg-khc-secondary text-white rounded text-sm font-medium transition-colors"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
