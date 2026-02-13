import type Database from 'better-sqlite3';
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
export declare function ensureSectionsFromImport(db: Database.Database, sections: SectionInput[], userId: number, _importId: number): void;
/**
 * Re-paginate a library section: splits active items into pages.
 * Updates boq_library_items.page_number.
 * Deletes + rebuilds boq_library_pages rows.
 */
export declare function repaginateLibrarySection(db: Database.Database, sectionRow: LibrarySectionRow): void;
/**
 * Regenerate collection page for a library section.
 * Reads boq_library_pages, builds page_references JSON.
 */
export declare function regenerateLibraryCollection(db: Database.Database, sectionRow: LibrarySectionRow): void;
/**
 * Regenerate library summary.
 * Builds section_references JSON with all sections.
 */
export declare function regenerateLibrarySummary(db: Database.Database): void;
/**
 * Full rebuild of library structure.
 * Called after import.
 */
export declare function rebuildLibraryStructure(db: Database.Database): void;
/**
 * Full rebuild wrapped in transaction.
 */
export declare function rebuildLibrary(): void;
declare const _default: {
    ensureSectionsFromImport: typeof ensureSectionsFromImport;
    repaginateLibrarySection: typeof repaginateLibrarySection;
    regenerateLibraryCollection: typeof regenerateLibraryCollection;
    regenerateLibrarySummary: typeof regenerateLibrarySummary;
    rebuildLibraryStructure: typeof rebuildLibraryStructure;
    rebuildLibrary: typeof rebuildLibrary;
};
export default _default;
//# sourceMappingURL=boqLibraryService.d.ts.map