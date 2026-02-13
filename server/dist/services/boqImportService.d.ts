export interface BoQItem {
    itemNumber: string;
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
    notes?: string;
    sectionNumber?: string;
    sectionTitle?: string;
}
export interface BoQSection {
    sectionId: number;
    sectionNumber: string;
    sectionTitle: string;
    items: BoQItem[];
    sectionTotal: number;
    itemCount: number;
}
export interface BoQImportData {
    sections: BoQSection[];
    totalItems: number;
    grandTotal: number;
    importName: string;
}
/**
 * Parse CSV content and extract BoQ data
 * Expected CSV columns: Item No., Description, Unit, Quantity, Rate (£), Amount (£), Notes (all optional)
 * Handles multi-line quoted fields properly
 * Section names are auto-generated from section numbers (e.g., Section 1, Section 2, etc.)
 */
export declare function parseBoQCSV(csvContent: string): BoQImportData;
/**
 * Validate BoQ data structure
 * Section names are auto-generated, no CSV column required
 */
export declare function validateBoQData(data: BoQImportData): string[];
/**
 * Calculate pagination information for PDF generation
 * Based on items per page
 */
export declare function calculatePagination(sections: BoQSection[], itemsPerPage?: number): {
    sectionId: number;
    sectionNumber: string;
    sectionTitle: string;
    pages: Array<{
        pageNumber: number;
        totalPages: number;
        items: BoQItem[];
        pageTotal: number;
    }>;
    sectionTotal: number;
}[];
/**
 * Extract section ID from item number
 * Examples: "1.1.1" -> 1, "2.3.4" -> 2
 */
export declare function extractSectionId(itemNumber: string): number;
/**
 * Format currency for display
 */
export declare function formatCurrency(amount: number): string;
/**
 * Safely parse numeric values from CSV (handles currency symbols, commas, etc.)
 */
export declare function parseNumericValue(value: string | number | undefined): number;
//# sourceMappingURL=boqImportService.d.ts.map