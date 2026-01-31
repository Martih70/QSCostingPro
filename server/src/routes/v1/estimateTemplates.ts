import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { estimateTemplateRepository } from '../../repositories/estimateTemplateRepository.js';
import { projectsRepository } from '../../repositories/projectRepository.js';
import logger from '../../utils/logger.js';

const router = Router();

// Validation schemas
const templateLineItemSchema = z.object({
  cost_item_id: z.number().optional().nullable(),
  custom_description: z.string().max(255).optional().nullable(),
  custom_unit_rate: z.number().positive().optional().nullable(),
  custom_unit: z.string().max(50).optional().nullable(),
  category_id: z.number().optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  unit_cost_override: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  template_type: z.enum(['quick', 'standard', 'complex']).optional(),
  is_public: z.boolean().optional(),
  line_items: z.array(templateLineItemSchema).min(1),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional().nullable(),
  template_type: z.enum(['quick', 'standard', 'complex']).optional(),
  is_public: z.boolean().optional(),
  line_items: z.array(templateLineItemSchema).optional(),
});

/**
 * GET /api/v1/estimate-templates
 * Get all estimate templates for the user
 */
router.get('/', verifyAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const includeShared = req.query.shared ? req.query.shared === 'true' : true;
    const templates = estimateTemplateRepository.getAll(user.userId, includeShared);

    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    logger.error(`Error fetching templates: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
});

/**
 * GET /api/v1/estimate-templates/:id
 * Get a specific template with all its line items
 */
router.get('/:id', verifyAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const template = estimateTemplateRepository.getById(parseInt(req.params.id), user.userId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error(`Error fetching template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
    });
  }
});

/**
 * POST /api/v1/estimate-templates
 * Create a new estimate template
 */
router.post('/', verifyAuth, validate(createTemplateSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const template = estimateTemplateRepository.create(user.userId, req.body);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error(`Error creating template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
    });
  }
});

/**
 * PUT /api/v1/estimate-templates/:id
 * Update an existing template
 */
router.put('/:id', verifyAuth, validate(updateTemplateSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const template = estimateTemplateRepository.update(parseInt(req.params.id), user.userId, req.body);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found or you do not have permission to update it',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error(`Error updating template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
    });
  }
});

/**
 * DELETE /api/v1/estimate-templates/:id
 * Delete an estimate template
 */
router.delete('/:id', verifyAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const success = estimateTemplateRepository.delete(parseInt(req.params.id), user.userId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Template not found or you do not have permission to delete it',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Error deleting template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
    });
  }
});

/**
 * POST /api/v1/projects/:projectId/apply-template/:templateId
 * Apply a template to a project (creates estimates from template)
 */
router.post('/apply/:templateId/to/:projectId', verifyAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const projectId = parseInt(req.params.projectId);
    const templateId = parseInt(req.params.templateId);

    // Verify project exists and user has access
    const project = projectsRepository.getById(projectId);
    if (!project || project.created_by !== user.userId) {
      res.status(404).json({
        success: false,
        error: 'Project not found or you do not have permission',
      });
      return;
    }

    // Get template
    const template = estimateTemplateRepository.getById(templateId, user.userId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    // For now, just return the template data
    // The client will handle creating estimates from template items
    res.json({
      success: true,
      data: template,
      message: 'Template loaded. Add quantities to create estimates.',
    });
  } catch (error: any) {
    logger.error(`Error applying template: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to apply template',
    });
  }
});

export default router;
