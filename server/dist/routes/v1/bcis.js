import { Router } from 'express';
import { verifyAuth } from '../../middleware/auth.js';
import { getDatabase } from '../../database/connection.js';
import logger from '../../utils/logger.js';
const router = Router();
/**
 * GET /api/v1/bcis/elements
 * Get all BCIS elements (main categories)
 */
router.get('/elements', verifyAuth, (_req, res) => {
    try {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT id, code, name, description
      FROM cost_categories
      WHERE code LIKE 'BCIS-%'
      ORDER BY sort_order ASC
    `);
        const elements = stmt.all();
        res.json({
            success: true,
            data: elements,
            count: elements.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching BCIS elements: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch BCIS elements',
        });
    }
});
/**
 * GET /api/v1/bcis/elements/:id
 * Get specific BCIS element with its sub-elements
 */
router.get('/elements/:id', verifyAuth, (req, res) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid element ID',
            });
            return;
        }
        // Get element
        const elementStmt = db.prepare(`
      SELECT id, code, name, description
      FROM cost_categories
      WHERE id = ? AND code LIKE 'BCIS-%'
    `);
        const element = elementStmt.get(categoryId);
        if (!element) {
            res.status(404).json({
                success: false,
                error: 'Element not found',
            });
            return;
        }
        // Get sub-elements
        const subElementsStmt = db.prepare(`
      SELECT id, code, name, description
      FROM cost_sub_elements
      WHERE category_id = ?
      ORDER BY sort_order ASC
    `);
        const subElements = subElementsStmt.all(categoryId);
        res.json({
            success: true,
            data: {
                element,
                subElements,
            },
        });
    }
    catch (error) {
        logger.error(`Error fetching BCIS element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch element',
        });
    }
});
/**
 * GET /api/v1/bcis/sub-elements/:id
 * Get specific sub-element with its cost items
 */
router.get('/sub-elements/:id', verifyAuth, (req, res) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const subElementId = parseInt(id, 10);
        if (isNaN(subElementId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid sub-element ID',
            });
            return;
        }
        // Get sub-element
        const subElementStmt = db.prepare(`
      SELECT id, code, name, description
      FROM cost_sub_elements
      WHERE id = ?
    `);
        const subElement = subElementStmt.get(subElementId);
        if (!subElement) {
            res.status(404).json({
                success: false,
                error: 'Sub-element not found',
            });
            return;
        }
        // Get cost items
        const itemsStmt = db.prepare(`
      SELECT
        ci.id, ci.code, ci.description, ci.unit_id,
        ci.material_cost, ci.management_cost, ci.contractor_cost,
        ci.is_contractor_required, ci.currency, ci.price_date,
        ci.bcis_reference, u.code as unit_code, u.name as unit_name
      FROM cost_items ci
      LEFT JOIN units u ON ci.unit_id = u.id
      WHERE ci.sub_element_id = ? AND ci.database_type = 'bcis'
      ORDER BY ci.code ASC
    `);
        const items = itemsStmt.all(subElementId);
        res.json({
            success: true,
            data: {
                subElement,
                items,
                itemCount: items.length,
            },
        });
    }
    catch (error) {
        logger.error(`Error fetching BCIS sub-element: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sub-element',
        });
    }
});
/**
 * GET /api/v1/bcis/search
 * Search BCIS cost items by description or code
 */
router.get('/search', verifyAuth, (req, res) => {
    try {
        const db = getDatabase();
        const { q, elementCode } = req.query;
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Search query required',
            });
            return;
        }
        let query = `
      SELECT
        ci.id, ci.code, ci.description, ci.unit_id,
        ci.material_cost, ci.management_cost, ci.contractor_cost,
        ci.is_contractor_required, ci.currency, ci.bcis_reference,
        u.code as unit_code, u.name as unit_name,
        cse.code as sub_element_code, cse.name as sub_element_name,
        cc.code as element_code, cc.name as element_name
      FROM cost_items ci
      LEFT JOIN units u ON ci.unit_id = u.id
      LEFT JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
      LEFT JOIN cost_categories cc ON cse.category_id = cc.id
      WHERE ci.database_type = 'bcis'
        AND (ci.code LIKE ? OR ci.description LIKE ? OR ci.bcis_reference LIKE ?)
    `;
        const params = [`%${q}%`, `%${q}%`, `%${q}%`];
        if (elementCode && typeof elementCode === 'string') {
            query += ' AND cc.code = ?';
            params.push(elementCode);
        }
        query += ' ORDER BY ci.code ASC LIMIT 50';
        const stmt = db.prepare(query);
        const items = stmt.all(...params);
        res.json({
            success: true,
            data: items,
            count: items.length,
        });
    }
    catch (error) {
        logger.error(`Error searching BCIS items: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to search items',
        });
    }
});
/**
 * GET /api/v1/bcis/structure
 * Get complete BCIS structure (tree view)
 */
router.get('/structure', verifyAuth, (_req, res) => {
    try {
        const db = getDatabase();
        // Get all elements with their sub-elements
        const elementsStmt = db.prepare(`
      SELECT id, code, name, description, sort_order
      FROM cost_categories
      WHERE code LIKE 'BCIS-%'
      ORDER BY sort_order ASC
    `);
        const elements = elementsStmt.all();
        const structure = [];
        for (const element of elements) {
            const subElementsStmt = db.prepare(`
        SELECT id, code, name
        FROM cost_sub_elements
        WHERE category_id = ?
        ORDER BY sort_order ASC
      `);
            const subElements = subElementsStmt.all(element.id);
            structure.push({
                ...element,
                subElements,
            });
        }
        res.json({
            success: true,
            data: structure,
            elementCount: structure.length,
            subElementCount: structure.reduce((sum, e) => sum + e.subElements.length, 0),
        });
    }
    catch (error) {
        logger.error(`Error fetching BCIS structure: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch BCIS structure',
        });
    }
});
/**
 * GET /api/v1/bcis/items/:elementCode
 * Get all items for a specific BCIS element
 */
router.get('/items/:elementCode', verifyAuth, (req, res) => {
    try {
        const db = getDatabase();
        const { elementCode } = req.params;
        // Validate element exists
        const elementStmt = db.prepare("SELECT id FROM cost_categories WHERE code = ? AND code LIKE 'BCIS-%'");
        const element = elementStmt.get(elementCode);
        if (!element) {
            res.status(404).json({
                success: false,
                error: 'Element not found',
            });
            return;
        }
        // Get all items for this element
        const itemsStmt = db.prepare(`
      SELECT
        ci.id, ci.code, ci.description, ci.unit_id,
        ci.material_cost, ci.management_cost, ci.contractor_cost,
        ci.is_contractor_required, ci.bcis_reference,
        u.code as unit_code, u.name as unit_name,
        cse.code as sub_element_code, cse.name as sub_element_name
      FROM cost_items ci
      LEFT JOIN units u ON ci.unit_id = u.id
      LEFT JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
      WHERE cse.category_id = ? AND ci.database_type = 'bcis'
      ORDER BY cse.sort_order, ci.code
    `);
        const items = itemsStmt.all(element.id);
        res.json({
            success: true,
            elementCode,
            data: items,
            itemCount: items.length,
        });
    }
    catch (error) {
        logger.error(`Error fetching BCIS items: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch items',
        });
    }
});
/**
 * GET /api/v1/bcis/item/:id
 * Get detailed information about a specific cost item
 */
router.get('/item/:id', verifyAuth, (req, res) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const itemId = parseInt(id, 10);
        if (isNaN(itemId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid item ID',
            });
            return;
        }
        const stmt = db.prepare(`
      SELECT
        ci.id, ci.code, ci.description, ci.unit_id,
        ci.material_cost, ci.management_cost, ci.contractor_cost,
        ci.is_contractor_required, ci.waste_factor, ci.currency,
        ci.price_date, ci.bcis_reference, ci.database_type,
        u.code as unit_code, u.name as unit_name,
        cse.id as sub_element_id, cse.code as sub_element_code, cse.name as sub_element_name,
        cc.id as element_id, cc.code as element_code, cc.name as element_name
      FROM cost_items ci
      LEFT JOIN units u ON ci.unit_id = u.id
      LEFT JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
      LEFT JOIN cost_categories cc ON cse.category_id = cc.id
      WHERE ci.id = ? AND ci.database_type = 'bcis'
    `);
        const item = stmt.get(itemId);
        if (!item) {
            res.status(404).json({
                success: false,
                error: 'Item not found',
            });
            return;
        }
        // Calculate total cost per unit
        const totalCostPerUnit = item.material_cost + item.management_cost + item.contractor_cost;
        res.json({
            success: true,
            data: {
                ...item,
                totalCostPerUnit,
            },
        });
    }
    catch (error) {
        logger.error(`Error fetching BCIS item: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch item',
        });
    }
});
export default router;
//# sourceMappingURL=bcis.js.map