import React, { useState } from 'react';
import type { NRM2Group, NRM2Element, NRM2SubElement } from '../../types/nrm2.js';

interface NRM2TreeViewProps {
  groups: NRM2Group[];
  onSelectWorkSection?: (code: string, title: string, unit?: string) => void;
  onSelectElement?: (element: NRM2Element) => void;
  selectedCode?: string;
}

const NRM2TreeView: React.FC<NRM2TreeViewProps> = ({
  groups,
  onSelectWorkSection,
  onSelectElement,
  selectedCode,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [expandedElements, setExpandedElements] = useState<Set<number>>(new Set());
  const [expandedSubElements, setExpandedSubElements] = useState<Set<number>>(new Set());

  const toggleGroup = (id: number) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedGroups(newSet);
  };

  const toggleElement = (id: number) => {
    const newSet = new Set(expandedElements);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedElements(newSet);
  };

  const toggleSubElement = (id: number) => {
    const newSet = new Set(expandedSubElements);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSubElements(newSet);
  };

  const handleWorkSectionClick = (code: string, title: string, unit?: string) => {
    if (onSelectWorkSection) {
      onSelectWorkSection(code, title, unit);
    }
  };

  const handleElementClick = (element: NRM2Element) => {
    if (onSelectElement) {
      onSelectElement(element);
    }
  };

  return (
    <div className="nrm2-tree space-y-2">
      {groups.map((group) => (
        <div key={group.id} className="border rounded-lg overflow-hidden bg-white">
          {/* Group Header */}
          <button
            onClick={() => toggleGroup(group.id)}
            className="w-full px-4 py-3 flex items-center hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mr-2 text-gray-500">
              {expandedGroups.has(group.id) ? '▼' : '▶'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">
                {group.code} {group.title}
              </div>
              {group.description && (
                <div className="text-sm text-gray-600 mt-1">{group.description}</div>
              )}
            </div>
          </button>

          {/* Elements */}
          {expandedGroups.has(group.id) && group.elements && (
            <div className="bg-gray-50 border-t">
              {group.elements.map((element) => (
                <div key={element.id} className="border-t">
                  {/* Element Header */}
                  <button
                    onClick={() => toggleElement(element.id)}
                    className="w-full px-4 py-2 flex items-center hover:bg-gray-100 transition-colors text-left pl-8"
                  >
                    <div className="flex-shrink-0 mr-2 text-gray-400">
                      {expandedElements.has(element.id) ? '▼' : '▶'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">
                        {element.code} {element.title}
                      </div>
                    </div>
                  </button>

                  {/* Sub-Elements */}
                  {expandedElements.has(element.id) && element.sub_elements && (
                    <div className="bg-white">
                      {element.sub_elements.map((subElement) => (
                        <div key={subElement.id} className="border-t border-gray-200">
                          {/* Sub-Element Header */}
                          <button
                            onClick={() => toggleSubElement(subElement.id)}
                            className="w-full px-4 py-1.5 flex items-center hover:bg-gray-50 transition-colors text-left pl-12"
                          >
                            <div className="flex-shrink-0 mr-2 text-gray-300">
                              {expandedSubElements.has(subElement.id) ? '▼' : '▶'}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-700">
                                {subElement.code} {subElement.title}
                              </div>
                            </div>
                          </button>

                          {/* Work Sections */}
                          {expandedSubElements.has(subElement.id) && subElement.work_sections && (
                            <div className="bg-gray-50">
                              {subElement.work_sections.map((workSection, index) => (
                                <button
                                  key={`${subElement.id}-${index}`}
                                  onClick={() =>
                                    handleWorkSectionClick(workSection.code, workSection.title, workSection.unit)
                                  }
                                  className={`w-full px-4 py-1 flex items-start hover:bg-blue-50 transition-colors text-left pl-16 border-t border-gray-200 text-xs ${
                                    selectedCode === workSection.code
                                      ? 'bg-blue-100 border-blue-300'
                                      : ''
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="text-gray-900 font-mono text-xs">
                                      {workSection.code}
                                    </div>
                                    <div className="text-gray-700 text-xs">{workSection.title}</div>
                                    {workSection.unit && (
                                      <div className="text-gray-500 text-xs">Unit: {workSection.unit}</div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NRM2TreeView;
