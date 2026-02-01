import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { verifyAuth } from '../../middleware/auth.js';
import { projectsRepository, projectEstimatesRepository } from '../../repositories/projectRepository.js';
import { calculateProjectTotal } from '../../services/estimationEngine.js';
import { getDatabase } from '../../database/connection.js';
import logger from '../../utils/logger.js';
const router = Router();
/**
 * GET /api/v1/projects/:projectId/estimates/export-pdf
 * Generate and download BoQ PDF
 * Query params:
 *   - groupBy: 'category' (default) or 'nrm2' for NRM 2 structure
 */
router.get('/:projectId/estimates/export-pdf', verifyAuth, (req, res) => {
    try {
        const { projectId } = req.params;
        const { groupBy = 'category' } = req.query;
        const projectIdNum = parseInt(projectId, 10);
        if (isNaN(projectIdNum)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        // Check if project exists
        const project = projectsRepository.getById(projectIdNum);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        // Check access
        if (req.user?.role === 'viewer' && project.created_by !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        // Get estimates with NRM 2 data if available
        const db = getDatabase();
        let estimatesWithNRM2 = [];
        if (groupBy === 'nrm2') {
            // Query with NRM 2 joins
            const stmt = db.prepare(`
        SELECT
          pe.*,
          ws.code as nrm2_code,
          ws.title as nrm2_title,
          se.code as nrm2_sub_element_code,
          e.code as nrm2_element_code,
          g.code as nrm2_group_code,
          g.title as nrm2_group_title,
          e.title as nrm2_element_title
        FROM project_estimates pe
        LEFT JOIN nrm2_work_sections ws ON pe.nrm2_work_section_id = ws.id
        LEFT JOIN nrm2_sub_elements se ON ws.sub_element_id = se.id
        LEFT JOIN nrm2_elements e ON se.element_id = e.id
        LEFT JOIN nrm2_groups g ON e.group_id = g.id
        WHERE pe.project_id = ? AND pe.is_active = 1
        ORDER BY
          COALESCE(g.sort_order, 999),
          COALESCE(e.sort_order, 999),
          COALESCE(se.sort_order, 999),
          COALESCE(ws.sort_order, 999),
          pe.id
      `);
            estimatesWithNRM2 = stmt.all(projectIdNum);
        }
        else {
            // Standard estimates
            estimatesWithNRM2 = projectEstimatesRepository.getAll(projectIdNum);
        }
        if (estimatesWithNRM2.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No line items to export',
            });
            return;
        }
        // Calculate totals
        const totals = calculateProjectTotal(projectIdNum);
        // Create PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
        });
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="BOQ_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`);
        // Pipe to response
        doc.pipe(res);
        // Header
        doc
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('BILL OF QUANTITIES', { align: 'center' })
            .moveDown(0.5);
        // Project Details
        doc.fontSize(11).font('Helvetica');
        doc.text(`Project: ${project.name}`, { underline: false });
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`);
        if (project.start_date) {
            doc.text(`Start Date: ${new Date(project.start_date).toLocaleDateString('en-GB')}`);
        }
        if (project.project_address) {
            doc.text(`Address: ${project.project_address}`);
        }
        // if (project.floor_area_m2) {
        //   doc.text(`Floor Area: ${project.floor_area_m2.toLocaleString('en-GB')} m²`)
        // }
        doc.moveDown();
        // Render based on groupBy parameter
        let yPosition = doc.y;
        const pageHeight = doc.page.height;
        const bottomMargin = 50;
        if (groupBy === 'nrm2' && estimatesWithNRM2.length > 0) {
            // Group by NRM 2 structure
            const groupedByNRM2 = {};
            estimatesWithNRM2.forEach((item) => {
                const groupKey = item.nrm2_group_code || 'Other Items';
                if (!groupedByNRM2[groupKey]) {
                    groupedByNRM2[groupKey] = {
                        groupCode: item.nrm2_group_code || 'Other',
                        groupTitle: item.nrm2_group_title || 'Other Items',
                        elementCode: item.nrm2_element_code || '',
                        elementTitle: item.nrm2_element_title || '',
                        items: [],
                    };
                }
                groupedByNRM2[groupKey].items.push(item);
            });
            // Render Preliminaries first if it exists
            if (groupedByNRM2['A']) {
                const prelimGroup = groupedByNRM2['A'];
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C5F8D');
                doc.text('A. PRELIMINARIES/GENERAL CONDITIONS', { underline: true });
                yPosition = doc.y;
                doc.moveDown(0.3);
                prelimGroup.items.forEach((item) => {
                    const estimatedHeight = 40;
                    if (yPosition + estimatedHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        yPosition = 50;
                    }
                    doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
                    const codePrefix = item.nrm2_code ? `${item.nrm2_code} - ` : '';
                    const description = item.custom_description || item.description || '';
                    doc.text(`${codePrefix}${description}`);
                    doc.fontSize(9).font('Helvetica').fillColor('#666666');
                    const detailsText = `  ${item.quantity} ${item.custom_unit || item.unit_code || 'nr'} @ £${(item.custom_unit_rate || item.material_cost || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    doc.text(detailsText);
                    const lineTotal = (item.custom_unit_rate ? item.custom_unit_rate * item.quantity : item.line_total) || 0;
                    const totalText = `£${lineTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    const y = doc.y - 15;
                    doc.fontSize(10).fillColor('black').text(totalText, 340, y, {
                        width: 100,
                        align: 'right',
                    });
                    yPosition = doc.y;
                    doc.moveDown(0.2);
                });
                doc.moveDown(0.5);
                yPosition = doc.y;
            }
            // Render other groups
            const otherKeys = Object.keys(groupedByNRM2)
                .filter((k) => k !== 'A' && k !== 'Other Items')
                .sort();
            otherKeys.forEach((groupKey) => {
                const group = groupedByNRM2[groupKey];
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C5F8D');
                doc.text(`${group.groupCode}. ${group.groupTitle}`, { underline: true });
                yPosition = doc.y;
                doc.moveDown(0.3);
                group.items.forEach((item) => {
                    const estimatedHeight = 40;
                    if (yPosition + estimatedHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        yPosition = 50;
                    }
                    doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
                    const codePrefix = item.nrm2_code ? `${item.nrm2_code} - ` : '';
                    const description = item.custom_description || item.description || '';
                    doc.text(`${codePrefix}${description}`);
                    doc.fontSize(9).font('Helvetica').fillColor('#666666');
                    const detailsText = `  ${item.quantity} ${item.custom_unit || item.unit_code || 'nr'} @ £${(item.custom_unit_rate || item.material_cost || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    doc.text(detailsText);
                    const lineTotal = (item.custom_unit_rate ? item.custom_unit_rate * item.quantity : item.line_total) || 0;
                    const totalText = `£${lineTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    const y = doc.y - 15;
                    doc.fontSize(10).fillColor('black').text(totalText, 340, y, {
                        width: 100,
                        align: 'right',
                    });
                    yPosition = doc.y;
                    doc.moveDown(0.2);
                });
                doc.moveDown(0.5);
                yPosition = doc.y;
            });
            // Render Other Items if they exist
            if (groupedByNRM2['Other Items']) {
                const otherGroup = groupedByNRM2['Other Items'];
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#2C5F8D');
                doc.text('OTHER ITEMS', { underline: true });
                yPosition = doc.y;
                doc.moveDown(0.3);
                otherGroup.items.forEach((item) => {
                    const estimatedHeight = 40;
                    if (yPosition + estimatedHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        yPosition = 50;
                    }
                    doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
                    const description = item.custom_description || item.description || '';
                    doc.text(description);
                    doc.fontSize(9).font('Helvetica').fillColor('#666666');
                    const detailsText = `  ${item.quantity} ${item.custom_unit || item.unit_code || 'nr'} @ £${(item.custom_unit_rate || item.material_cost || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    doc.text(detailsText);
                    const lineTotal = (item.custom_unit_rate ? item.custom_unit_rate * item.quantity : item.line_total) || 0;
                    const totalText = `£${lineTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    const y = doc.y - 15;
                    doc.fontSize(10).fillColor('black').text(totalText, 340, y, {
                        width: 100,
                        align: 'right',
                    });
                    yPosition = doc.y;
                    doc.moveDown(0.2);
                });
            }
        }
        else {
            // Render by category (default behavior)
            totals.categories.forEach((category) => {
                // Check if we need a new page
                const estimatedHeight = 30 + category.line_items.length * 25 + 25;
                if (yPosition + estimatedHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    yPosition = 50;
                }
                // Category header
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#2C5F8D');
                doc.text(`${category.line_count}. ${category.category_name}`, {
                    underline: true,
                });
                yPosition = doc.y;
                doc.moveDown(0.3);
                // Line items in category
                doc.fontSize(10).font('Helvetica').fillColor('black');
                category.line_items.forEach((item) => {
                    const totalText = `£${item.line_total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    const descLine = `${item.estimate_id}. ${item.description}`;
                    // Description line
                    doc.text(descLine, {
                        width: 350,
                        continued: false,
                    });
                    // Details line
                    const detailsText = `  ${item.quantity} ${item.unit_code} @ £${item.material_cost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    doc.fontSize(9).fillColor('#666666').text(detailsText);
                    doc.fontSize(10).fillColor('black');
                    // Price (right-aligned)
                    const y = doc.y - 25;
                    doc.text(totalText, 340, y, {
                        width: 100,
                        align: 'right',
                    });
                    yPosition = doc.y;
                });
                // Category subtotal
                doc.fontSize(10).font('Helvetica-Bold');
                const subtotalText = `${category.category_name} Subtotal: £${category.subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                doc.text(subtotalText);
                doc.moveDown(0.3);
                yPosition = doc.y;
            });
        }
        // Summary section
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11);
        doc.text(`Subtotal: £${totals.subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        doc.text(`Contingency (${totals.contingency_percentage}%): £${totals.contingency_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`GRAND TOTAL: £${totals.grand_total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        if (totals.cost_per_m2) {
            doc.fontSize(10).font('Helvetica');
            doc.text(`Cost per m²: £${totals.cost_per_m2.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
        // Footer
        doc.moveDown();
        doc.fontSize(9).fillColor('#666666').text('Generated by QSCostingPro', { align: 'center' });
        logger.info(`PDF exported for project ${projectIdNum} by user ${req.user?.username}`);
        doc.end();
    }
    catch (error) {
        logger.error(`Error exporting PDF: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to generate PDF',
        });
    }
});
export default router;
//# sourceMappingURL=estimatesExport.js.map