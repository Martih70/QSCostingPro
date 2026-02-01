import React, { useState, useEffect } from 'react';
import { nrm2API } from '../../services/api.js';
import type { NRM2WorkSection, NRM2SearchResult } from '../../types/nrm2.js';

interface NRM2CodeSelectorProps {
  value?: string;
  onChange?: (workSection: NRM2WorkSection | null) => void;
  onSelect?: (code: string, title: string, unit?: string) => void;
  placeholder?: string;
}

const NRM2CodeSelector: React.FC<NRM2CodeSelectorProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search NRM 2 codes...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<NRM2SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(value || null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>();

  const handleSearch = async (keyword: string) => {
    setSearchInput(keyword);
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await nrm2API.search(keyword, 20);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: NRM2SearchResult) => {
    if (result.type === 'work_section') {
      try {
        const response = await nrm2API.getWorkSectionById(result.id);
        const workSection = response.data;

        setSelectedCode(workSection.code);
        setSelectedTitle(workSection.title);
        setSelectedUnit(workSection.unit);
        setIsOpen(false);
        setSearchInput('');
        setSearchResults([]);

        if (onChange) onChange(workSection);
        if (onSelect) onSelect(workSection.code, workSection.title, workSection.unit);
      } catch (error) {
        console.error('Failed to fetch work section:', error);
      }
    } else {
      // For non-work-section types, just use the code and title
      setSelectedCode(result.code);
      setSelectedTitle(result.title);
      setIsOpen(false);
      setSearchInput('');
      setSearchResults([]);

      if (onSelect) onSelect(result.code, result.title);
    }
  };

  const handleClear = () => {
    setSelectedCode(null);
    setSelectedTitle('');
    setSelectedUnit(undefined);
    if (onChange) onChange(null);
  };

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {selectedCode ? (
                <div>
                  <div className="font-mono font-semibold text-gray-900 text-sm">{selectedCode}</div>
                  <div className="text-gray-600 text-xs">{selectedTitle}</div>
                  {selectedUnit && <div className="text-gray-500 text-xs">Unit: {selectedUnit}</div>}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">{placeholder}</div>
              )}
            </div>
            {selectedCode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-2 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="mt-2">Searching...</p>
              </div>
            ) : searchInput.trim() === '' ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>Type to search NRM 2 codes</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>No results found</p>
              </div>
            ) : (
              <ul className="space-y-0">
                {searchResults.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => handleSelectResult(result)}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-mono font-semibold text-gray-900 text-sm">{result.code}</div>
                          <div className="text-gray-700 text-sm">{result.title}</div>
                          {result.description && (
                            <div className="text-gray-600 text-xs mt-1">{result.description}</div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                          {result.type}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NRM2CodeSelector;
