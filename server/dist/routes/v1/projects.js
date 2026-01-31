import { Router } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { projectsRepository } from '../../repositories/projectRepository.js';
import { calculateProjectTotal } from '../../services/estimationEngine.js';
import logger from '../../utils/logger.js';
const router = Router();
// Validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1).max(255),
    client_id: z.number().int().positive(),
    contractor_id: z.number().int().positive().optional(),
    budget_cost: z.number().nonnegative().optional(),
    start_date: z.string().date(),
    project_address: z.string().max(500).optional(),
    description: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional(),
});
const updateProjectSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    client_id: z.number().int().positive().optional(),
    contractor_id: z.number().int().positive().optional().nullable(),
    budget_cost: z.number().nonnegative().optional().nullable(),
    start_date: z.string().date().optional(),
    project_address: z.string().max(500).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    status: z.enum(['draft', 'in_progress', 'completed']).optional(),
});
/**
 * GET /api/v1/projects
 * Get all projects (filtered by role)
 */
router.get('/', verifyAuth, (req, res) => {
    try {
        const projects = projectsRepository.getAll(req.user?.userId, req.user?.role);
        res.json({
            success: true,
            data: projects,
            count: projects.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching projects: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
        });
    }
});
/**
 * GET /api/v1/projects/:id
 * Get specific project with estimate totals
 */
router.get('/:id', verifyAuth, (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        const project = projectsRepository.getById(projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        // Check access - viewers can only see their own projects
        if (req.user?.role === 'viewer' && project.created_by !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        // Get estimate totals
        let estimateTotals = null;
        try {
            estimateTotals = calculateProjectTotal(projectId);
        }
        catch (error) {
            logger.warn(`Could not calculate estimate for project ${projectId}: ${error}`);
        }
        res.json({
            success: true,
            data: {
                ...project,
                estimate_totals: estimateTotals,
            },
        });
    }
    catch (error) {
        logger.error(`Error fetching project: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project',
        });
    }
});
/**
 * POST /api/v1/projects
 * Create new project
 * Requires: admin or estimator role
 */
router.post('/', verifyAuth, authorize('admin', 'estimator'), validate(createProjectSchema), (req, res) => {
    try {
        const { name, client_id, contractor_id, budget_cost, start_date, project_address, description, notes, } = req.body;
        const project = projectsRepository.create({
            name,
            client_id,
            contractor_id,
            budget_cost,
            start_date,
            project_address,
            description,
            notes,
            created_by: req.user.userId,
        });
        logger.info(`Project created: ${project.name} (ID: ${project.id}) by user ${req.user?.username}`);
        res.status(201).json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        logger.error(`Error creating project: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to create project',
        });
    }
});
/**
 * PUT /api/v1/projects/:id
 * Update project
 * Requires: admin or project creator
 */
router.put('/:id', verifyAuth, validate(updateProjectSchema), (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        // Check if project exists
        const existing = projectsRepository.getById(projectId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        // Check authorization
        if (req.user?.role !== 'admin' && existing.created_by !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }
        const { name, client_id, contractor_id, budget_cost, start_date, project_address, description, notes, status, } = req.body;
        const project = projectsRepository.update(projectId, {
            name,
            client_id,
            contractor_id,
            budget_cost,
            start_date,
            project_address,
            description,
            notes,
            status,
        });
        logger.info(`Project updated: ${project.name} (ID: ${project.id}) by user ${req.user?.username}`);
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        logger.error(`Error updating project: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update project',
        });
    }
});
/**
 * DELETE /api/v1/projects/:id
 * Delete project
 * Requires: admin role
 */
router.delete('/:id', verifyAuth, authorize('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        // Check if project exists
        const existing = projectsRepository.getById(projectId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        const deleted = projectsRepository.delete(projectId);
        if (!deleted) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete project',
            });
            return;
        }
        logger.info(`Project deleted: ${existing.name} (ID: ${existing.id}) by user ${req.user?.username}`);
        res.json({
            success: true,
            message: 'Project deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting project: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to delete project',
        });
    }
});
/**
 * POST /api/v1/projects/:id/submit-estimate
 * Submit project estimate for approval
 * Requires: admin or estimator role
 */
router.post('/:id/submit-estimate', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        const existing = projectsRepository.getById(projectId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        const project = projectsRepository.submitEstimate(projectId);
        logger.info(`Estimate submitted for project: ${project.name} by user ${req.user?.username}`);
        res.json({
            success: true,
            data: project,
            message: 'Estimate submitted for approval',
        });
    }
    catch (error) {
        logger.error(`Error submitting estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to submit estimate',
        });
    }
});
/**
 * POST /api/v1/projects/:id/approve-estimate
 * Approve project estimate
 * Requires: admin role
 */
router.post('/:id/approve-estimate', verifyAuth, authorize('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        const existing = projectsRepository.getById(projectId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        const project = projectsRepository.approveEstimate(projectId, req.user.userId, notes);
        logger.info(`Estimate approved for project: ${project.name} by user ${req.user?.username}`);
        res.json({
            success: true,
            data: project,
            message: 'Estimate approved',
        });
    }
    catch (error) {
        logger.error(`Error approving estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to approve estimate',
        });
    }
});
/**
 * POST /api/v1/projects/:id/reject-estimate
 * Reject project estimate
 * Requires: admin role
 */
router.post('/:id/reject-estimate', verifyAuth, authorize('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid project ID',
            });
            return;
        }
        const existing = projectsRepository.getById(projectId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Project not found',
            });
            return;
        }
        const project = projectsRepository.rejectEstimate(projectId, reason);
        logger.info(`Estimate rejected for project: ${project.name} by user ${req.user?.username}`);
        res.json({
            success: true,
            data: project,
            message: 'Estimate rejected',
        });
    }
    catch (error) {
        logger.error(`Error rejecting estimate: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to reject estimate',
        });
    }
});
export default router;
//# sourceMappingURL=projects.js.map