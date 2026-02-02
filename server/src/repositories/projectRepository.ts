import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';

// Types
export interface Project {
  id: number;
  name: string;
  client_id: number;
  contractor_id: number | null;
  budget_cost: number | null;
  start_date: string;
  project_address: string | null;
  description: string | null;
  notes: string | null;
  created_by: number;
  status: 'draft' | 'in_progress' | 'completed';
  estimate_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectEstimate {
  id: number;
  project_id: number;
  cost_item_id: number;
  quantity: number;
  unit_cost_override: number | null;
  notes: string | null;
  line_total: number | null;
  created_by: number;
  created_at: string;
  version_number: number;
  is_active: boolean;
  custom_description?: string | null;
  custom_unit_rate?: number | null;
  custom_unit?: string | null;
  category_id?: number | null;
  nrm2_work_section_id?: number | null;
  nrm2_code?: string | null;
}

export interface ProjectAttachment {
  id: number;
  project_id: number;
  file_path: string;
  file_type: 'image' | 'pdf' | 'document';
  description: string | null;
  uploaded_by: number;
  uploaded_at: string;
}

// BCIS Element Grouping Types
export interface BCISElementItem {
  id: number; // estimate id
  description: string;
  quantity: number;
  unit: string;
  rate: number; // unit_cost_override or custom_unit_rate or material_cost
  total: number; // line_total or calculated
  nrm2_code?: string;
  notes?: string;
}

export interface BCISElementGroup {
  bcis_code: string; // 'BCIS-A', 'BCIS-B', etc.
  bcis_name: string; // 'Substructure', 'Superstructure', etc.
  sort_order: number; // For proper element ordering
  items: BCISElementItem[];
  subtotal: number; // Sum of all item totals
  item_count: number;
}

export interface BCISGroupedEstimates {
  project_id: number;
  elements: BCISElementGroup[];
  total_items: number;
  grand_total: number;
}

// PROJECTS REPOSITORY
export const projectsRepository = {
  getAll: (userId?: number, role?: string): Project[] => {
    try {
      const db = getDatabase();

      // Admins can see all projects
      // Estimators and Viewers can only see projects they created
      const whereClause = (role === 'viewer' || role === 'estimator') ? 'WHERE created_by = ?' : '';
      const params = (role === 'viewer' || role === 'estimator') ? [userId] : [];

      const stmt = db.prepare(`
        SELECT * FROM projects
        ${whereClause}
        ORDER BY created_at DESC
      `);

      const results = params.length > 0 ? stmt.all(...params) : stmt.all();
      return results as Project[];
    } catch (error) {
      logger.error(`Error fetching projects: ${error}`);
      throw error;
    }
  },

  getById: (id: number): Project | null => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
      const result = stmt.get(id) as Project | undefined;
      return result || null;
    } catch (error) {
      logger.error(`Error fetching project ${id}: ${error}`);
      throw error;
    }
  },

  getByCreator: (userId: number): Project[] => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT * FROM projects WHERE created_by = ? ORDER BY created_at DESC');
      return stmt.all(userId) as Project[];
    } catch (error) {
      logger.error(`Error fetching projects for user ${userId}: ${error}`);
      throw error;
    }
  },

  create: (data: {
    name: string;
    client_id: number;
    contractor_id?: number;
    budget_cost?: number;
    start_date: string;
    project_address?: string;
    description?: string;
    notes?: string;
    created_by: number;
  }): Project => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO projects (
          name, client_id, contractor_id, budget_cost, start_date, project_address, description, notes,
          created_by, status, estimate_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.name,
        data.client_id,
        data.contractor_id || null,
        data.budget_cost || null,
        data.start_date,
        data.project_address || null,
        data.description || null,
        data.notes || null,
        data.created_by,
        'draft',
        'draft'
      );

      const created = projectsRepository.getById(result.lastInsertRowid as number);
      if (!created) throw new Error('Failed to create project');
      return created;
    } catch (error) {
      logger.error(`Error creating project: ${error}`);
      throw error;
    }
  },

  update: (
    id: number,
    data: {
      name?: string;
      client_id?: number;
      contractor_id?: number;
      budget_cost?: number;
      start_date?: string;
      project_address?: string;
      description?: string;
      notes?: string;
      status?: 'draft' | 'in_progress' | 'completed';
    }
  ): Project => {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.client_id !== undefined) {
        updates.push('client_id = ?');
        values.push(data.client_id);
      }
      if (data.contractor_id !== undefined) {
        updates.push('contractor_id = ?');
        values.push(data.contractor_id);
      }
      if (data.budget_cost !== undefined) {
        updates.push('budget_cost = ?');
        values.push(data.budget_cost);
      }
      if (data.start_date !== undefined) {
        updates.push('start_date = ?');
        values.push(data.start_date);
      }
      if (data.project_address !== undefined) {
        updates.push('project_address = ?');
        values.push(data.project_address);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        values.push(data.notes);
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        values.push(data.status);
      }

      if (updates.length === 0) {
        const existing = projectsRepository.getById(id);
        if (!existing) throw new Error('Project not found');
        return existing;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE projects
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);

      const updated = projectsRepository.getById(id);
      if (!updated) throw new Error('Failed to update project');
      return updated;
    } catch (error) {
      logger.error(`Error updating project ${id}: ${error}`);
      throw error;
    }
  },

  submitEstimate: (id: number): Project => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        UPDATE projects
        SET estimate_status = 'submitted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(id);

      const updated = projectsRepository.getById(id);
      if (!updated) throw new Error('Failed to submit estimate');
      return updated;
    } catch (error) {
      logger.error(`Error submitting estimate for project ${id}: ${error}`);
      throw error;
    }
  },

  approveEstimate: (id: number, approvedBy: number, notes?: string): Project => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        UPDATE projects
        SET estimate_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP,
            approval_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(approvedBy, notes || null, id);

      const updated = projectsRepository.getById(id);
      if (!updated) throw new Error('Failed to approve estimate');
      return updated;
    } catch (error) {
      logger.error(`Error approving estimate for project ${id}: ${error}`);
      throw error;
    }
  },

  rejectEstimate: (id: number, reason?: string): Project => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        UPDATE projects
        SET estimate_status = 'rejected', approval_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(reason || null, id);

      const updated = projectsRepository.getById(id);
      if (!updated) throw new Error('Failed to reject estimate');
      return updated;
    } catch (error) {
      logger.error(`Error rejecting estimate for project ${id}: ${error}`);
      throw error;
    }
  },

  delete: (id: number): boolean => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);
      return (result.changes || 0) > 0;
    } catch (error) {
      logger.error(`Error deleting project ${id}: ${error}`);
      throw error;
    }
  },
};

// PROJECT ESTIMATES REPOSITORY
export const projectEstimatesRepository = {
  getAll: (projectId: number): ProjectEstimate[] => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM project_estimates
        WHERE project_id = ? AND is_active = 1
        ORDER BY created_at ASC
      `);
      return stmt.all(projectId) as ProjectEstimate[];
    } catch (error) {
      logger.error(`Error fetching estimates for project ${projectId}: ${error}`);
      throw error;
    }
  },

  getById: (id: number): ProjectEstimate | null => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT * FROM project_estimates WHERE id = ?');
      const result = stmt.get(id) as ProjectEstimate | undefined;
      return result || null;
    } catch (error) {
      logger.error(`Error fetching estimate ${id}: ${error}`);
      throw error;
    }
  },

  create: (data: {
    project_id: number;
    cost_item_id?: number;
    quantity: number;
    unit_cost_override?: number;
    notes?: string;
    line_total?: number;
    created_by: number;
    custom_description?: string;
    custom_unit_rate?: number;
    custom_unit?: string;
    category_id?: number;
    nrm2_work_section_id?: number;
    nrm2_code?: string;
  }): ProjectEstimate => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO project_estimates (
          project_id, cost_item_id, quantity, unit_cost_override,
          notes, line_total, created_by, version_number, is_active,
          custom_description, custom_unit_rate, custom_unit, category_id,
          nrm2_work_section_id, nrm2_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.project_id,
        data.cost_item_id || null,
        data.quantity,
        data.unit_cost_override || null,
        data.notes || null,
        data.line_total || null,
        data.created_by,
        1,
        1,
        data.custom_description || null,
        data.custom_unit_rate || null,
        data.custom_unit || null,
        data.category_id || null,
        data.nrm2_work_section_id || null,
        data.nrm2_code || null
      );

      const created = projectEstimatesRepository.getById(result.lastInsertRowid as number);
      if (!created) throw new Error('Failed to create estimate');
      return created;
    } catch (error) {
      logger.error(`Error creating estimate: ${error}`);
      throw error;
    }
  },

  update: (
    id: number,
    data: {
      quantity?: number;
      unit_cost_override?: number;
      notes?: string;
      line_total?: number;
    }
  ): ProjectEstimate => {
    try {
      const db = getDatabase();
      const updates: string[] = [];
      const values: any[] = [];

      if (data.quantity !== undefined) {
        updates.push('quantity = ?');
        values.push(data.quantity);
      }
      if (data.unit_cost_override !== undefined) {
        updates.push('unit_cost_override = ?');
        values.push(data.unit_cost_override);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        values.push(data.notes);
      }
      if (data.line_total !== undefined) {
        updates.push('line_total = ?');
        values.push(data.line_total);
      }

      if (updates.length === 0) {
        const existing = projectEstimatesRepository.getById(id);
        if (!existing) throw new Error('Estimate not found');
        return existing;
      }

      values.push(id);

      const stmt = db.prepare(`
        UPDATE project_estimates
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);

      const updated = projectEstimatesRepository.getById(id);
      if (!updated) throw new Error('Failed to update estimate');
      return updated;
    } catch (error) {
      logger.error(`Error updating estimate ${id}: ${error}`);
      throw error;
    }
  },

  delete: (id: number): boolean => {
    try {
      const db = getDatabase();
      // Soft delete - mark as inactive
      const stmt = db.prepare('UPDATE project_estimates SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return (result.changes || 0) > 0;
    } catch (error) {
      logger.error(`Error deleting estimate ${id}: ${error}`);
      throw error;
    }
  },

  getByProjectAndCostItem: (projectId: number, costItemId: number): ProjectEstimate | null => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM project_estimates
        WHERE project_id = ? AND cost_item_id = ? AND is_active = 1
        ORDER BY created_at DESC LIMIT 1
      `);
      const result = stmt.get(projectId, costItemId) as ProjectEstimate | undefined;
      return result || null;
    } catch (error) {
      logger.error(`Error fetching estimate for project ${projectId} and item ${costItemId}: ${error}`);
      throw error;
    }
  },

  /**
   * Get all estimates grouped by BCIS element
   * Handles both library items (via cost_items) and custom items (via category_id)
   */
  getEstimatesByBCISElement: (projectId: number): BCISGroupedEstimates => {
    try {
      const db = getDatabase();

      // Query that joins project_estimates with cost_items and cost_categories for BCIS data
      // For custom items without cost_item_id, uses the category_id directly
      const stmt = db.prepare(`
        SELECT
          pe.id,
          pe.quantity,
          COALESCE(pe.custom_description, ci.description, 'Unknown Item') as description,
          COALESCE(pe.custom_unit, u.code, 'nr') as unit,
          COALESCE(pe.unit_cost_override, pe.custom_unit_rate, ci.material_cost, 0) as rate,
          COALESCE(pe.line_total,
            CASE
              WHEN pe.custom_unit_rate IS NOT NULL THEN pe.custom_unit_rate * pe.quantity
              WHEN pe.unit_cost_override IS NOT NULL THEN pe.unit_cost_override * pe.quantity
              ELSE (COALESCE(ci.material_cost, 0) * pe.quantity)
            END, 0) as total,
          pe.nrm2_code,
          pe.notes,
          COALESCE(cc.code, 'OTHER') as bcis_code,
          COALESCE(cc.name, 'Other Items') as bcis_name,
          COALESCE(cc.sort_order, 999) as sort_order
        FROM project_estimates pe
        LEFT JOIN cost_items ci ON pe.cost_item_id = ci.id
        LEFT JOIN units u ON ci.unit_id = u.id
        LEFT JOIN cost_categories cc ON
          (ci.sub_element_id IS NOT NULL AND cc.id IN (
            SELECT cse.category_id FROM cost_sub_elements cse WHERE cse.id = ci.sub_element_id
          ))
          OR (pe.cost_item_id IS NULL AND pe.category_id IS NOT NULL AND cc.id = pe.category_id)
        WHERE pe.project_id = ? AND pe.is_active = 1
        ORDER BY sort_order ASC, bcis_code ASC, pe.created_at ASC
      `);

      const results = stmt.all(projectId) as any[];

      // Group by BCIS element
      const groupedMap = new Map<string, BCISElementGroup>();
      let grandTotal = 0;
      let totalItems = 0;

      results.forEach((row) => {
        const bcisCode = row.bcis_code || 'OTHER';
        const bcisKey = `${bcisCode}`;

        if (!groupedMap.has(bcisKey)) {
          groupedMap.set(bcisKey, {
            bcis_code: bcisCode,
            bcis_name: row.bcis_name,
            sort_order: row.sort_order,
            items: [],
            subtotal: 0,
            item_count: 0,
          });
        }

        const group = groupedMap.get(bcisKey)!;
        group.items.push({
          id: row.id,
          description: row.description,
          quantity: row.quantity,
          unit: row.unit,
          rate: row.rate,
          total: row.total,
          nrm2_code: row.nrm2_code,
          notes: row.notes,
        });
        group.subtotal += row.total;
        group.item_count++;
        totalItems++;
        grandTotal += row.total;
      });

      // Convert map to sorted array
      const elements = Array.from(groupedMap.values()).sort(
        (a, b) => a.sort_order - b.sort_order
      );

      return {
        project_id: projectId,
        elements,
        total_items: totalItems,
        grand_total: grandTotal,
      };
    } catch (error) {
      logger.error(`Error fetching estimates by BCIS element for project ${projectId}: ${error}`);
      throw error;
    }
  },
};

// PROJECT ATTACHMENTS REPOSITORY
export const projectAttachmentsRepository = {
  getAll: (projectId: number): ProjectAttachment[] => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM project_attachments
        WHERE project_id = ?
        ORDER BY uploaded_at DESC
      `);
      return stmt.all(projectId) as ProjectAttachment[];
    } catch (error) {
      logger.error(`Error fetching attachments for project ${projectId}: ${error}`);
      throw error;
    }
  },

  create: (data: {
    project_id: number;
    file_path: string;
    file_type: 'image' | 'pdf' | 'document';
    description?: string;
    uploaded_by: number;
  }): ProjectAttachment => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO project_attachments (
          project_id, file_path, file_type, description, uploaded_by
        ) VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.project_id,
        data.file_path,
        data.file_type,
        data.description || null,
        data.uploaded_by
      );

      const created = projectAttachmentsRepository.getById(result.lastInsertRowid as number);
      if (!created) throw new Error('Failed to create attachment');
      return created;
    } catch (error) {
      logger.error(`Error creating attachment: ${error}`);
      throw error;
    }
  },

  delete: (id: number): boolean => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM project_attachments WHERE id = ?');
      const result = stmt.run(id);
      return (result.changes || 0) > 0;
    } catch (error) {
      logger.error(`Error deleting attachment ${id}: ${error}`);
      throw error;
    }
  },

  getById: (id: number): ProjectAttachment | null => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT * FROM project_attachments WHERE id = ?');
      const result = stmt.get(id) as ProjectAttachment | undefined;
      return result || null;
    } catch (error) {
      logger.error(`Error fetching attachment ${id}: ${error}`);
      throw error;
    }
  },
};
