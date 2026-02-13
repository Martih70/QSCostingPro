import logger from '../utils/logger.js';
/**
 * Parse entire CSV content handling multi-line quoted fields
 */
function parseCSVLines(csvContent) {
    const result = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < csvContent.length; i++) {
        const char = csvContent[i];
        const nextChar = csvContent[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            }
            else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            // Field separator
            currentLine.push(currentField.trim());
            currentField = '';
        }
        else if ((char === '\n' || char === '\r') && !inQuotes) {
            // Line separator (only if not inside quotes)
            if (currentField.trim() || currentLine.length > 0) {
                currentLine.push(currentField.trim());
                currentField = '';
            }
            if (currentLine.length > 0) {
                result.push(currentLine);
                currentLine = [];
            }
            // Skip \r\n
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        }
        else {
            currentField += char;
        }
    }
    // Add last field and line
    if (currentField.trim() || currentLine.length > 0) {
        currentLine.push(currentField.trim());
    }
    if (currentLine.length > 0) {
        result.push(currentLine);
    }
    return result.filter(line => line.some(field => field.length > 0)); // Remove empty lines
}
/**
 * Parse CSV content and extract BoQ data
 * Expected CSV columns: Item No., Description, Unit, Quantity, Rate (£), Amount (£), Notes (all optional)
 * Handles multi-line quoted fields properly
 * Section names are auto-generated from section numbers (e.g., Section 1, Section 2, etc.)
 */
export function parseBoQCSV(csvContent) {
    try {
        // Parse entire CSV respecting quoted fields with newlines
        const lines = parseCSVLines(csvContent);
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }
        // Parse header
        const headers = lines[0];
        // Find column indices (case-insensitive, trimmed)
        const findColumnIndex = (name) => {
            return headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase().trim());
        };
        const itemNoIdx = findColumnIndex('Item No.');
        const descIdx = findColumnIndex('Description');
        const unitIdx = findColumnIndex('Unit');
        const quantityIdx = findColumnIndex('Quantity');
        const rateIdx = findColumnIndex('Rate (£)');
        const amountIdx = findColumnIndex('Amount (£)');
        const notesIdx = findColumnIndex('Notes');
        if (itemNoIdx === -1 || descIdx === -1 || unitIdx === -1 || quantityIdx === -1 || rateIdx === -1 || amountIdx === -1) {
            throw new Error(`Missing required columns. Found: ${headers.join(', ')}. Expected: Item No., Description, Unit, Quantity, Rate (£), Amount (£). Optional: Notes`);
        }
        // Process data rows
        const items = [];
        for (let i = 1; i < lines.length; i++) {
            const fields = lines[i];
            if (!fields || fields.length === 0)
                continue;
            try {
                // Extract and validate fields
                const itemNumber = fields[itemNoIdx]?.trim() || '';
                if (!itemNumber)
                    continue;
                const description = fields[descIdx]?.trim() || '';
                const unit = fields[unitIdx]?.trim() || '';
                const quantity = parseNumericValue(fields[quantityIdx]);
                const rate = parseNumericValue(fields[rateIdx]);
                const amount = parseNumericValue(fields[amountIdx]);
                const notes = notesIdx >= 0 ? fields[notesIdx]?.trim() : undefined;
                if (isNaN(quantity) || isNaN(rate)) {
                    logger.warn(`Skipping row ${i + 1} with invalid numeric data: ${itemNumber}`);
                    continue;
                }
                // Extract section number from item number (first digit)
                const sectionNumber = itemNumber.split('.')[0];
                items.push({
                    itemNumber,
                    description,
                    unit,
                    quantity,
                    rate,
                    amount: isNaN(amount) ? quantity * rate : amount,
                    notes,
                    sectionNumber,
                    sectionTitle: '', // Will be auto-generated from section number
                });
            }
            catch (error) {
                logger.warn(`Error parsing row ${i + 1}: ${error}`);
                continue;
            }
        }
        if (items.length === 0) {
            throw new Error('No valid items found in CSV');
        }
        // Group items by section
        const sectionMap = new Map();
        for (const item of items) {
            const sectionNum = item.sectionNumber || '0';
            if (!sectionMap.has(sectionNum)) {
                sectionMap.set(sectionNum, []);
            }
            sectionMap.get(sectionNum).push(item);
        }
        // Build section objects with auto-generated section titles
        const sections = [];
        let sectionCounter = 0;
        for (const [sectionNumber, sectionItems] of Array.from(sectionMap.entries()).sort()) {
            sectionCounter++;
            // Auto-generate section title from section number
            let sectionTitle = `Section ${sectionNumber}`;
            // Check for section header item (e.g., "1.0" with description) to override auto-generated name
            const headerItem = sectionItems.find(item => item.itemNumber === `${sectionNumber}.0` ||
                item.itemNumber === `${sectionNumber}.0.0` ||
                item.itemNumber === sectionNumber);
            if (headerItem && headerItem.description) {
                sectionTitle = headerItem.description;
            }
            // Update section titles in items
            sectionItems.forEach(item => {
                item.sectionTitle = sectionTitle;
            });
            const sectionTotal = sectionItems.reduce((sum, item) => sum + item.amount, 0);
            sections.push({
                sectionId: sectionCounter,
                sectionNumber,
                sectionTitle,
                items: sectionItems,
                sectionTotal,
                itemCount: sectionItems.length,
            });
        }
        const grandTotal = items.reduce((sum, item) => sum + item.amount, 0);
        return {
            sections,
            totalItems: items.length,
            grandTotal,
            importName: `BoQ Import ${new Date().toLocaleDateString()}`,
        };
    }
    catch (error) {
        throw error;
    }
}
/**
 * Validate BoQ data structure
 * Section names are auto-generated, no CSV column required
 */
export function validateBoQData(data) {
    const errors = [];
    if (!data.sections || data.sections.length === 0) {
        errors.push('No sections found in BoQ data');
    }
    for (const section of data.sections) {
        if (!section.sectionNumber) {
            errors.push(`Section has no section number`);
        }
        if (!section.items || section.items.length === 0) {
            errors.push(`Section ${section.sectionNumber} has no items`);
        }
        for (const item of section.items || []) {
            if (!item.itemNumber) {
                errors.push(`Item in section ${section.sectionNumber} has no item number`);
            }
            if (!item.description) {
                errors.push(`Item ${item.itemNumber} has no description`);
            }
            if (isNaN(item.quantity) || item.quantity <= 0) {
                errors.push(`Item ${item.itemNumber} has invalid quantity`);
            }
            if (isNaN(item.rate) || item.rate < 0) {
                errors.push(`Item ${item.itemNumber} has invalid rate`);
            }
        }
    }
    return errors;
}
/**
 * Calculate pagination information for PDF generation
 * Based on items per page
 */
export function calculatePagination(sections, itemsPerPage = 20) {
    const paginatedSections = [];
    for (const section of sections) {
        const pages = [];
        const totalPages = Math.ceil(section.items.length / itemsPerPage);
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const startIdx = (pageNum - 1) * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, section.items.length);
            const pageItems = section.items.slice(startIdx, endIdx);
            const pageTotal = pageItems.reduce((sum, item) => sum + item.amount, 0);
            pages.push({
                pageNumber: pageNum,
                totalPages,
                items: pageItems,
                pageTotal,
            });
        }
        paginatedSections.push({
            sectionId: section.sectionId,
            sectionNumber: section.sectionNumber,
            sectionTitle: section.sectionTitle,
            pages,
            sectionTotal: section.sectionTotal,
        });
    }
    return paginatedSections;
}
/**
 * Extract section ID from item number
 * Examples: "1.1.1" -> 1, "2.3.4" -> 2
 */
export function extractSectionId(itemNumber) {
    const parts = itemNumber.split('.');
    return parseInt(parts[0], 10);
}
/**
 * Format currency for display
 */
export function formatCurrency(amount) {
    return `£${amount.toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
/**
 * Safely parse numeric values from CSV (handles currency symbols, commas, etc.)
 */
export function parseNumericValue(value) {
    if (value === undefined || value === null || value === '') {
        return 0;
    }
    const strValue = value.toString().trim();
    const numValue = parseFloat(strValue.replace(/[£$,]/g, ''));
    return isNaN(numValue) ? 0 : numValue;
}
//# sourceMappingURL=boqImportService.js.map