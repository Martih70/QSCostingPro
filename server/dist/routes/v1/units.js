import { Router } from 'express';
import { verifyAuth } from '../../middleware/auth.js';
import { unitsRepository } from '../../repositories/costRepository.js';
import logger from '../../utils/logger.js';
const router = Router();
/**
 * GET /api/v1/units
 * Get all available units
 */
router.get('/', verifyAuth, (_req, res) => {
    try {
        const units = unitsRepository.getAll();
        res.json({
            success: true,
            data: units,
            count: units.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching units: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch units',
        });
    }
});
/**
 * GET /api/v1/units/:id
 * Get a specific unit
 */
router.get('/:id', verifyAuth, (req, res) => {
    try {
        const { id } = req.params;
        const unitId = parseInt(id, 10);
        if (isNaN(unitId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid unit ID',
            });
            return;
        }
        const unit = unitsRepository.getById(unitId);
        if (!unit) {
            res.status(404).json({
                success: false,
                error: 'Unit not found',
            });
            return;
        }
        res.json({
            success: true,
            data: unit,
        });
    }
    catch (error) {
        logger.error(`Error fetching unit: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unit',
        });
    }
});
export default router;
//# sourceMappingURL=units.js.map