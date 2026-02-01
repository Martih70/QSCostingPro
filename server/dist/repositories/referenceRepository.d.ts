import { Database } from 'better-sqlite3';
export interface ReferenceDocument {
    id: number;
    name: string;
    description?: string;
    file_path: string;
    file_type: string;
    file_size: number;
    category: string;
    uploaded_by: number;
    uploaded_at: string;
}
export declare class ReferenceRepository {
    private db;
    constructor(db: Database);
    /**
     * Create a new reference document record
     */
    createDocument(data: {
        name: string;
        description?: string;
        file_path: string;
        file_type: string;
        file_size: number;
        category: string;
        uploaded_by: number;
    }): ReferenceDocument;
    /**
     * Get all reference documents
     */
    getAllDocuments(category?: string): ReferenceDocument[];
    /**
     * Get a single document by ID
     */
    getDocumentById(id: number): ReferenceDocument | null;
    /**
     * Get documents by category
     */
    getDocumentsByCategory(category: string): ReferenceDocument[];
    /**
     * Update a document
     */
    updateDocument(id: number, data: {
        name?: string;
        description?: string;
        category?: string;
    }): ReferenceDocument | null;
    /**
     * Delete a document and its file
     */
    deleteDocument(id: number, uploadsDir: string): boolean;
    /**
     * Get document count by category
     */
    getDocumentCountByCategory(): Record<string, number>;
    /**
     * Search documents by name or description
     */
    searchDocuments(keyword: string): ReferenceDocument[];
}
//# sourceMappingURL=referenceRepository.d.ts.map