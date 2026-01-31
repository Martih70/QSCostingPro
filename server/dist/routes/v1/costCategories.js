import { Router } from 'express';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate, createCategorySchema, updateCategorySchema } from '../../middleware/validate.js';
import { categoriesRepository } from '../../repositories/costRepository.js';
import logger from '../../utils/logger.js';
const router = Router();
/**
 * GET /api/v1/cost-categories
 * Get all cost categories
 */
router.get('/', verifyAuth, (_req, res) => {
    try {
        const categories = categoriesRepository.getAll();
        res.json({
            success: true,
            data: categories,
            count: categories.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching categories: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
        });
    }
});
/**
 * GET /api/v1/cost-categories/:id
 * Get a specific cost category
 */
router.get('/:id', verifyAuth, (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid category ID',
            });
            return;
        }
        const category = categoriesRepository.getById(categoryId);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }
        res.json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        logger.error(`Error fetching category: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category',
        });
    }
});
/**
 * POST /api/v1/cost-categories
 * Create a new cost category
 * Requires: admin or estimator role
 */
router.post('/', verifyAuth, authorize('admin', 'estimator'), validate(createCategorySchema), (req, res) => {
    try {
        const { code, name, description, sort_order } = req.body;
        // Check if code already exists
        const existing = categoriesRepository.getByCode(code);
        if (existing) {
            res.status(409).json({
                success: false,
                error: 'Category code already exists',
            });
            return;
        }
        const category = categoriesRepository.create({
            code,
            name,
            description,
            sort_order,
        });
        logger.info(`Category created: ${category.code} by user ${req.user?.username}`);
        res.status(201).json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        logger.error(`Error creating category: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to create category',
        });
    }
});
/**
 * PUT /api/v1/cost-categories/:id
 * Update a cost category
 * Requires: admin or estimator role
 */
router.put('/:id', verifyAuth, authorize('admin', 'estimator'), validate(updateCategorySchema), (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid category ID',
            });
            return;
        }
        // Check if category exists
        const existing = categoriesRepository.getById(categoryId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }
        const { name, description, sort_order } = req.body;
        const category = categoriesRepository.update(categoryId, {
            name,
            description,
            sort_order,
        });
        logger.info(`Category updated: ${category.code} by user ${req.user?.username}`);
        res.json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        logger.error(`Error updating category: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update category',
        });
    }
});
/**
 * DELETE /api/v1/cost-categories/:id
 * Delete a cost category
 * Requires: admin role
 */
router.delete('/:id', verifyAuth, authorize('admin'), (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid category ID',
            });
            return;
        }
        // Check if category exists
        const existing = categoriesRepository.getById(categoryId);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: 'Category not found',
            });
            return;
        }
        const deleted = categoriesRepository.delete(categoryId);
        if (!deleted) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete category',
            });
            return;
        }
        logger.info(`Category deleted: ${existing.code} by user ${req.user?.username}`);
        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting category: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to delete category',
        });
    }
});
export default router;
//# sourceMappingURL=costCategories.js.map