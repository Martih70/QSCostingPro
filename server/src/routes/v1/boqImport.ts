import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { parseBoQCSV, validateBoQData } from '../../services/boqImportService.js';
import { projectsRepository } from '../../repositories/projectRepository.js';
import { getDatabase } from '../../database/connection.js';
import logger from '../../utils/logger.js';

const router = Router();

// Setup multer for CSV uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req, file, cb) => {
    // Only allow CSV files
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Validation schema
const boqImportSchema = z.object({
  importName: z.string().min(1).max(255).optional(),
  skipValidation: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/projects/:projectId/boq-import/preview
 * Preview BoQ import from uploaded CSV without saving to database
 */
router.post(
  '/:projectId/boq-import/preview',
  verifyAuth,
  authorize('admin', 'estimator'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    let filePath: string | null = null;
    try {
      const { projectId } = req.params;
      const projectIdNum = parseInt(projectId, 10);

      if (isNaN(projectIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID',
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No CSV file uploaded',
        });
        return;
      }

      filePath = req.file.path;

      // Check if project exists
      const project = projectsRepository.getById(projectIdNum);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // Check authorization
      if (req.user?.role !== 'admin' && project.created_by !== req.user?.userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Read CSV file
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      // Parse CSV
      const boqData = parseBoQCSV(csvContent);

      // Validate data
      const errors = validateBoQData(boqData);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation errors found in BoQ data',
          errors,
        });
        return;
      }

      // Return preview without saving
      res.json({
        success: true,
        data: {
          preview: {
            totalSections: boqData.sections.length,
            totalItems: boqData.totalItems,
            grandTotal: boqData.grandTotal,
            sections: boqData.sections.map(section => ({
              sectionId: section.sectionId,
              sectionNumber: section.sectionNumber,
              sectionTitle: section.sectionTitle,
              itemCount: section.itemCount,
              sectionTotal: section.sectionTotal,
            })),
          },
        },
      });
    } catch (error: any) {
      logger.error(`Error previewing BoQ import: ${error.message}`);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to parse CSV file',
      });
    } finally {
      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
);

/**
 * POST /api/v1/projects/:projectId/boq-import
 * Import BoQ items from uploaded CSV and save to project
 */
router.post(
  '/:projectId/boq-import',
  verifyAuth,
  authorize('admin', 'estimator'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    let filePath: string | null = null;
    try {
      const { projectId } = req.params;
      const projectIdNum = parseInt(projectId, 10);
      const { importName, skipValidation } = boqImportSchema.parse(req.body);

      if (isNaN(projectIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID',
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No CSV file uploaded',
        });
        return;
      }

      filePath = req.file.path;

      // Check if project exists
      const project = projectsRepository.getById(projectIdNum);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // Check authorization
      if (req.user?.role !== 'admin' && project.created_by !== req.user?.userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Read CSV file
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      // Parse CSV
      let boqData = parseBoQCSV(csvContent);

      // Update import name if provided
      if (importName) {
        boqData.importName = importName;
      }

      // Validate data unless skipped
      if (!skipValidation) {
        const errors = validateBoQData(boqData);
        if (errors.length > 0) {
          res.status(400).json({
            success: false,
            error: 'Validation errors found in BoQ data',
            errors,
          });
          return;
        }
      }

      // Begin transaction
      const db = getDatabase();
      const transaction = db.transaction(() => {
        // Create BoQ import record
        const importStmt = db.prepare(`
          INSERT INTO boq_imports (
            project_id, import_name, total_items, total_value, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const importResult = importStmt.run(
          projectIdNum,
          boqData.importName,
          boqData.totalItems,
          boqData.grandTotal,
          req.user!.userId
        );

        const boqImportId = importResult.lastInsertRowid as number;

        // Insert line items
        const insertItemStmt = db.prepare(`
          INSERT INTO project_estimates (
            project_id, quantity, custom_unit_rate, notes,
            line_total, created_by, version_number, is_active,
            custom_description, custom_unit, category_id,
            item_number, section_id, section_title, boq_import_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let sectionCounter = 0;
        const sectionIdMap = new Map<string, number>();

        for (const section of boqData.sections) {
          sectionCounter++;
          sectionIdMap.set(section.sectionNumber, sectionCounter);

          for (const item of section.items) {
            // Skip header items (e.g., "1.0.0" or "1.0")
            const isHeader =
              item.itemNumber === `${section.sectionNumber}.0` ||
              item.itemNumber === `${section.sectionNumber}.0.0` ||
              item.itemNumber === section.sectionNumber;

            if (isHeader) {
              continue;
            }

            insertItemStmt.run(
              projectIdNum,
              item.quantity,
              item.rate,
              item.notes || null,
              item.amount,
              req.user!.userId,
              1, // version_number
              1, // is_active
              item.description,
              item.unit,
              1, // Default category ID (should be made configurable)
              item.itemNumber,
              sectionCounter,
              section.sectionTitle,
              boqImportId
            );
          }
        }

        return boqImportId;
      });

      const boqImportId = transaction();

      logger.info(
        `BoQ imported for project ${projectIdNum}: ${boqData.totalItems} items, £${boqData.grandTotal.toFixed(
          2
        )} by user ${req.user?.username}`
      );

      res.status(201).json({
        success: true,
        data: {
          boq_import_id: boqImportId,
          import_name: boqData.importName,
          total_items: boqData.totalItems,
          total_value: boqData.grandTotal,
          sections_count: boqData.sections.length,
        },
      });
    } catch (error: any) {
      logger.error(`Error importing BoQ: ${error.message}`);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to import BoQ',
      });
    } finally {
      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/boq-imports
 * Get all BoQ imports for a project
 */
router.get('/:projectId/boq-imports', verifyAuth, (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId, 10);

    if (isNaN(projectIdNum)) {
      res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
      return;
    }

    // Check if project exists
    const project = projectsRepository.getById(projectIdNum);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    // Check access
    if (req.user?.role === 'viewer' && project.created_by !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, import_name, total_items, total_value, created_by, created_at
      FROM boq_imports
      WHERE project_id = ?
      ORDER BY created_at DESC
    `);

    const imports = stmt.all(projectIdNum);

    res.json({
      success: true,
      data: imports,
    });
  } catch (error: any) {
    logger.error(`Error fetching BoQ imports: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch BoQ imports',
    });
  }
});

/**
 * DELETE /api/v1/projects/:projectId/boq-imports/:importId
 * Delete a BoQ import and all associated line items
 */
router.delete(
  '/:projectId/boq-imports/:importId',
  verifyAuth,
  authorize('admin', 'estimator'),
  (req: Request, res: Response) => {
    try {
      const { projectId, importId } = req.params;
      const projectIdNum = parseInt(projectId, 10);
      const importIdNum = parseInt(importId, 10);

      if (isNaN(projectIdNum) || isNaN(importIdNum)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project or import ID',
        });
        return;
      }

      // Check if project exists
      const project = projectsRepository.getById(projectIdNum);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // Check authorization
      if (req.user?.role !== 'admin' && project.created_by !== req.user?.userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      const db = getDatabase();

      // Check if import exists
      const importStmt = db.prepare('SELECT id FROM boq_imports WHERE id = ? AND project_id = ?');
      const existingImport = importStmt.get(importIdNum, projectIdNum) as any;

      if (!existingImport) {
        res.status(404).json({
          success: false,
          error: 'BoQ import not found',
        });
        return;
      }

      // Begin transaction
      const transaction = db.transaction(() => {
        // Soft delete all line items from this import
        const deleteItemsStmt = db.prepare(`
          UPDATE project_estimates
          SET is_active = 0
          WHERE project_id = ? AND boq_import_id = ?
        `);
        deleteItemsStmt.run(projectIdNum, importIdNum);

        // Delete the import record
        const deleteImportStmt = db.prepare('DELETE FROM boq_imports WHERE id = ?');
        deleteImportStmt.run(importIdNum);
      });

      transaction();

      logger.info(
        `BoQ import ${importIdNum} deleted from project ${projectIdNum} by user ${req.user?.username}`
      );

      res.json({
        success: true,
        message: 'BoQ import deleted successfully',
      });
    } catch (error: any) {
      logger.error(`Error deleting BoQ import: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to delete BoQ import',
      });
    }
  }
);

export default router;
