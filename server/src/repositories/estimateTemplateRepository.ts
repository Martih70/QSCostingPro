import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';
import type {
  EstimateTemplate,
  TemplateLineItem,
  EstimateTemplateWithItems,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../models/types.js';

export const estimateTemplateRepository = {
  // Get all templates for a user (personal + shared)
  getAll: (userId: number, includeShared = true): EstimateTemplate[] => {
    try {
      const db = getDatabase();
      let query = 'SELECT * FROM estimate_templates WHERE user_id = ?';
      const params: any[] = [userId];

      if (includeShared) {
        query = 'SELECT * FROM estimate_templates WHERE user_id = ? OR is_public = 1';
        params.push(1);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = db.prepare(query);
      return stmt.all(...params) as EstimateTemplate[];
    } catch (error) {
      logger.error(`Error fetching templates: ${error}`);
      throw error;
    }
  },

  // Get template with all its line items
  getById: (id: number, userId?: number): EstimateTemplateWithItems | null => {
    try {
      const db = getDatabase();

      let query = 'SELECT * FROM estimate_templates WHERE id = ?';
      const params: any[] = [id];

      if (userId) {
        query += ' AND (user_id = ? OR is_public = 1)';
        params.push(userId);
      }

      const stmt = db.prepare(query);
      const template = stmt.get(...params) as EstimateTemplate | undefined;

      if (!template) return null;

      // Get all line items for this template
      const itemsStmt = db.prepare(
        'SELECT * FROM template_line_items WHERE template_id = ? ORDER BY sequence_order ASC'
      );
      const line_items = itemsStmt.all(id) as TemplateLineItem[];

      return {
        ...template,
        line_items,
      };
    } catch (error) {
      logger.error(`Error fetching template by ID: ${error}`);
      throw error;
    }
  },

  // Create new template with line items
  create: (userId: number, data: CreateTemplateRequest): EstimateTemplateWithItems => {
    const db = getDatabase();
    try {
      // Start transaction
      const insertTemplate = db.prepare(`
        INSERT INTO estimate_templates (user_id, name, description, template_type, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = insertTemplate.run(
        userId,
        data.name,
        data.description || null,
        data.template_type || 'standard',
        data.is_public ? 1 : 0
      );

      const templateId = result.lastInsertRowid as number;

      // Insert line items
      const insertItem = db.prepare(`
        INSERT INTO template_line_items
        (template_id, sequence_order, cost_item_id, custom_description, custom_unit_rate,
         custom_unit, category_id, quantity, unit_cost_override, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const line_items: TemplateLineItem[] = [];

      data.line_items.forEach((item, index) => {
        const itemResult = insertItem.run(
          templateId,
          index + 1, // sequence_order
          item.cost_item_id || null,
          item.custom_description || null,
          item.custom_unit_rate || null,
          item.custom_unit || null,
          item.category_id || null,
          item.quantity || null,
          item.unit_cost_override || null,
          item.notes || null
        );

        line_items.push({
          id: itemResult.lastInsertRowid as number,
          template_id: templateId,
          sequence_order: index + 1,
          cost_item_id: item.cost_item_id,
          custom_description: item.custom_description,
          custom_unit_rate: item.custom_unit_rate,
          custom_unit: item.custom_unit,
          category_id: item.category_id,
          quantity: item.quantity,
          unit_cost_override: item.unit_cost_override,
          notes: item.notes,
          created_at: new Date().toISOString(),
        });
      });

      return {
        id: templateId,
        user_id: userId,
        name: data.name,
        description: data.description,
        template_type: data.template_type || 'standard',
        is_public: data.is_public ? true : false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        line_items,
      };
    } catch (error) {
      logger.error(`Error creating template: ${error}`);
      throw error;
    }
  },

  // Update template
  update: (id: number, userId: number, data: UpdateTemplateRequest): EstimateTemplateWithItems | null => {
    const db = getDatabase();
    try {
      // Check if template exists and user has permission
      const existingTemplate = estimateTemplateRepository.getById(id, userId);
      if (!existingTemplate || existingTemplate.user_id !== userId) {
        return null;
      }

      // Update template metadata
      const updateStmt = db.prepare(`
        UPDATE estimate_templates
        SET name = ?, description = ?, template_type = ?, is_public = ?, updated_at = datetime('now')
        WHERE id = ?
      `);

      updateStmt.run(
        data.name !== undefined ? data.name : existingTemplate.name,
        data.description !== undefined ? data.description : existingTemplate.description,
        data.template_type !== undefined ? data.template_type : existingTemplate.template_type,
        data.is_public !== undefined ? (data.is_public ? 1 : 0) : existingTemplate.is_public,
        id
      );

      // If line_items provided, replace them
      if (data.line_items) {
        // Delete existing items
        const deleteStmt = db.prepare('DELETE FROM template_line_items WHERE template_id = ?');
        deleteStmt.run(id);

        // Insert new items
        const insertItem = db.prepare(`
          INSERT INTO template_line_items
          (template_id, sequence_order, cost_item_id, custom_description, custom_unit_rate,
           custom_unit, category_id, quantity, unit_cost_override, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        data.line_items.forEach((item, index) => {
          insertItem.run(
            id,
            index + 1,
            item.cost_item_id || null,
            item.custom_description || null,
            item.custom_unit_rate || null,
            item.custom_unit || null,
            item.category_id || null,
            item.quantity || null,
            item.unit_cost_override || null,
            item.notes || null
          );
        });
      }

      // Return updated template
      return estimateTemplateRepository.getById(id, userId);
    } catch (error) {
      logger.error(`Error updating template: ${error}`);
      throw error;
    }
  },

  // Delete template
  delete: (id: number, userId: number): boolean => {
    try {
      const db = getDatabase();

      // Verify ownership
      const stmt = db.prepare('SELECT user_id FROM estimate_templates WHERE id = ?');
      const template = stmt.get(id) as EstimateTemplate | undefined;

      if (!template || template.user_id !== userId) {
        return false;
      }

      // Delete template (cascade will delete line items)
      const deleteStmt = db.prepare('DELETE FROM estimate_templates WHERE id = ?');
      deleteStmt.run(id);

      return true;
    } catch (error) {
      logger.error(`Error deleting template: ${error}`);
      throw error;
    }
  },

  // Get templates by type (for defaults)
  getByType: (templateType: string): EstimateTemplate[] => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(
        'SELECT * FROM estimate_templates WHERE template_type = ? AND is_public = 1 ORDER BY created_at DESC'
      );
      return stmt.all(templateType) as EstimateTemplate[];
    } catch (error) {
      logger.error(`Error fetching templates by type: ${error}`);
      throw error;
    }
  },
};
