import express, { Request, Response } from 'express';
import { initializeDatabase } from '../../database/connection.js';
import { ReferenceRepository } from '../../repositories/referenceRepository.js';
import { uploadReference, uploadsDir } from '../../middleware/upload.js';
import { verifyAuth } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = express.Router();
const db = initializeDatabase();
const referenceRepository = new ReferenceRepository(db);

/**
 * POST /api/v1/references/upload
 * Upload a new reference document (admin/estimator only)
 */
router.post('/upload', verifyAuth, authorize('admin', 'estimator'), uploadReference.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided'
      });
      return;
    }

    const { description, category } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
      return;
    }

    const document = referenceRepository.createDocument({
      name: req.file.originalname,
      description: description || '',
      file_path: `/uploads/references/${req.file.filename}`,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      category: category || 'standards',
      uploaded_by: userId
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * GET /api/v1/references
 * Get all reference documents
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const { category } = req.query;
    const documents = referenceRepository.getAllDocuments(category as string | undefined);

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch documents: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * GET /api/v1/references/:id
 * Get a specific reference document metadata
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const document = referenceRepository.getDocumentById(parseInt(id));

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch document: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * GET /api/v1/references/:id/download
 * Download or view a reference document
 * Browser will typically display PDFs inline, download other files
 */
router.get('/:id/download', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const document = referenceRepository.getDocumentById(parseInt(id));

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // The file should be accessed via the /uploads static route instead
    // This endpoint provides metadata routing
    res.json({
      success: true,
      url: document.file_path,
      filename: document.name,
      type: document.file_type,
      size: document.file_size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to download document: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * PATCH /api/v1/references/:id
 * Update document metadata (admin only)
 */
router.patch('/:id', verifyAuth, authorize('admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    const document = referenceRepository.updateDocument(parseInt(id), {
      name,
      description,
      category
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Update failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * DELETE /api/v1/references/:id
 * Delete a reference document (admin only)
 */
router.delete('/:id', verifyAuth, authorize('admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const success = referenceRepository.deleteDocument(parseInt(id), uploadsDir);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Document not found or deletion failed'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Deletion failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * GET /api/v1/references/search
 * Search reference documents
 */
router.get('/search', (req: Request, res: Response): void => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Search keyword (q) is required'
      });
      return;
    }

    const results = referenceRepository.searchDocuments(q.trim());

    res.json({
      success: true,
      data: results,
      count: results.length,
      keyword: q
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Search failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

/**
 * GET /api/v1/references/categories/stats
 * Get document count by category
 */
router.get('/categories/stats', (_req: Request, res: Response): void => {
  try {
    const stats = referenceRepository.getDocumentCountByCategory();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch statistics: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

export default router;
