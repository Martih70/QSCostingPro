import React, { useEffect, useState } from 'react';
import { referencesAPI } from '../services/api.js';
import type { ReferenceDocument } from '../types/nrm2.js';

// Use the same server URL as API calls
const SERVER_URL = 'http://localhost:3000';

const ReferenceDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ReferenceDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching documents...');
      const response = await referencesAPI.getAll(selectedCategory || undefined);
      console.log('Documents API response:', response);
      // API returns {success, data: [...], count}
      const docs = response.data?.data || [];
      console.log('Documents array:', docs);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to load documents';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'standards');
    formData.append('description', `NRM 2 Reference Document - ${file.name}`);

    try {
      setIsUploading(true);
      setUploadError(null);
      console.log('Starting upload...');
      const response = await referencesAPI.upload(formData);
      console.log('Upload response:', response);
      await fetchDocuments();
      console.log('Documents refreshed after upload');
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to upload document';
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await referencesAPI.delete(id);
      setDocuments(documents.filter((d) => d.id !== id));
      if (selectedDocument?.id === id) {
        setSelectedDocument(null);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  console.log('ReferenceDocumentsPage rendered - state:', { isLoading, error, documentsCount: documents.length });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reference Documents</h1>
              <p className="text-gray-600 mt-2">Manage PDFs, images, and standards documents</p>
            </div>
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              <span className="mr-2">⬆️</span>
              <span>Upload Document</span>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,image/*"
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {(uploadError || error) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {uploadError || error}
            </div>
          )}

          {isUploading && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
              Uploading document...
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents List */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Loading documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white rounded-lg border border-red-200 bg-red-50">
                <div className="text-4xl mx-auto">⚠️</div>
                <p className="text-red-600 mt-4 font-medium">Failed to load documents</p>
                <p className="text-red-600 text-sm mt-2">{error}</p>
                <button
                  onClick={() => fetchDocuments()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-6xl text-gray-400 mx-auto">📋</div>
                <p className="text-gray-700 mt-4 font-semibold">No documents uploaded yet</p>
                <p className="text-gray-600 text-sm mt-2">Upload NRM 2 PDF or reference documents using the button above</p>
                <p className="text-gray-500 text-xs mt-3">Supported formats: PDF, PNG, JPG (max 50MB)</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedDocument?.id === doc.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                        {doc.description && (
                          <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{doc.file_type}</span>
                          <span>{formatDate(doc.uploaded_at)}</span>
                        </div>
                      </div>
                      {doc.id === selectedDocument?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="text-red-600 hover:text-red-700 p-1 text-lg"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Viewer */}
          <div className="lg:col-span-1">
            {selectedDocument ? (
              <div className="sticky top-24 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-screen max-h-[calc(100vh-120px)]">
                {/* Header */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {selectedDocument.name}
                  </h3>
                </div>

                {/* Viewer */}
                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
                  {selectedDocument.file_type === 'application/pdf' ? (
                    <iframe
                      src={`${SERVER_URL}${selectedDocument.file_path}`}
                      className="w-full h-full border-none"
                      title="PDF Viewer"
                    />
                  ) : selectedDocument.file_type.startsWith('image/') ? (
                    <img
                      src={`${SERVER_URL}${selectedDocument.file_path}`}
                      alt={selectedDocument.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <p className="text-sm">File type not supported for preview</p>
                      <a
                        href={`${SERVER_URL}${selectedDocument.file_path}`}
                        download
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                      >
                        Download file
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-600">
                  <div>{formatFileSize(selectedDocument.file_size)}</div>
                  <div>{formatDate(selectedDocument.uploaded_at)}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="text-4xl text-gray-400 mx-auto mb-3">👀</div>
                <p className="text-gray-600 font-medium">Select a document to preview</p>
                <p className="text-gray-500 text-sm mt-2">Choose a document from the list to view it here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferenceDocumentsPage;
