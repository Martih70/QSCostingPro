import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { verifyAuth } from '../../middleware/auth.js';
import { projectsRepository, projectEstimatesRepository } from '../../repositories/projectRepository.js';
import { calculateProjectTotal } from '../../services/estimationEngine.js';
import logger from '../../utils/logger.js';
const router = Router();
/**
 * GET /api/v1/projects/:projectId/estimates/export-pdf
 * Generate and download BoQ PDF
 */
router.get('/:projectId/estimates/export-pdf', verifyAuth, (req, res) => {
    try {
        const { projectId } = req.params;
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
        // Get estimates
        const estimates = projectEstimatesRepository.getAll(projectIdNum);
        if (estimates.length === 0) {
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
        if (project.floor_area_m2) {
            doc.text(`Floor Area: ${project.floor_area_m2.toLocaleString('en-GB')} m²`);
        }
        doc.moveDown();
        // Category sections
        let yPosition = doc.y;
        const pageHeight = doc.page.height;
        const bottomMargin = 50;
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
            category.line_items.forEach((item, idx) => {
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