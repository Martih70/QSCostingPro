import { Router } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { clientsRepository } from '../../repositories/clientRepository.js';
import logger from '../../utils/logger.js';
const router = Router();
// Validation schemas
const createClientSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(200).optional().nullable(),
    city: z.string().max(50).optional().nullable(),
    postcode: z.string().max(10).optional().nullable(),
    country: z.string().max(50).optional(),
    website: z.string().url().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
});
const updateClientSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(200).optional().nullable(),
    city: z.string().max(50).optional().nullable(),
    postcode: z.string().max(10).optional().nullable(),
    country: z.string().max(50).optional(),
    website: z.string().url().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    is_active: z.boolean().optional(),
});
/**
 * GET /api/v1/clients
 * Get all clients for the authenticated user
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
        const isActive = req.query.active ? req.query.active === 'true' : undefined;
        const clients = clientsRepository.getAll(user.userId, {
            searchTerm,
            isActive,
        });
        res.json({
            success: true,
            data: clients,
            count: clients.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching clients: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clients',
        });
    }
});
/**
 * GET /api/v1/clients/:id
 * Get a specific client
 */
router.get('/:id', verifyAuth, (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const clientId = parseInt(id, 10);
        if (isNaN(clientId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const client = clientsRepository.getById(clientId, user.userId);
        if (!client) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        res.json({
            success: true,
            data: client,
        });
    }
    catch (error) {
        logger.error(`Error fetching client: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch client',
        });
    }
});
/**
 * POST /api/v1/clients
 * Create a new client
 */
router.post('/', verifyAuth, validate(createClientSchema), (req, res) => {
    try {
        const user = req.user;
        const { name, email, phone, address, city, postcode, country, website, notes } = req.body;
        const client = clientsRepository.create(user.userId, {
            name,
            email,
            phone,
            address,
            city,
            postcode,
            country,
            website,
            notes,
        });
        logger.info(`Client created: ${name} by user ${user.username}`);
        res.status(201).json({
            success: true,
            data: client,
        });
    }
    catch (error) {
        logger.error(`Error creating client: ${error.message}`);
        if (error.message.includes('already exists')) {
            res.status(409).json({
                success: false,
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create client',
        });
    }
});
/**
 * PUT /api/v1/clients/:id
 * Update a client
 */
router.put('/:id', verifyAuth, validate(updateClientSchema), (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const clientId = parseInt(id, 10);
        if (isNaN(clientId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const updatedClient = clientsRepository.update(clientId, user.userId, req.body);
        logger.info(`Client updated: ID ${clientId} by user ${user.username}`);
        res.json({
            success: true,
            data: updatedClient,
        });
    }
    catch (error) {
        logger.error(`Error updating client: ${error.message}`);
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
        res.status(500).json({
            success: false,
            error: 'Failed to update client',
        });
    }
});
/**
 * DELETE /api/v1/clients/:id
 * Delete a client
 */
router.delete('/:id', verifyAuth, (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const clientId = parseInt(id, 10);
        if (isNaN(clientId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const deleted = clientsRepository.delete(clientId, user.userId);
        if (!deleted) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        logger.info(`Client deleted: ID ${clientId} by user ${user.username}`);
        res.json({
            success: true,
            message: 'Client deleted successfully',
        });
    }
    catch (error) {
        logger.error(`Error deleting client: ${error.message}`);
        if (error.message.includes('not found') || error.message.includes('linked')) {
            res.status(error.message.includes('linked') ? 409 : 404).json({
                success: false,
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete client',
        });
    }
});
export default router;
//# sourceMappingURL=clients.js.map