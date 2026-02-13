import type Database from 'better-sqlite3';
import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';

export interface LibrarySectionRow {
  id: number;
  section_number: number;
  section_title: string;
  items_per_page: number;
  sort_order: number;
  item_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryItemRow {
  id: number;
  section_id: number;
  item_number: string;
  description: string;
  quantity: number | null;
  unit: string;
  standard_rate: number;
  notes: string | null;
  is_active: number;
  page_number: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface SectionInput {
  sectionNumber: number;
  sectionTitle: string;
}

/**
 * Create library sections from import data.
 * Called inside a transaction. Does NOT call getDatabase().
 */
export function ensureSectionsFromImport(
  db: Database.Database,
  sections: SectionInput[],
  userId: number,
  _importId: number
): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO boq_library_sections (
      section_number, section_title, items_per_page, sort_order, created_by
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    stmt.run(section.sectionNumber, section.sectionTitle, 25, i + 1, userId);
  }
}

/**
 * Re-paginate a library section: splits active items into pages.
 * Updates boq_library_items.page_number.
 * Deletes + rebuilds boq_library_pages rows.
 */
export function repaginateLibrarySection(
  db: Database.Database,
  sectionRow: LibrarySectionRow
): void {
  const { id: sectionId, items_per_page } = sectionRow;

  // Fetch all active items for this section, sorted deterministically
  const itemsStmt = db.prepare(`
    SELECT id, item_number
    FROM boq_library_items
    WHERE section_id = ? AND is_active = 1
    ORDER BY item_number ASC, id ASC
  `);

  const items = itemsStmt.all(sectionId) as Array<{ id: number; item_number: string }>;

  // If no active items, delete all pages and return early
  if (items.length === 0) {
    const deleteStmt = db.prepare('DELETE FROM boq_library_pages WHERE section_id = ?');
    deleteStmt.run(sectionId);
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(items.length / items_per_page);

  // Delete existing pages
  const deleteStmt = db.prepare('DELETE FROM boq_library_pages WHERE section_id = ?');
  deleteStmt.run(sectionId);

  // Insert new pages and update item page_numbers
  const insertPageStmt = db.prepare(`
    INSERT INTO boq_library_pages (section_id, page_number, total_pages, item_count)
    VALUES (?, ?, ?, ?)
  `);

  const updateItemStmt = db.prepare(`
    UPDATE boq_library_items SET page_number = ? WHERE id = ?
  `);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const startIdx = (pageNum - 1) * items_per_page;
    const endIdx = Math.min(startIdx + items_per_page, items.length);
    const pageItems = items.slice(startIdx, endIdx);

    // Insert page record
    insertPageStmt.run(sectionId, pageNum, totalPages, pageItems.length);

    // Update each item with its page number
    for (const item of pageItems) {
      updateItemStmt.run(pageNum, item.id);
    }
  }

  // Update section's item_count denormalization
  const updateSectionStmt = db.prepare(`
    UPDATE boq_library_sections SET item_count = ? WHERE id = ?
  `);
  updateSectionStmt.run(items.length, sectionId);
}

/**
 * Regenerate collection page for a library section.
 * Reads boq_library_pages, builds page_references JSON.
 */
export function regenerateLibraryCollection(
  db: Database.Database,
  sectionRow: LibrarySectionRow
): void {
  const { id: sectionId } = sectionRow;

  // Fetch all pages for this section
  const pagesStmt = db.prepare(`
    SELECT page_number, item_count
    FROM boq_library_pages
    WHERE section_id = ?
    ORDER BY page_number ASC
  `);

  const pages = pagesStmt.all(sectionId) as Array<{ page_number: number; item_count: number }>;

  if (pages.length === 0) {
    // No pages: delete collection row if it exists
    const deleteStmt = db.prepare(`DELETE FROM boq_library_collections WHERE section_id = ?`);
    deleteStmt.run(sectionId);
    return;
  }

  // Build page_references JSON
  const pageReferences = pages.map(p => ({
    page_number: p.page_number,
    item_count: p.item_count,
  }));

  // Upsert collection page
  const upsertStmt = db.prepare(`
    INSERT OR REPLACE INTO boq_library_collections (
      section_id, page_references, item_count, generated_at
    )
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);

  upsertStmt.run(sectionId, JSON.stringify(pageReferences), pages.reduce((sum, p) => sum + p.item_count, 0));
}

/**
 * Regenerate library summary.
 * Builds section_references JSON with all sections.
 */
export function regenerateLibrarySummary(db: Database.Database): void {
  // Fetch all sections with their item counts
  const sectionsStmt = db.prepare(`
    SELECT id, section_number, section_title, item_count
    FROM boq_library_sections
    ORDER BY sort_order ASC
  `);

  const sections = sectionsStmt.all() as Array<{
    id: number;
    section_number: number;
    section_title: string;
    item_count: number;
  }>;

  // Build section_references JSON
  const sectionReferences = sections.map(s => ({
    section_id: s.id,
    section_number: s.section_number,
    section_title: s.section_title,
    item_count: s.item_count,
  }));

  const totalItems = sections.reduce((sum, s) => sum + s.item_count, 0);

  // Upsert summary (delete old and insert new)
  const deleteStmt = db.prepare('DELETE FROM boq_library_summary');
  deleteStmt.run();

  const insertStmt = db.prepare(`
    INSERT INTO boq_library_summary (
      section_references, total_sections, total_items, generated_at
    )
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);

  insertStmt.run(JSON.stringify(sectionReferences), sections.length, totalItems);
}

/**
 * Full rebuild of library structure.
 * Called after import.
 */
export function rebuildLibraryStructure(db: Database.Database): void {
  // Fetch all sections
  const sectionsStmt = db.prepare('SELECT * FROM boq_library_sections');
  const sections = sectionsStmt.all() as LibrarySectionRow[];

  // Repaginate each section and regenerate its collection
  for (const section of sections) {
    repaginateLibrarySection(db, section);
    regenerateLibraryCollection(db, section);
  }

  // Regenerate overall summary
  regenerateLibrarySummary(db);
}

/**
 * Full rebuild wrapped in transaction.
 */
export function rebuildLibrary(): void {
  const db = getDatabase();

  const transaction = db.transaction(() => {
    rebuildLibraryStructure(db);
  });

  transaction();
  logger.info('BoQ library structure rebuilt');
}

export default {
  ensureSectionsFromImport,
  repaginateLibrarySection,
  regenerateLibraryCollection,
  regenerateLibrarySummary,
  rebuildLibraryStructure,
  rebuildLibrary,
};
