import express from 'express';
import { initializeDatabase } from '../../database/connection.js';
import { NRM2Repository } from '../../repositories/nrm2Repository.js';
const router = express.Router();
const db = initializeDatabase();
const nrm2Repository = new NRM2Repository(db);
/**
 * GET /api/v1/nrm2/groups
 * Get all top-level NRM 2 groups
 */
router.get('/groups', (_req, res) => {
    try {
        const groups = nrm2Repository.getAllGroups();
        res.json({
            success: true,
            data: groups,
            count: groups.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch groups: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/groups/:id
 * Get a specific group with all its elements
 */
router.get('/groups/:id', (req, res) => {
    try {
        const { id } = req.params;
        const group = nrm2Repository.getGroupById(parseInt(id));
        if (!group) {
            res.status(404).json({
                success: false,
                error: 'Group not found'
            });
            return;
        }
        res.json({
            success: true,
            data: group
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch group: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/elements/:id
 * Get a specific element with its sub-elements
 */
router.get('/elements/:id', (req, res) => {
    try {
        const { id } = req.params;
        const element = nrm2Repository.getElementById(parseInt(id));
        if (!element) {
            res.status(404).json({
                success: false,
                error: 'Element not found'
            });
            return;
        }
        res.json({
            success: true,
            data: element
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch element: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/sub-elements/:id
 * Get a specific sub-element with its work sections
 */
router.get('/sub-elements/:id', (req, res) => {
    try {
        const { id } = req.params;
        const subElement = nrm2Repository.getSubElementById(parseInt(id));
        if (!subElement) {
            res.status(404).json({
                success: false,
                error: 'Sub-element not found'
            });
            return;
        }
        res.json({
            success: true,
            data: subElement
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch sub-element: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/work-sections/by-code/:code
 * Get a work section by its code (must come before /work-sections/:id)
 */
router.get('/work-sections/by-code/:code', (req, res) => {
    try {
        const { code } = req.params;
        const workSection = nrm2Repository.getWorkSectionByCode(code);
        if (!workSection) {
            res.status(404).json({
                success: false,
                error: 'Work section not found'
            });
            return;
        }
        res.json({
            success: true,
            data: workSection
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch work section: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/work-sections/:id
 * Get a specific work section
 */
router.get('/work-sections/:id', (req, res) => {
    try {
        const { id } = req.params;
        const workSection = nrm2Repository.getWorkSectionById(parseInt(id));
        if (!workSection) {
            res.status(404).json({
                success: false,
                error: 'Work section not found'
            });
            return;
        }
        res.json({
            success: true,
            data: workSection
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch work section: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/search
 * Search across all NRM 2 levels
 * Query params:
 *   q: search keyword (required)
 *   limit: max results (default: 50)
 */
router.get('/search', (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Search keyword (q) is required'
            });
            return;
        }
        const limitNum = limit ? Math.min(parseInt(limit), 100) : 50;
        const results = nrm2Repository.searchNRM2(q.trim(), limitNum);
        res.json({
            success: true,
            data: results,
            count: results.length,
            keyword: q
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Search failed: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/tree
 * Get full hierarchical tree structure
 * Optional query params:
 *   groupId: specific group to expand (default: all groups)
 */
router.get('/tree', (req, res) => {
    try {
        const { groupId } = req.query;
        const id = groupId ? parseInt(groupId) : undefined;
        const tree = nrm2Repository.getTreeStructure(id);
        res.json({
            success: true,
            data: tree
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch tree: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
/**
 * GET /api/v1/nrm2/stats
 * Get NRM 2 database statistics
 */
router.get('/stats', (_req, res) => {
    try {
        const stats = nrm2Repository.getStatistics();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to fetch statistics: ${error instanceof Error ? error.message : String(error)}`
        });
    }
});
export default router;
//# sourceMappingURL=nrm2.js.map