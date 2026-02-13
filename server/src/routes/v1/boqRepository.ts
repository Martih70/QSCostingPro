import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { parseBoQCSV, validateBoQData } from '../../services/boqImportService.js';
import { getDatabase } from '../../database/connection.js';
import {
  ensureSectionsFromImport,
  rebuildLibrary,
  type SectionInput,
} from '../../services/boqLibraryService.js';
import logger from '../../utils/logger.js';

const router = Router();

// Setup multer for CSV uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../../uploads');

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
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Validation schema
const importSchema = z.object({
  importName: z.string().min(1).max(255), // REQUIRED - used to identify import
  skipValidation: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/boq-repository/import
 * Admin: Import CSV to central library (one-time setup)
 */
router.post(
  '/import',
  verifyAuth,
  authorize('admin'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    let filePath: string | null = null;
    try {
      const { importName, skipValidation } = importSchema.parse(req.body);

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No CSV file uploaded',
        });
        return;
      }

      filePath = req.file.path;

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
        // Create library import record
        const importStmt = db.prepare(`
          INSERT INTO boq_library_imports (
            import_name, total_sections, total_items, created_by, created_at
          ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const importResult = importStmt.run(
          boqData.importName,
          boqData.sections.length,
          boqData.totalItems,
          req.user!.userId
        );

        const boqImportId = importResult.lastInsertRowid as number;

        // Get the next available section number globally (not just per import)
        const maxSectionStmt = db.prepare(
          'SELECT MAX(section_number) as maxNum FROM boq_library_sections'
        );
        const maxResult = maxSectionStmt.get() as { maxNum: number | null };
        const nextSectionNumber = (maxResult?.maxNum || 0) + 1;

        // CREATE SECTIONS FIRST (before items, due to foreign key constraint)
        // Section titles are based on the import name
        const sectionInputs: SectionInput[] = boqData.sections.map((section, idx) => ({
          sectionNumber: nextSectionNumber + idx,
          sectionTitle: `${boqData.importName} - Section ${section.sectionNumber}`,
        }));
        ensureSectionsFromImport(db, sectionInputs, req.user!.userId, boqImportId);

        // Get section IDs for the sections we just created
        const getSectionIdStmt = db.prepare(
          'SELECT id FROM boq_library_sections WHERE section_number = ?'
        );

        // NOW insert library items (using INSERT OR IGNORE to allow re-imports)
        const insertItemStmt = db.prepare(`
          INSERT OR IGNORE INTO boq_library_items (
            section_id, item_number, description, quantity, unit,
            standard_rate, notes, is_active, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (let idx = 0; idx < boqData.sections.length; idx++) {
          const section = boqData.sections[idx];
          const sectionNumber = nextSectionNumber + idx;

          // Get the actual section ID (primary key) for this section_number
          const sectionRow = getSectionIdStmt.get(sectionNumber) as { id: number } | undefined;
          if (!sectionRow) {
            logger.warn(`Section not found for section_number ${sectionNumber}`);
            continue;
          }
          const sectionId = sectionRow.id;

          for (const item of section.items) {
            // Skip header items
            const isHeader =
              item.itemNumber === `${section.sectionNumber}.0` ||
              item.itemNumber === `${section.sectionNumber}.0.0` ||
              item.itemNumber === section.sectionNumber;

            if (isHeader) {
              continue;
            }

            insertItemStmt.run(
              sectionId,
              item.itemNumber,
              item.description,
              item.quantity,
              item.unit,
              item.rate,
              item.notes || null,
              1, // is_active
              req.user!.userId
            );
          }
        }

        return boqImportId;
      });

      const boqImportId = transaction();

      // Rebuild library structure (paginate, collections, summary)
      try {
        rebuildLibrary();
      } catch (err: any) {
        logger.error(`Library structure rebuild failed: ${err.message}`);
        // Non-fatal
      }

      logger.info(
        `BoQ imported to library: ${boqData.totalItems} items, ${boqData.sections.length} sections by ${req.user?.username}`
      );

      res.status(201).json({
        success: true,
        data: {
          boq_import_id: boqImportId,
          import_name: boqData.importName,
          total_items: boqData.totalItems,
          total_sections: boqData.sections.length,
        },
      });
    } catch (error: any) {
      logger.error(`Error importing BoQ to library: ${error.message}`);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to import BoQ',
      });
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
);

/**
 * GET /api/v1/boq-repository/summary
 * Get library summary (all sections and items)
 */
router.get('/summary', verifyAuth, (_req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const summaryStmt = db.prepare(`
      SELECT section_references, total_sections, total_items, generated_at
      FROM boq_library_summary
      ORDER BY id DESC
      LIMIT 1
    `);

    const summary = summaryStmt.get() as {
      section_references: string;
      total_sections: number;
      total_items: number;
      generated_at: string;
    } | undefined;

    if (!summary) {
      res.json({
        success: true,
        data: {
          section_references: [],
          total_sections: 0,
          total_items: 0,
          generated_at: new Date().toISOString(),
        },
      });
      return;
    }

    let sectionReferences: any[] = [];
    try {
      sectionReferences = JSON.parse(summary.section_references);
    } catch (parseErr: any) {
      logger.error(`Failed to parse section_references: ${parseErr.message}`);
      // Return empty array if parsing fails
      sectionReferences = [];
    }

    res.json({
      success: true,
      data: {
        section_references: sectionReferences,
        total_sections: summary.total_sections,
        total_items: summary.total_items,
        generated_at: summary.generated_at,
      },
    });
  } catch (error: any) {
    logger.error(`Error fetching library summary: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

/**
 * GET /api/v1/boq-repository/imports
 * Get list of imports (admin view)
 */
router.get(
  '/imports',
  verifyAuth,
  authorize('admin'),
  (_req: Request, res: Response) => {
    try {
      const db = getDatabase();

      const importsStmt = db.prepare(`
        SELECT id, import_name, total_sections, total_items, created_by, created_at
        FROM boq_library_imports
        ORDER BY created_at DESC
      `);

      const imports = importsStmt.all();

      res.json({
        success: true,
        data: imports,
      });
    } catch (error: any) {
      logger.error(`Error fetching imports: ${error.message}`);
      res.status(500).json({ success: false, error: 'Failed to fetch imports' });
    }
  }
);

export default router;
