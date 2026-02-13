import { Router } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { getDatabase } from '../../database/connection.js';
import { projectsRepository } from '../../repositories/projectRepository.js';
import logger from '../../utils/logger.js';
const router = Router();
// Validation schemas
const copyItemsSchema = z.object({
    item_ids: z.array(z.number()).min(1),
});
const copySectionSchema = z.object({
    section_id: z.number(),
});
/**
 * GET /api/v1/boq-library/sections
 * Get all library sections with item counts
 */
router.get('/sections', verifyAuth, (_req, res) => {
    try {
        const db = getDatabase();
        const sectionsStmt = db.prepare(`
      SELECT
        id,
        section_number,
        section_title,
        items_per_page,
        sort_order,
        item_count
      FROM boq_library_sections
      ORDER BY sort_order ASC
    `);
        const sections = sectionsStmt.all();
        res.json({
            success: true,
            data: sections,
        });
    }
    catch (error) {
        logger.error(`Error fetching library sections: ${error.message}`);
        res.status(500).json({ success: false, error: 'Failed to fetch sections' });
    }
});
/**
 * GET /api/v1/boq-library/sections/:sectionId
 * Get section with all items (paginated for display)
 */
router.get('/sections/:sectionId', verifyAuth, (req, res) => {
    try {
        const { sectionId } = req.params;
        const sectionIdNum = parseInt(sectionId, 10);
        if (isNaN(sectionIdNum)) {
            res.status(400).json({ success: false, error: 'Invalid section ID' });
            return;
        }
        const db = getDatabase();
        // Get section
        const sectionStmt = db.prepare(`
      SELECT id, section_number, section_title, items_per_page, item_count
      FROM boq_library_sections
      WHERE id = ?
    `);
        const section = sectionStmt.get(sectionIdNum);
        if (!section) {
            res.status(404).json({ success: false, error: 'Section not found' });
            return;
        }
        // Get pages
        const pagesStmt = db.prepare(`
      SELECT id, page_number, total_pages, item_count
      FROM boq_library_pages
      WHERE section_id = ?
      ORDER BY page_number ASC
    `);
        const pages = pagesStmt.all(sectionIdNum);
        // Get items per page
        const itemsStmt = db.prepare(`
      SELECT
        id, item_number, description, unit, standard_rate, notes, page_number
      FROM boq_library_items
      WHERE section_id = ? AND is_active = 1
      ORDER BY item_number ASC, id ASC
    `);
        const allItems = itemsStmt.all(sectionIdNum);
        // Build pages with items
        const pagesWithItems = pages.map(page => ({
            page_number: page.page_number,
            total_pages: page.total_pages,
            item_count: page.item_count,
            items: allItems.filter(item => item.page_number === page.page_number),
        }));
        res.json({
            success: true,
            data: {
                section,
                pages: pagesWithItems,
            },
        });
    }
    catch (error) {
        logger.error(`Error fetching library section: ${error.message}`);
        res.status(500).json({ success: false, error: 'Failed to fetch section' });
    }
});
/**
 * POST /api/v1/boq-library/copy-items/:projectId
 * Copy selected items from library to project_estimates
 * User specifies individual item IDs
 */
router.post('/copy-items/:projectId', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { projectId } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const { item_ids } = copyItemsSchema.parse(req.body);
        if (isNaN(projectIdNum)) {
            res.status(400).json({ success: false, error: 'Invalid project ID' });
            return;
        }
        // Check if project exists
        const project = projectsRepository.getById(projectIdNum);
        if (!project) {
            res.status(404).json({ success: false, error: 'Project not found' });
            return;
        }
        const db = getDatabase();
        // Fetch library items
        const itemsStmt = db.prepare(`
        SELECT
          id, section_id, item_number, description, unit, standard_rate
        FROM boq_library_items
        WHERE id IN (${item_ids.map(() => '?').join(',')}) AND is_active = 1
      `);
        const libraryItems = itemsStmt.all(...item_ids);
        if (libraryItems.length === 0) {
            res.status(404).json({ success: false, error: 'No valid items found' });
            return;
        }
        // Begin transaction to copy items
        const transaction = db.transaction(() => {
            const insertStmt = db.prepare(`
          INSERT INTO project_estimates (
            project_id, quantity, custom_unit_rate, custom_description,
            custom_unit, line_total, created_by, version_number, is_active,
            item_number, section_id, category_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
            const refStmt = db.prepare(`
          INSERT INTO project_boq_library_refs (
            project_id, project_estimate_id, library_item_id, library_section_id
          ) VALUES (?, ?, ?, ?)
        `);
            const copiedEstimates = [];
            for (const libraryItem of libraryItems) {
                const result = insertStmt.run(projectIdNum, null, // quantity - user will enter
                libraryItem.standard_rate, libraryItem.description, libraryItem.unit, null, // line_total - will calculate when quantity added
                req.user.userId, 1, // version_number
                1, // is_active
                libraryItem.item_number, libraryItem.section_id, 1 // default category
                );
                const estimateId = result.lastInsertRowid;
                // Track reference to library item
                refStmt.run(projectIdNum, estimateId, libraryItem.id, libraryItem.section_id);
                copiedEstimates.push({
                    id: estimateId,
                    item_number: libraryItem.item_number,
                    description: libraryItem.description,
                });
            }
            return copiedEstimates;
        });
        const copiedEstimates = transaction();
        logger.info(`Copied ${copiedEstimates.length} items from library to project ${projectIdNum} by ${req.user?.username}`);
        res.status(201).json({
            success: true,
            data: {
                copied_count: copiedEstimates.length,
                items: copiedEstimates,
            },
        });
    }
    catch (error) {
        logger.error(`Error copying items to project: ${error.message}`);
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
        }
        else {
            res.status(500).json({ success: false, error: 'Failed to copy items' });
        }
    }
});
/**
 * POST /api/v1/boq-library/copy-section/:projectId
 * Copy entire section from library to project_estimates
 */
router.post('/copy-section/:projectId', verifyAuth, authorize('admin', 'estimator'), (req, res) => {
    try {
        const { projectId } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const { section_id } = copySectionSchema.parse(req.body);
        if (isNaN(projectIdNum)) {
            res.status(400).json({ success: false, error: 'Invalid project ID' });
            return;
        }
        // Check if project exists
        const project = projectsRepository.getById(projectIdNum);
        if (!project) {
            res.status(404).json({ success: false, error: 'Project not found' });
            return;
        }
        const db = getDatabase();
        // Fetch all items in section
        const itemsStmt = db.prepare(`
        SELECT
          id, item_number, description, unit, standard_rate
        FROM boq_library_items
        WHERE section_id = ? AND is_active = 1
        ORDER BY item_number ASC, id ASC
      `);
        const sectionItems = itemsStmt.all(section_id);
        if (sectionItems.length === 0) {
            res.status(404).json({ success: false, error: 'No items in section' });
            return;
        }
        // Begin transaction
        const transaction = db.transaction(() => {
            const insertStmt = db.prepare(`
          INSERT INTO project_estimates (
            project_id, quantity, custom_unit_rate, custom_description,
            custom_unit, line_total, created_by, version_number, is_active,
            item_number, section_id, category_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
            const refStmt = db.prepare(`
          INSERT INTO project_boq_library_refs (
            project_id, project_estimate_id, library_item_id, library_section_id
          ) VALUES (?, ?, ?, ?)
        `);
            const copiedEstimates = [];
            for (const item of sectionItems) {
                const result = insertStmt.run(projectIdNum, null, item.standard_rate, item.description, item.unit, null, req.user.userId, 1, 1, item.item_number, section_id, 1);
                const estimateId = result.lastInsertRowid;
                refStmt.run(projectIdNum, estimateId, item.id, section_id);
                copiedEstimates.push({
                    id: estimateId,
                    item_number: item.item_number,
                    description: item.description,
                });
            }
            return copiedEstimates;
        });
        const copiedEstimates = transaction();
        logger.info(`Copied section ${section_id} (${copiedEstimates.length} items) to project ${projectIdNum} by ${req.user?.username}`);
        res.status(201).json({
            success: true,
            data: {
                copied_count: copiedEstimates.length,
                items: copiedEstimates,
            },
        });
    }
    catch (error) {
        logger.error(`Error copying section to project: ${error.message}`);
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
        }
        else {
            res.status(500).json({ success: false, error: 'Failed to copy section' });
        }
    }
});
export default router;
//# sourceMappingURL=boqLibraryBrowser.js.map