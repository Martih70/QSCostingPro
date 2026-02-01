import React from 'react';
import type { NRM2WorkSection } from '../../types/nrm2.js';

interface NRM2DetailPanelProps {
  workSection: NRM2WorkSection | null;
  onUseInEstimate?: (code: string, title: string, unit?: string) => void;
}

const NRM2DetailPanel: React.FC<NRM2DetailPanelProps> = ({ workSection, onUseInEstimate }) => {
  if (!workSection) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">Select a work section to view details</p>
      </div>
    );
  }

  const handleUseInEstimate = () => {
    if (onUseInEstimate) {
      onUseInEstimate(workSection.code, workSection.title, workSection.unit);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
        <div className="font-mono text-sm font-semibold">{workSection.code}</div>
        <div className="text-lg font-bold mt-1">{workSection.title}</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Description */}
        {workSection.description && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{workSection.description}</p>
          </div>
        )}

        {/* Unit */}
        {workSection.unit && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Unit of Measurement</h3>
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm font-mono text-blue-900">
              {workSection.unit}
            </div>
          </div>
        )}

        {/* Measurement Rules */}
        {workSection.measurement_rules && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Measurement Rules</h3>
            <p className="text-gray-700 text-sm leading-relaxed bg-yellow-50 border border-yellow-200 rounded p-3">
              {workSection.measurement_rules}
            </p>
          </div>
        )}

        {/* Inclusions */}
        {workSection.inclusions && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Inclusions</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              {workSection.inclusions.split(',').map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-green-600">✅</span>
                  <span>{item.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {workSection.exclusions && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Exclusions</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              {workSection.exclusions.split(',').map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-red-600">❌</span>
                  <span>{item.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer - Action Button */}
      {onUseInEstimate && (
        <div className="border-t bg-gray-50 px-6 py-4">
          <button
            onClick={handleUseInEstimate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Use in Estimate
          </button>
        </div>
      )}
    </div>
  );
};

export default NRM2DetailPanel;
