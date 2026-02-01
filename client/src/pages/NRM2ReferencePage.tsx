import React, { useEffect, useState } from 'react';
import NRM2TreeView from '../components/nrm2/NRM2TreeView.js';
import NRM2DetailPanel from '../components/nrm2/NRM2DetailPanel.js';
import { useNRM2Store } from '../stores/nrm2Store.js';
import type { NRM2WorkSection, NRM2SearchResult } from '../types/nrm2.js';

const NRM2ReferencePage: React.FC = () => {
  const {
    groups,
    searchResults,
    isLoading,
    isSearching,
    searchKeyword,
    currentWorkSection,
    fetchGroups,
    searchNRM2,
    clearSearch,
    setCurrentWorkSection,
  } = useNRM2Store();

  const [selectedWorkSection, setSelectedWorkSection] = useState<NRM2WorkSection | null>(null);
  const [isShowingSearch, setIsShowingSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (groups.length === 0) {
      fetchGroups();
    }
  }, [groups, fetchGroups]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsShowingSearch(true);
      searchNRM2(searchInput);
    }
  };

  const handleSelectSearchResult = async (result: NRM2SearchResult) => {
    if (result.type === 'work_section') {
      try {
        const response = await fetch(`/api/v1/nrm2/work-sections/${result.id}`);
        const json = await response.json();
        if (json.success) {
          setSelectedWorkSection(json.data);
          setCurrentWorkSection(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch work section:', error);
      }
    }
  };

  const handleClearSearch = () => {
    setIsShowingSearch(false);
    setSearchInput('');
    clearSearch();
  };

  const handleUseInEstimate = (code: string, title: string, unit?: string) => {
    // This could trigger opening cost item creation modal
    // For now, we'll just log it
    console.log('Use in estimate:', { code, title, unit });
    // In full implementation, emit event or use store to handle this
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NRM 2 Reference</h1>
              <p className="text-gray-600 mt-2">New Rules of Measurement 2 - Complete hierarchy and search</p>
            </div>
            <a
              href="/references/documents"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              📄 View Full PDF
            </a>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search NRM 2 codes, titles, or descriptions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-2.5 text-gray-400 text-lg">🔍</span>
              </div>
              {isShowingSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree View / Search Results */}
          <div className="lg:col-span-2">
            {isShowingSearch ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Search Results for "{searchKeyword}"
                  {searchResults.length > 0 && (
                    <span className="text-gray-600 text-sm ml-2">({searchResults.length} results)</span>
                  )}
                </h2>
                {isSearching ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-4">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono text-sm font-semibold text-gray-900">{result.code}</div>
                            <div className="text-gray-700">{result.title}</div>
                            {result.description && (
                              <div className="text-gray-600 text-sm mt-1">{result.description}</div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {result.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No results found for "{searchKeyword}"</p>
                    <p className="text-sm mt-2">Try searching with different keywords</p>
                  </div>
                )}
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Loading NRM 2 hierarchy...</p>
              </div>
            ) : (
              <NRM2TreeView
                groups={groups}
                onSelectWorkSection={(code, title, unit) => {
                  // Fetch full work section details
                  fetch(`/api/v1/nrm2/work-sections/by-code/${code}`)
                    .then((res) => res.json())
                    .then((json) => {
                      if (json.success) {
                        setSelectedWorkSection(json.data);
                        setCurrentWorkSection(json.data);
                      }
                    })
                    .catch((error) => console.error('Failed to fetch work section:', error));
                }}
                selectedCode={selectedWorkSection?.code}
              />
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <NRM2DetailPanel
                workSection={selectedWorkSection}
                onUseInEstimate={handleUseInEstimate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NRM2ReferencePage;
