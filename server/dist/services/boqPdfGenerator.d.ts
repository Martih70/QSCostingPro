import PDFDocument from 'pdfkit';
import { BoQSection } from './boqImportService.js';
export interface BoQPdfOptions {
    projectName: string;
    projectClient?: string;
    projectAddress?: string;
    projectStartDate?: string;
    companyName?: string;
    generatedDate?: Date;
    itemsPerPage?: number;
}
export interface PageLayout {
    pageWidth: number;
    pageHeight: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    columnWidths: {
        itemNumber: number;
        description: number;
        quantity: number;
        unit: number;
        rate: number;
        amount: number;
    };
}
/**
 * Generate a professional Bill of Quantities PDF with multi-page sections
 * Includes pagination information and section summaries
 */
export declare function generateBoQPDF(sections: BoQSection[], options: BoQPdfOptions): InstanceType<typeof PDFDocument>;
//# sourceMappingURL=boqPdfGenerator.d.ts.map