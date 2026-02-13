import PDFDocument from 'pdfkit';
import { BoQSection, calculatePagination, formatCurrency } from './boqImportService.js';

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
export function generateBoQPDF(
  sections: BoQSection[],
  options: BoQPdfOptions
): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  const pageLayout = getPageLayout();
  const paginatedSections = calculatePagination(sections, options.itemsPerPage || 20);
  const totalPages = calculateTotalPages(paginatedSections);

  // Page numbering setup
  let pageCount = 0;
  doc.on('pageAdded', () => {
    pageCount++;
  });

  // Generate title page
  generateTitlePage(doc, options, paginatedSections);

  // Generate section pages
  for (const section of paginatedSections) {
    for (const page of section.pages) {
      doc.addPage();
      generateSectionPage(
        doc,
        section,
        page,
        options,
        pageLayout
      );
    }

    // Add section summary page
    doc.addPage();
    generateSectionSummary(doc, section, options, pageLayout);
  }

  // Add final summary page
  doc.addPage();
  generateFinalSummary(doc, paginatedSections, options, pageLayout);

  // Add page numbers at the end
  addPageNumbers(doc, totalPages);

  return doc;
}

/**
 * Generate the title/cover page
 */
function generateTitlePage(
  doc: InstanceType<typeof PDFDocument>,
  options: BoQPdfOptions,
  sections: any[]
): void {
  const centerX = doc.page.width / 2;
  const y = doc.page.height / 2 - 150;

  // Company name
  if (options.companyName) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(options.companyName, centerX, y, { align: 'center' });
  }

  // Title
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('BILL OF QUANTITIES', centerX, y + 80, {
      align: 'center',
    });

  // Project details
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Project: ${options.projectName}`, centerX, y + 140, { align: 'center' });

  if (options.projectClient) {
    doc.text(`Client: ${options.projectClient}`, { align: 'center' });
  }

  if (options.projectAddress) {
    doc.text(`Address: ${options.projectAddress}`, { align: 'center' });
  }

  // Summary information
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const totalValue = sections.reduce((sum, s) => sum + s.sectionTotal, 0);

  doc.moveDown(3);
  doc
    .fontSize(11)
    .font('Helvetica')
    .text(`Total Items: ${totalItems}`, { align: 'center' })
    .text(`Total Value: ${formatCurrency(totalValue)}`, { align: 'center' })
    .text(
      `Date: ${(options.generatedDate || new Date()).toLocaleDateString('en-GB')}`,
      {
        align: 'center',
      }
    );
}

/**
 * Generate a section page with line items
 */
function generateSectionPage(
  doc: InstanceType<typeof PDFDocument>,
  section: any,
  page: any,
  _options: BoQPdfOptions,
  layout: PageLayout
): void {
  const { pageWidth, marginLeft, marginRight, marginTop, marginBottom, columnWidths } = layout;

  // Header
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(
      `${section.sectionNumber}. ${section.sectionTitle}`,
      marginLeft,
      marginTop,
      { width: pageWidth - marginLeft - marginRight }
    );

  // Page numbering within section
  const pageLabel = `Page ${page.pageNumber} of ${page.totalPages}`;
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#999999')
    .text(pageLabel, marginLeft, marginTop + 15, {
      align: 'right',
      width: pageWidth - marginLeft - marginRight,
    });

  doc.moveDown(1);

  // Column headers
  const headerY = doc.y;
  const headerBackground = '#f0f0f0';
  const headerHeight = 20;

  // Draw header background
  doc
    .rect(marginLeft, headerY, pageWidth - marginLeft - marginRight, headerHeight)
    .fill(headerBackground);

  // Header text
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#000000');

  drawTableCell(doc, 'Item No.', marginLeft + 5, headerY + 5, columnWidths.itemNumber);
  drawTableCell(
    doc,
    'Description',
    marginLeft + columnWidths.itemNumber + 5,
    headerY + 5,
    columnWidths.description
  );
  drawTableCell(
    doc,
    'Qty',
    marginLeft + columnWidths.itemNumber + columnWidths.description + 5,
    headerY + 5,
    columnWidths.quantity
  );
  drawTableCell(
    doc,
    'Unit',
    marginLeft +
      columnWidths.itemNumber +
      columnWidths.description +
      columnWidths.quantity +
      5,
    headerY + 5,
    columnWidths.unit
  );
  drawTableCell(
    doc,
    'Rate (£)',
    marginLeft +
      columnWidths.itemNumber +
      columnWidths.description +
      columnWidths.quantity +
      columnWidths.unit +
      5,
    headerY + 5,
    columnWidths.rate
  );
  drawTableCell(
    doc,
    'Amount (£)',
    marginLeft +
      columnWidths.itemNumber +
      columnWidths.description +
      columnWidths.quantity +
      columnWidths.unit +
      columnWidths.rate +
      5,
    headerY + 5,
    columnWidths.amount
  );

  let currentY = headerY + headerHeight + 10;

  // Line items
  doc.fontSize(9).font('Helvetica');

  for (const item of page.items) {
    const rowHeight = 30;

    // Check if we need to move to next page
    if (currentY + rowHeight > doc.page.height - marginBottom) {
      break; // Item will be on next page
    }

    // Alternate row backgrounds
    const isEvenRow = page.items.indexOf(item) % 2 === 0;
    if (isEvenRow) {
      doc
        .rect(marginLeft, currentY - 5, pageWidth - marginLeft - marginRight, rowHeight)
        .fill('#ffffff');
    }

    doc.fillColor('#000000');

    // Draw cells
    drawTableCell(doc, item.itemNumber, marginLeft + 5, currentY, columnWidths.itemNumber, 3);
    drawTableCell(
      doc,
      item.description,
      marginLeft + columnWidths.itemNumber + 5,
      currentY,
      columnWidths.description,
      3
    );
    drawTableCell(
      doc,
      item.quantity.toFixed(2),
      marginLeft + columnWidths.itemNumber + columnWidths.description + 5,
      currentY,
      columnWidths.quantity,
      3,
      'right'
    );
    drawTableCell(
      doc,
      item.unit,
      marginLeft +
        columnWidths.itemNumber +
        columnWidths.description +
        columnWidths.quantity +
        5,
      currentY,
      columnWidths.unit,
      3
    );
    drawTableCell(
      doc,
      formatCurrency(item.rate),
      marginLeft +
        columnWidths.itemNumber +
        columnWidths.description +
        columnWidths.quantity +
        columnWidths.unit +
        5,
      currentY,
      columnWidths.rate,
      3,
      'right'
    );
    drawTableCell(
      doc,
      formatCurrency(item.amount),
      marginLeft +
        columnWidths.itemNumber +
        columnWidths.description +
        columnWidths.quantity +
        columnWidths.unit +
        columnWidths.rate +
        5,
      currentY,
      columnWidths.amount,
      3,
      'right'
    );

    currentY += rowHeight;
  }

  // Page subtotal
  doc.moveTo(marginLeft, currentY).lineTo(pageWidth - marginRight, currentY).stroke();
  currentY += 10;

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Page Subtotal:', marginLeft + pageWidth - marginRight - 150, currentY, {
      width: 140,
      align: 'right',
    })
    .text(formatCurrency(page.pageTotal), {
      continued: false,
    });
}

/**
 * Generate section summary page
 */
function generateSectionSummary(
  doc: InstanceType<typeof PDFDocument>,
  section: any,
  _options: BoQPdfOptions,
  layout: PageLayout
): void {
  const { pageWidth, marginLeft, marginRight, marginTop } = layout;

  // Header
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`${section.sectionNumber}. ${section.sectionTitle} - Summary`, marginLeft, marginTop);

  doc.moveDown(1);

  // Summary table
  const summaryY = doc.y;

  doc.fontSize(10).font('Helvetica-Bold');

  // Details
  doc
    .text('Section Details:', marginLeft, summaryY)
    .fontSize(9)
    .font('Helvetica')
    .text(`Section Number: ${section.sectionNumber}`)
    .text(`Total Items: ${section.items.length}`)
    .text(`Number of Pages: ${section.pages.length}`);

  // Costs
  doc.moveTo(marginLeft, doc.y + 10).lineTo(pageWidth - marginRight, doc.y + 10).stroke();
  doc.moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold');
  doc.text(`Section Total: ${formatCurrency(section.sectionTotal)}`, {
    align: 'right',
    width: pageWidth - marginLeft - marginRight,
  });

  // Page summaries
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica-Bold').text('Page Breakdown:');
  doc.fontSize(9).font('Helvetica');

  for (const page of section.pages) {
    const lineContent = `Page ${page.pageNumber}: ${formatCurrency(page.pageTotal)}`;
    doc
      .text(lineContent, marginLeft + 20, doc.y, {
        width: pageWidth - marginLeft - marginRight - 20,
      })
      .moveDown(0.5);
  }
}

/**
 * Generate final summary page
 */
function generateFinalSummary(
  doc: InstanceType<typeof PDFDocument>,
  sections: any[],
  options: BoQPdfOptions,
  layout: PageLayout
): void {
  const { pageWidth, marginLeft, marginRight, marginTop } = layout;

  // Header
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('FINAL SUMMARY', marginLeft, marginTop);

  doc.moveDown(1);

  // Project information
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Project Information:');

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Project: ${options.projectName}`);

  if (options.projectClient) {
    doc.text(`Client: ${options.projectClient}`);
  }
  if (options.projectAddress) {
    doc.text(`Address: ${options.projectAddress}`);
  }
  if (options.projectStartDate) {
    doc.text(`Start Date: ${options.projectStartDate}`);
  }

  doc.moveDown(1);

  // Section summaries
  doc.fontSize(10).font('Helvetica-Bold').text('Section Summaries:');
  doc.fontSize(9).font('Helvetica');

  let grandTotal = 0;
  for (const section of sections) {
    const sectionTotal = section.sectionTotal;
    grandTotal += sectionTotal;

    doc.text(
      `${section.sectionNumber}. ${section.sectionTitle}: ${formatCurrency(sectionTotal)}`
    );
  }

  // Grand total
  doc.moveDown(1);
  doc.moveTo(marginLeft, doc.y).lineTo(pageWidth - marginRight, doc.y).stroke();
  doc.moveDown(1);

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`GRAND TOTAL: ${formatCurrency(grandTotal)}`, {
      align: 'right',
      width: pageWidth - marginLeft - marginRight,
    });

  // Statistics
  doc.moveDown(2);
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Total Sections: ${sections.length}`)
    .text(`Total Pages: ${totalPages}`)
    .text(`Total Items: ${totalItems}`)
    .text(
      `Generated: ${(options.generatedDate || new Date()).toLocaleDateString('en-GB')} at ${(
        options.generatedDate || new Date()
      ).toLocaleTimeString('en-GB')}`
    );
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(doc: InstanceType<typeof PDFDocument>, totalPages: number): void {
  let pageNum = 1;

  for (let i = 0; i < doc.bufferedPageRange().count; i++) {
    doc.switchToPage(i);

    // Add page number at bottom
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#999999')
      .text(`Page ${pageNum} of ${totalPages}`, 50, pageHeight - 30, {
        width: pageWidth - 100,
        align: 'center',
      });

    pageNum++;
  }
}

/**
 * Helper: Draw a table cell with text
 */
function drawTableCell(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight?: number,
  align?: 'left' | 'right' | 'center'
): void {
  const lines = text ? doc.heightOfString(text, { width }) : 0;
  const height = Math.max(lineHeight || 20, lines + 10);

  doc.text(text, x, y, {
    width,
    height,
    align: align || 'left',
  });
}

/**
 * Get standard page layout configuration
 */
function getPageLayout(): PageLayout {
  return {
    pageWidth: 210,
    pageHeight: 297,
    marginTop: 40,
    marginBottom: 50,
    marginLeft: 20,
    marginRight: 20,
    columnWidths: {
      itemNumber: 30,
      description: 80,
      quantity: 25,
      unit: 20,
      rate: 30,
      amount: 30,
    },
  };
}

/**
 * Calculate total number of pages in all sections
 */
function calculateTotalPages(sections: any[]): number {
  let total = 2; // Title page + final summary
  for (const section of sections) {
    total += section.pages.length + 1; // +1 for section summary
  }
  return total;
}
