import { Router } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { projectEstimatesRepository, projectsRepository, costComponentsRepository } from '../../repositories/projectRepository.js';
import { costItemsRepository } from '../../repositories/costRepository.js';
import { calculateProjectTotal } from '../../services/estimationEngine.js';
import logger from '../../utils/logger.js';
const router = Router();
// Validation schemas
const createEstimateSchema = z.object({
    // Either cost_item_id OR custom fields must be provided
    cost_item_id: z.number().int().positive().optional(),
    quantity: z.number().positive(),
    unit_cost_override: z.number().nonnegative().optional(),
    notes: z.string().max(500).optional(),
    // Custom item fields (used when cost_item_id not provided)
    custom_description: z.string().min(3).max(255).optional(),
    custom_unit_rate: z.number().nonnegative().optional(),
    custom_unit: z.string().min(1).max(50).optional(),
    category_id: z.number().int().positive().optional(),
    // NRM 2 fields (optional, link to NRM 2 work sections)
    nrm2_work_section_id: z.number().int().positive().optional(),
    nrm2_code: z.string().max(50).optional(),
}).refine((data) => data.cost_item_id || (data.custom_description && data.custom_unit_rate !== undefined && data.custom_unit && data.category_id), { message: 'Either cost_item_id or all custom fields (description, unit, rate, category) must be provided' });
const updateEstimateSchema = z.object({
    quantity: z.number().positive().optional(),
    unit_cost_override: z.number().nonnegative().optional().nullable(),
    notes: z.string().max(500).optional(),
});
/**
 * GET /api/v1/projects/:projectId/estimates
 * Get all estimates for a project with calculations
 */
router.get('/:projectId/estimates', verifyAuth, (req, res) => {
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
        // Check access - viewers can only see projects they created
        if (req.user?.role === 'viewer' && project.created_by !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        // Get estimates
        const estimates = projectEstimatesRepository.getAll(projectIdNum);
        // Get project totals
        let totals = null;
        try {
            totals = calculateProjectTotal(projectIdNum);
        }
        catch (error) {
            logger.warn(`Could not calculate project totals: ${error}`);
        }
        res.json({
            success: true,
            data: {
                project_id: projectIdNum,
                estimate_count: estimates.length,
                estimates,
                totals,
            },
        });
    }
    catch (error) {
        logger.error(`Error fetching project estimates: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch estimates',
        });
    }
});
/**
 * GET /api/v1/projects/:projectId/estimates/by-bcis-element
 * Get all estimates grouped by BCIS element for elemental BoQ output
 */
router.get('/:projectId/estimates/by-bcis-element', verifyAuth, (req, res) => {
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
        // Get estimates grouped by BCIS element
        const groupedEstimates = projectEstimatesRepository.getEstimatesByBCISElement(projectIdNum);
        res.json({
            success: true,
            data: groupedEstimates,
        });
    }
    catch (error) {
        logger.error(`Error fetching estimates by BCIS element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch estimates by BCIS element',
        });
    }
});
/**
 * GET /api/v1/projects/:projectId/estimates/:id
 * Get specific estimate
 */
router.get('/:projectId/estimates/:id', verifyAuth, (req, res) => {
    try {
        const { projectId, id } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const estimateId = parseInt(id, 10);
        if (isNaN(projectIdNum) || isNaN(estimateId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID',
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
        const estimate = projectEstimatesRepository.getById(estimateId);
        if (!estimate || estimate.project_id !== projectIdNum) {
            res.status(404).json({
                success: false,
                error: 'Estimate not found',
            });
            return;
        }
        res.json({
            success: true,
            data: estimate,
        });
    }
    catch (error) {
        logger.error(`Error fetching estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch estimate',
        });
    }
});
/**
 * POST /api/v1/projects/:projectId/estimates
 * Add cost item to project estimate
 * Requires: admin or estimator role
 */
router.post('/:projectId/estimates', verifyAuth, authorize('admin', 'estimator'), validate(createEstimateSchema), (req, res) => {
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
        // Check authorization
        if (req.user?.role !== 'admin' && project.created_by !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        const { cost_item_id, quantity, unit_cost_override, notes, custom_description, custom_unit_rate, custom_unit, category_id, nrm2_work_section_id, nrm2_code } = req.body;
        let lineTotal = 0;
        let estimateData = {
            project_id: projectIdNum,
            quantity,
            notes,
            created_by: req.user.userId,
            nrm2_work_section_id: nrm2_work_section_id || null,
            nrm2_code: nrm2_code || null,
        };
        if (cost_item_id) {
            // Using existing cost item from database
            const costItem = costItemsRepository.getById(cost_item_id);
            if (!costItem) {
                res.status(404).json({
                    success: false,
                    error: 'Cost item not found',
                });
                return;
            }
            const materialCost = unit_cost_override || costItem.material_cost;
            const materialTotal = materialCost * quantity * costItem.waste_factor;
            const managementTotal = costItem.management_cost * quantity;
            const contractorTotal = costItem.is_contractor_required ? costItem.contractor_cost * quantity : 0;
            lineTotal = materialTotal + managementTotal + contractorTotal;
            estimateData.cost_item_id = cost_item_id;
            estimateData.unit_cost_override = unit_cost_override;
        }
        else if (custom_description && custom_unit_rate !== undefined) {
            // Custom item - simple calculation (no waste factor, management, contractor costs)
            lineTotal = custom_unit_rate * quantity;
            // Store custom item data in database
            estimateData.custom_description = custom_description;
            estimateData.custom_unit_rate = custom_unit_rate;
            estimateData.custom_unit = custom_unit || 'nr';
            estimateData.category_id = category_id || 1; // Default to first category if not specified
        }
        estimateData.line_total = lineTotal;
        // Create estimate
        const estimate = projectEstimatesRepository.create(estimateData);
        const itemDesc = cost_item_id ? `cost_item_id ${cost_item_id}` : custom_description;
        logger.info(`Estimate added to project ${projectIdNum}: ${itemDesc} x${quantity} by user ${req.user?.username}`);
        res.status(201).json({
            success: true,
            data: estimate,
        });
    }
    catch (error) {
        logger.error(`Error creating estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to add estimate',
        });
    }
});
/**
 * PUT /api/v1/projects/:projectId/estimates/:id
 * Update estimate line item
 * Requires: admin or estimator role
 */
router.put('/:projectId/estimates/:id', verifyAuth, authorize('admin', 'estimator'), validate(updateEstimateSchema), (req, res) => {
    try {
        const { projectId, id } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const estimateId = parseInt(id, 10);
        if (isNaN(projectIdNum) || isNaN(estimateId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID',
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
        // Check authorization
        if (req.user?.role !== 'admin' && project.created_by !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        // Check if estimate exists
        const existing = projectEstimatesRepository.getById(estimateId);
        if (!existing || existing.project_id !== projectIdNum) {
            res.status(404).json({
                success: false,
                error: 'Estimate not found',
            });
            return;
        }
        const { quantity, unit_cost_override, notes } = req.body;
        // Recalculate line total if quantity changed
        let lineTotal = existing.line_total ?? 0;
        if (quantity !== undefined || unit_cost_override !== undefined) {
            const costItem = costItemsRepository.getById(existing.cost_item_id);
            if (costItem) {
                const qty = quantity || existing.quantity;
                const unitCost = unit_cost_override !== undefined ? unit_cost_override : costItem.material_cost;
                const materialTotal = unitCost * qty * costItem.waste_factor;
                const managementTotal = costItem.management_cost * qty;
                const contractorTotal = costItem.is_contractor_required
                    ? costItem.contractor_cost * qty
                    : 0;
                lineTotal = materialTotal + managementTotal + contractorTotal;
            }
        }
        const estimate = projectEstimatesRepository.update(estimateId, {
            quantity,
            unit_cost_override,
            notes,
            line_total: lineTotal,
        });
        logger.info(`Estimate updated: ID ${estimateId} by user ${req.user?.username}`);
        res.json({
            success: true,
            data: estimate,
        });
    }
    catch (error) {
        logger.error(`Error updating estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update estimate',
        });
    }
});
/**
 * DELETE /api/v1/projects/:projectId/estimates/:id
 * Delete estimate line item
 * Requires: admin or estimator role
 */
router.delete('/:projectId/estimates/:id', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { projectId, id } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const estimateId = parseInt(id, 10);
        if (isNaN(projectIdNum) || isNaN(estimateId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID',
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
        // Check authorization
        if (req.user?.role !== 'admin' && project.created_by !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        // Check if estimate exists
        const existing = projectEstimatesRepository.getById(estimateId);
        if (!existing || existing.project_id !== projectIdNum) {
            res.status(404).json({
                success: false,
                error: 'Estimate not found',
            });
            return;
        }
        const deleted = projectEstimatesRepository.delete(estimateId);
        if (!deleted) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete estimate',
            });
            return;
        }
        logger.info(`Estimate deleted: ID ${estimateId} from project ${projectIdNum} by user ${req.user?.username}`);
        res.json({
            success: true,
            message: 'Estimate deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to delete estimate',
        });
    }
});
/**
 * GET /api/v1/projects/:projectId/estimate-summary
 * Get complete estimate calculation with breakdown
 */
router.get('/:projectId/estimate-summary', verifyAuth, (req, res) => {
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
        const totals = calculateProjectTotal(projectIdNum);
        res.json({
            success: true,
            data: {
                project: {
                    id: project.id,
                    name: project.name,
                    client_id: project.client_id,
                    budget_cost: project.budget_cost,
                    start_date: project.start_date,
                },
                estimate: totals,
            },
        });
    }
    catch (error) {
        logger.error(`Error calculating estimate summary: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate estimate',
        });
    }
});
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
        // if (project.location) {
        //   doc.text(`Location: ${project.location}`);
        // }
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
            category.line_items.forEach((item) => {
                const totalText = `£${item.line_total.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
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
        doc.text(`Subtotal: £${totals.subtotal.toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`);
        doc.text(`Contingency (${totals.contingency_percentage}%): £${totals.contingency_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`GRAND TOTAL: £${totals.grand_total.toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`);
        if (totals.cost_per_m2) {
            doc.fontSize(10).font('Helvetica');
            doc.text(`Cost per m²: £${totals.cost_per_m2.toLocaleString('en-GB', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`);
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
/**
 * POST /api/v1/projects/:projectId/estimates/:estimateId/cost-components
 * Add a cost component (material, labor, or plant) to an estimate
 */
router.post('/:projectId/estimates/:estimateId/cost-components', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { projectId, estimateId } = req.params;
        const { component_type, unit_rate, waste_factor } = req.body;
        const projectIdNum = parseInt(projectId, 10);
        const estimateIdNum = parseInt(estimateId, 10);
        if (isNaN(projectIdNum) || isNaN(estimateIdNum)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project or estimate ID',
            });
            return;
        }
        // Validate input
        if (!['material', 'labor', 'plant'].includes(component_type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid component type. Must be material, labor, or plant',
            });
            return;
        }
        if (typeof unit_rate !== 'number' || unit_rate < 0) {
            res.status(400).json({
                success: false,
                error: 'Unit rate must be a non-negative number',
            });
            return;
        }
        if (typeof waste_factor !== 'number' || waste_factor <= 0) {
            res.status(400).json({
                success: false,
                error: 'Waste factor must be a positive number (e.g., 1.05 for 5% waste)',
            });
            return;
        }
        // Check project exists
        const project = projectsRepository.getById(projectIdNum);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        // Check estimate exists
        const estimate = projectEstimatesRepository.getById(estimateIdNum);
        if (!estimate || estimate.project_id !== projectIdNum) {
            res.status(404).json({
                success: false,
                error: 'Estimate not found',
            });
            return;
        }
        // Create cost component
        const component = costComponentsRepository.create({
            estimate_id: estimateIdNum,
            component_type,
            unit_rate,
            waste_factor,
        });
        // Recalculate component totals
        costComponentsRepository.recalculateComponentTotals(estimateIdNum);
        res.status(201).json({
            success: true,
            data: component,
        });
    }
    catch (error) {
        logger.error(`Error creating cost component: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to create cost component',
        });
    }
});
/**
 * PATCH /api/v1/projects/:projectId/estimates/:estimateId/cost-components/:componentId
 * Update a cost component (unit rate and/or waste factor)
 */
router.patch('/:projectId/estimates/:estimateId/cost-components/:componentId', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { projectId, estimateId, componentId } = req.params;
        const { unit_rate, waste_factor } = req.body;
        const projectIdNum = parseInt(projectId, 10);
        const estimateIdNum = parseInt(estimateId, 10);
        const componentIdNum = parseInt(componentId, 10);
        if (isNaN(projectIdNum) || isNaN(estimateIdNum) || isNaN(componentIdNum)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID',
            });
            return;
        }
        // Check project exists
        const project = projectsRepository.getById(projectIdNum);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        // Check estimate exists
        const estimate = projectEstimatesRepository.getById(estimateIdNum);
        if (!estimate || estimate.project_id !== projectIdNum) {
            res.status(404).json({
                success: false,
                error: 'Estimate not found',
            });
            return;
        }
        // Check component exists
        const component = costComponentsRepository.getById(componentIdNum);
        if (!component || component.estimate_id !== estimateIdNum) {
            res.status(404).json({
                success: false,
                error: 'Cost component not found',
            });
            return;
        }
        // Validate input if provided
        if (unit_rate !== undefined && (typeof unit_rate !== 'number' || unit_rate < 0)) {
            res.status(400).json({
                success: false,
                error: 'Unit rate must be a non-negative number',
            });
            return;
        }
        if (waste_factor !== undefined && (typeof waste_factor !== 'number' || waste_factor <= 0)) {
            res.status(400).json({
                success: false,
                error: 'Waste factor must be a positive number',
            });
            return;
        }
        // Update component
        const updated = costComponentsRepository.update(componentIdNum, {
            unit_rate,
            waste_factor,
        });
        // Recalculate component totals
        costComponentsRepository.recalculateComponentTotals(estimateIdNum);
        res.json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        logger.error(`Error updating cost component: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update cost component',
        });
    }
});
/**
 * DELETE /api/v1/projects/:projectId/estimates/:estimateId/cost-components/:componentId
 * Remove a cost component from an estimate
 */
router.delete('/:projectId/estimates/:estimateId/cost-components/:componentId', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { projectId, estimateId, componentId } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const estimateIdNum = parseInt(estimateId, 10);
        const componentIdNum = parseInt(componentId, 10);
        if (isNaN(projectIdNum) || isNaN(estimateIdNum) || isNaN(componentIdNum)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID',
            });
            return;
        }
        // Check project exists
        const project = projectsRepository.getById(projectIdNum);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        // Check estimate exists
        const estimate = projectEstimatesRepository.getById(estimateIdNum);
        if (!estimate || estimate.project_id !== projectIdNum) {
            res.status(404).json({
                success: false,
                error: 'Estimate not found',
            });
            return;
        }
        // Check component exists
        const component = costComponentsRepository.getById(componentIdNum);
        if (!component || component.estimate_id !== estimateIdNum) {
            res.status(404).json({
                success: false,
                error: 'Cost component not found',
            });
            return;
        }
        // Delete component
        const deleted = costComponentsRepository.delete(componentIdNum);
        if (!deleted) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete cost component',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Cost component deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting cost component: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to delete cost component',
        });
    }
});
export default router;
//# sourceMappingURL=projectEstimates.js.map