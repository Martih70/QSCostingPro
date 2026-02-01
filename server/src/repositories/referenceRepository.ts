import { Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

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

export class ReferenceRepository {
  constructor(private db: Database) {}

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
  }): ReferenceDocument {
    const stmt = this.db.prepare(`
      INSERT INTO reference_documents (name, description, file_path, file_type, file_size, category, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.description || null,
      data.file_path,
      data.file_type,
      data.file_size,
      data.category,
      data.uploaded_by
    );

    return this.getDocumentById(result.lastInsertRowid as number)!;
  }

  /**
   * Get all reference documents
   */
  getAllDocuments(category?: string): ReferenceDocument[] {
    let query = `
      SELECT id, name, description, file_path, file_type, file_size, category, uploaded_by, uploaded_at
      FROM reference_documents
    `;

    if (category) {
      query += ` WHERE category = ?`;
      const stmt = this.db.prepare(query);
      return stmt.all(category) as ReferenceDocument[];
    }

    query += ` ORDER BY uploaded_at DESC`;
    const stmt = this.db.prepare(query);
    return stmt.all() as ReferenceDocument[];
  }

  /**
   * Get a single document by ID
   */
  getDocumentById(id: number): ReferenceDocument | null {
    const stmt = this.db.prepare(`
      SELECT id, name, description, file_path, file_type, file_size, category, uploaded_by, uploaded_at
      FROM reference_documents
      WHERE id = ?
    `);
    return stmt.get(id) as ReferenceDocument | null;
  }

  /**
   * Get documents by category
   */
  getDocumentsByCategory(category: string): ReferenceDocument[] {
    const stmt = this.db.prepare(`
      SELECT id, name, description, file_path, file_type, file_size, category, uploaded_by, uploaded_at
      FROM reference_documents
      WHERE category = ?
      ORDER BY uploaded_at DESC
    `);
    return stmt.all(category) as ReferenceDocument[];
  }

  /**
   * Update a document
   */
  updateDocument(id: number, data: {
    name?: string;
    description?: string;
    category?: string;
  }): ReferenceDocument | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }

    if (updates.length === 0) {
      return this.getDocumentById(id);
    }

    values.push(id);
    const query = `UPDATE reference_documents SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(...values);

    return this.getDocumentById(id);
  }

  /**
   * Delete a document and its file
   */
  deleteDocument(id: number, uploadsDir: string): boolean {
    const doc = this.getDocumentById(id);
    if (!doc) return false;

    try {
      // Delete file from filesystem
      const filePath = path.join(uploadsDir, path.basename(doc.file_path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete database record
      const stmt = this.db.prepare('DELETE FROM reference_documents WHERE id = ?');
      stmt.run(id);

      return true;
    } catch (error) {
      console.error(`Error deleting document: ${error}`);
      return false;
    }
  }

  /**
   * Get document count by category
   */
  getDocumentCountByCategory(): Record<string, number> {
    const stmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM reference_documents
      GROUP BY category
    `);
    const results = stmt.all() as Array<{ category: string; count: number }>;
    return Object.fromEntries(results.map(r => [r.category, r.count]));
  }

  /**
   * Search documents by name or description
   */
  searchDocuments(keyword: string): ReferenceDocument[] {
    const searchTerm = `%${keyword}%`;
    const stmt = this.db.prepare(`
      SELECT id, name, description, file_path, file_type, file_size, category, uploaded_by, uploaded_at
      FROM reference_documents
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY uploaded_at DESC
    `);
    return stmt.all(searchTerm, searchTerm) as ReferenceDocument[];
  }
}
