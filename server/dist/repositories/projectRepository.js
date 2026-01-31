import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';
// PROJECTS REPOSITORY
export const projectsRepository = {
    getAll: (userId, role) => {
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
            return results;
        }
        catch (error) {
            logger.error(`Error fetching projects: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching project ${id}: ${error}`);
            throw error;
        }
    },
    getByCreator: (userId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM projects WHERE created_by = ? ORDER BY created_at DESC');
            return stmt.all(userId);
        }
        catch (error) {
            logger.error(`Error fetching projects for user ${userId}: ${error}`);
            throw error;
        }
    },
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO projects (
          name, client_id, contractor_id, budget_cost, start_date, project_address, description, notes,
          created_by, status, estimate_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.name, data.client_id, data.contractor_id || null, data.budget_cost || null, data.start_date, data.project_address || null, data.description || null, data.notes || null, data.created_by, 'draft', 'draft');
            const created = projectsRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create project');
            return created;
        }
        catch (error) {
            logger.error(`Error creating project: ${error}`);
            throw error;
        }
    },
    update: (id, data) => {
        try {
            const db = getDatabase();
            const updates = [];
            const values = [];
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
                if (!existing)
                    throw new Error('Project not found');
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
            if (!updated)
                throw new Error('Failed to update project');
            return updated;
        }
        catch (error) {
            logger.error(`Error updating project ${id}: ${error}`);
            throw error;
        }
    },
    submitEstimate: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        UPDATE projects
        SET estimate_status = 'submitted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            stmt.run(id);
            const updated = projectsRepository.getById(id);
            if (!updated)
                throw new Error('Failed to submit estimate');
            return updated;
        }
        catch (error) {
            logger.error(`Error submitting estimate for project ${id}: ${error}`);
            throw error;
        }
    },
    approveEstimate: (id, approvedBy, notes) => {
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
            if (!updated)
                throw new Error('Failed to approve estimate');
            return updated;
        }
        catch (error) {
            logger.error(`Error approving estimate for project ${id}: ${error}`);
            throw error;
        }
    },
    rejectEstimate: (id, reason) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        UPDATE projects
        SET estimate_status = 'rejected', approval_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            stmt.run(reason || null, id);
            const updated = projectsRepository.getById(id);
            if (!updated)
                throw new Error('Failed to reject estimate');
            return updated;
        }
        catch (error) {
            logger.error(`Error rejecting estimate for project ${id}: ${error}`);
            throw error;
        }
    },
    delete: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting project ${id}: ${error}`);
            throw error;
        }
    },
};
// PROJECT ESTIMATES REPOSITORY
export const projectEstimatesRepository = {
    getAll: (projectId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM project_estimates
        WHERE project_id = ? AND is_active = 1
        ORDER BY created_at ASC
      `);
            return stmt.all(projectId);
        }
        catch (error) {
            logger.error(`Error fetching estimates for project ${projectId}: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM project_estimates WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching estimate ${id}: ${error}`);
            throw error;
        }
    },
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO project_estimates (
          project_id, cost_item_id, quantity, unit_cost_override,
          notes, line_total, created_by, version_number, is_active,
          custom_description, custom_unit_rate, custom_unit, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.project_id, data.cost_item_id || null, data.quantity, data.unit_cost_override || null, data.notes || null, data.line_total || null, data.created_by, 1, 1, data.custom_description || null, data.custom_unit_rate || null, data.custom_unit || null, data.category_id || null);
            const created = projectEstimatesRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create estimate');
            return created;
        }
        catch (error) {
            logger.error(`Error creating estimate: ${error}`);
            throw error;
        }
    },
    update: (id, data) => {
        try {
            const db = getDatabase();
            const updates = [];
            const values = [];
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
                if (!existing)
                    throw new Error('Estimate not found');
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
            if (!updated)
                throw new Error('Failed to update estimate');
            return updated;
        }
        catch (error) {
            logger.error(`Error updating estimate ${id}: ${error}`);
            throw error;
        }
    },
    delete: (id) => {
        try {
            const db = getDatabase();
            // Soft delete - mark as inactive
            const stmt = db.prepare('UPDATE project_estimates SET is_active = 0 WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting estimate ${id}: ${error}`);
            throw error;
        }
    },
    getByProjectAndCostItem: (projectId, costItemId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM project_estimates
        WHERE project_id = ? AND cost_item_id = ? AND is_active = 1
        ORDER BY created_at DESC LIMIT 1
      `);
            const result = stmt.get(projectId, costItemId);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching estimate for project ${projectId} and item ${costItemId}: ${error}`);
            throw error;
        }
    },
};
// PROJECT ATTACHMENTS REPOSITORY
export const projectAttachmentsRepository = {
    getAll: (projectId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM project_attachments
        WHERE project_id = ?
        ORDER BY uploaded_at DESC
      `);
            return stmt.all(projectId);
        }
        catch (error) {
            logger.error(`Error fetching attachments for project ${projectId}: ${error}`);
            throw error;
        }
    },
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO project_attachments (
          project_id, file_path, file_type, description, uploaded_by
        ) VALUES (?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.project_id, data.file_path, data.file_type, data.description || null, data.uploaded_by);
            const created = projectAttachmentsRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create attachment');
            return created;
        }
        catch (error) {
            logger.error(`Error creating attachment: ${error}`);
            throw error;
        }
    },
    delete: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('DELETE FROM project_attachments WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting attachment ${id}: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM project_attachments WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching attachment ${id}: ${error}`);
            throw error;
        }
    },
};
//# sourceMappingURL=projectRepository.js.map