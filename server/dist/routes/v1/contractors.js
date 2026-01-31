import { Router } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { contractorsRepository } from '../../repositories/contractorRepository.js';
import logger from '../../utils/logger.js';
const router = Router();
// Validation schemas
const createContractorSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(200).optional().nullable(),
    city: z.string().max(50).optional().nullable(),
    postcode: z.string().max(10).optional().nullable(),
    country: z.string().max(50).optional(),
    website: z.string().url().optional().nullable(),
    specialization: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
});
const updateContractorSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(200).optional().nullable(),
    city: z.string().max(50).optional().nullable(),
    postcode: z.string().max(10).optional().nullable(),
    country: z.string().max(50).optional(),
    website: z.string().url().optional().nullable(),
    specialization: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    rating: z.number().min(0).max(5).optional(),
    is_active: z.boolean().optional(),
});
/**
 * GET /api/v1/contractors
 * Get all contractors for the authenticated user
 */
router.get('/', verifyAuth, (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
            return;
        }
        // Get search and filter parameters
        const searchTerm = req.query.search || undefined;
        const specialization = req.query.specialization || undefined;
        const minRating = req.query.minRating ? parseFloat(req.query.minRating) : undefined;
        const isActive = req.query.active ? req.query.active === 'true' : undefined;
        const contractors = contractorsRepository.getAll(user.userId, {
            searchTerm,
            specialization,
            minRating,
            isActive,
        });
        res.json({
            success: true,
            data: contractors,
            count: contractors.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching contractors: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch contractors',
        });
    }
});
/**
 * GET /api/v1/contractors/:id
 * Get a specific contractor
 */
router.get('/:id', verifyAuth, (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const contractorId = parseInt(id, 10);
        if (isNaN(contractorId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid contractor ID',
            });
            return;
        }
        const contractor = contractorsRepository.getById(contractorId, user.userId);
        if (!contractor) {
            res.status(404).json({
                success: false,
                error: 'Contractor not found',
            });
            return;
        }
        res.json({
            success: true,
            data: contractor,
        });
    }
    catch (error) {
        logger.error(`Error fetching contractor: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch contractor',
        });
    }
});
/**
 * POST /api/v1/contractors
 * Create a new contractor
 */
router.post('/', verifyAuth, validate(createContractorSchema), (req, res) => {
    try {
        const user = req.user;
        const { name, email, phone, address, city, postcode, country, website, specialization, notes } = req.body;
        const contractor = contractorsRepository.create(user.userId, {
            name,
            email,
            phone,
            address,
            city,
            postcode,
            country,
            website,
            specialization,
            notes,
        });
        logger.info(`Contractor created: ${name} by user ${user.username}`);
        res.status(201).json({
            success: true,
            data: contractor,
        });
    }
    catch (error) {
        logger.error(`Error creating contractor: ${error.message}`);
        if (error.message.includes('already exists')) {
            res.status(409).json({
                success: false,
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create contractor',
        });
    }
});
/**
 * PUT /api/v1/contractors/:id
 * Update a contractor
 */
router.put('/:id', verifyAuth, validate(updateContractorSchema), (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const contractorId = parseInt(id, 10);
        if (isNaN(contractorId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid contractor ID',
            });
            return;
        }
        const updatedContractor = contractorsRepository.update(contractorId, user.userId, req.body);
        logger.info(`Contractor updated: ID ${contractorId} by user ${user.username}`);
        res.json({
            success: true,
            data: updatedContractor,
        });
    }
    catch (error) {
        logger.error(`Error updating contractor: ${error.message}`);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: error.message,
            });
            return;
        }
        if (error.message.includes('already exists')) {
            res.status(409).json({
                success: false,
                error: error.message,
            });
            return;
        }
        if (error.message.includes('Rating')) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update contractor',
        });
    }
});
/**
 * DELETE /api/v1/contractors/:id
 * Delete a contractor
 */
router.delete('/:id', verifyAuth, (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const contractorId = parseInt(id, 10);
        if (isNaN(contractorId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid contractor ID',
            });
            return;
        }
        const deleted = contractorsRepository.delete(contractorId, user.userId);
        if (!deleted) {
            res.status(404).json({
                success: false,
                error: 'Contractor not found',
            });
            return;
        }
        logger.info(`Contractor deleted: ID ${contractorId} by user ${user.username}`);
        res.json({
            success: true,
            message: 'Contractor deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting contractor: ${error.message}`);
        if (error.message.includes('not found') || error.message.includes('linked')) {
            res.status(error.message.includes('linked') ? 409 : 404).json({
                success: false,
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete contractor',
        });
    }
});
export default router;
//# sourceMappingURL=contractors.js.map