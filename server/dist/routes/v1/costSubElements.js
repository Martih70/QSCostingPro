import { Router } from 'express';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, createSubElementSchema, updateSubElementSchema } from '../../middleware/validate.js';
import { subElementsRepository, categoriesRepository } from '../../repositories/costRepository.js';
import logger from '../../utils/logger.js';
const router = Router();
/**
 * GET /api/v1/cost-sub-elements
 * Get all cost sub-elements
 */
router.get('/', verifyAuth, (_req, res) => {
    try {
        const subElements = subElementsRepository.getAll();
        res.json({
            success: true,
            data: subElements,
            count: subElements.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching sub-elements: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sub-elements',
        });
    }
});
/**
 * GET /api/v1/cost-sub-elements/:id
 * Get a specific cost sub-element
 */
router.get('/:id', verifyAuth, (req, res) => {
    try {
        const { id } = req.params;
        const subElementId = parseInt(id, 10);
        if (isNaN(subElementId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid sub-element ID',
            });
            return;
        }
        const subElement = subElementsRepository.getById(subElementId);
        if (!subElement) {
            res.status(404).json({
                success: false,
                error: 'Sub-element not found',
            });
            return;
        }
        res.json({
            success: true,
            data: subElement,
        });
    }
    catch (error) {
        logger.error(`Error fetching sub-element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sub-element',
        });
    }
});
/**
 * GET /api/v1/cost-sub-elements/category/:categoryId
 * Get all sub-elements for a specific category
 */
router.get('/category/:categoryId', verifyAuth, (req, res) => {
    try {
        const { categoryId } = req.params;
        const catId = parseInt(categoryId, 10);
        if (isNaN(catId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid category ID',
            });
            return;
        }
        // Check if category exists
        const category = categoriesRepository.getById(catId);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }
        const subElements = subElementsRepository.getByCategoryId(catId);
        res.json({
            success: true,
            data: subElements,
            count: subElements.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching sub-elements by category: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sub-elements',
        });
    }
});
/**
 * POST /api/v1/cost-sub-elements
 * Create a new cost sub-element
 * Requires: admin or estimator role
 */
router.post('/', verifyAuth, authorize('admin', 'estimator'), validate(createSubElementSchema), (req, res) => {
    try {
        const { category_id, code, name, description, sort_order } = req.body;
        // Check if category exists
        const category = categoriesRepository.getById(category_id);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }
        const subElement = subElementsRepository.create({
            category_id,
            code,
            name,
            description,
            sort_order,
        });
        logger.info(`Sub-element created: ${subElement.code} in category ${category.code} by user ${req.user?.username}`);
        res.status(201).json({
            success: true,
            data: subElement,
        });
    }
    catch (error) {
        logger.error(`Error creating sub-element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to create sub-element',
        });
    }
});
/**
 * PUT /api/v1/cost-sub-elements/:id
 * Update a cost sub-element
 * Requires: admin or estimator role
 */
router.put('/:id', verifyAuth, authorize('admin', 'estimator'), validate(updateSubElementSchema), (req, res) => {
    try {
        const { id } = req.params;
        const subElementId = parseInt(id, 10);
        if (isNaN(subElementId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid sub-element ID',
            });
            return;
        }
        // Check if sub-element exists
        const existing = subElementsRepository.getById(subElementId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Sub-element not found',
            });
            return;
        }
        const { name, description, sort_order } = req.body;
        const subElement = subElementsRepository.update(subElementId, {
            name,
            description,
            sort_order,
        });
        logger.info(`Sub-element updated: ${subElement.code} by user ${req.user?.username}`);
        res.json({
            success: true,
            data: subElement,
        });
    }
    catch (error) {
        logger.error(`Error updating sub-element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update sub-element',
        });
    }
});
/**
 * DELETE /api/v1/cost-sub-elements/:id
 * Delete a cost sub-element
 * Requires: admin role
 */
router.delete('/:id', verifyAuth, authorize('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const subElementId = parseInt(id, 10);
        if (isNaN(subElementId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid sub-element ID',
            });
            return;
        }
        // Check if sub-element exists
        const existing = subElementsRepository.getById(subElementId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Sub-element not found',
            });
            return;
        }
        const deleted = subElementsRepository.delete(subElementId);
        if (!deleted) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete sub-element',
            });
            return;
        }
        logger.info(`Sub-element deleted: ${existing.code} by user ${req.user?.username}`);
        res.json({
            success: true,
            message: 'Sub-element deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting sub-element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to delete sub-element',
        });
    }
});
export default router;
//# sourceMappingURL=costSubElements.js.map