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
          custom_description, custom_unit_rate, custom_unit, category_id,
          nrm2_work_section_id, nrm2_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.project_id, data.cost_item_id || null, data.quantity, data.unit_cost_override || null, data.notes || null, data.line_total || null, data.created_by, 1, 1, data.custom_description || null, data.custom_unit_rate || null, data.custom_unit || null, data.category_id || null, data.nrm2_work_section_id || null, data.nrm2_code || null);
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
    /**
     * Get all estimates grouped by BCIS element
     * Handles both library items (via cost_items) and custom items (via category_id)
     */
    getEstimatesByBCISElement: (projectId) => {
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
            const results = stmt.all(projectId);
            // Group by BCIS element
            const groupedMap = new Map();
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
                const group = groupedMap.get(bcisKey);
                // Fetch cost components for this estimate
                const components = {};
                const costComponents = costComponentsRepository.getByEstimateId(row.id);
                costComponents.forEach((component) => {
                    if (component.is_active) {
                        components[component.component_type] = component;
                    }
                });
                // Calculate subtotal from components
                let itemSubtotal = 0;
                Object.values(components).forEach((comp) => {
                    itemSubtotal += comp.total;
                });
                group.items.push({
                    id: row.id,
                    description: row.description,
                    quantity: row.quantity,
                    unit: row.unit,
                    nrm2_code: row.nrm2_code,
                    notes: row.notes,
                    components,
                    subtotal: itemSubtotal,
                });
                group.subtotal += itemSubtotal;
                group.item_count++;
                totalItems++;
                grandTotal += itemSubtotal;
            });
            // Convert map to sorted array
            const elements = Array.from(groupedMap.values()).sort((a, b) => a.sort_order - b.sort_order);
            return {
                project_id: projectId,
                elements,
                total_items: totalItems,
                grand_total: grandTotal,
            };
        }
        catch (error) {
            logger.error(`Error fetching estimates by BCIS element for project ${projectId}: ${error}`);
            throw error;
        }
    },
};
// COST COMPONENTS REPOSITORY (for QS-level detail with material/labor/plant)
export const costComponentsRepository = {
    /**
     * Add a cost component to an estimate (material, labor, or plant)
     */
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO estimate_cost_components (
          estimate_id, component_type, unit_rate, waste_factor
        ) VALUES (?, ?, ?, ?)
      `);
            const result = stmt.run(data.estimate_id, data.component_type, data.unit_rate, data.waste_factor);
            const created = costComponentsRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create cost component');
            return created;
        }
        catch (error) {
            logger.error(`Error creating cost component: ${error}`);
            throw error;
        }
    },
    /**
     * Get a cost component by ID
     */
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM estimate_cost_components WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching cost component ${id}: ${error}`);
            throw error;
        }
    },
    /**
     * Get all cost components for an estimate
     */
    getByEstimateId: (estimateId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM estimate_cost_components
        WHERE estimate_id = ? AND is_active = 1
        ORDER BY component_type ASC
      `);
            return stmt.all(estimateId);
        }
        catch (error) {
            logger.error(`Error fetching cost components for estimate ${estimateId}: ${error}`);
            throw error;
        }
    },
    /**
     * Update a cost component (unit rate and/or waste factor)
     */
    update: (id, data) => {
        try {
            const db = getDatabase();
            const updates = [];
            const values = [];
            if (data.unit_rate !== undefined) {
                updates.push('unit_rate = ?');
                values.push(data.unit_rate);
            }
            if (data.waste_factor !== undefined) {
                updates.push('waste_factor = ?');
                values.push(data.waste_factor);
            }
            if (updates.length === 0) {
                const existing = costComponentsRepository.getById(id);
                if (!existing)
                    throw new Error('Cost component not found');
                return existing;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const stmt = db.prepare(`
        UPDATE estimate_cost_components
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
            stmt.run(...values);
            const updated = costComponentsRepository.getById(id);
            if (!updated)
                throw new Error('Failed to update cost component');
            return updated;
        }
        catch (error) {
            logger.error(`Error updating cost component ${id}: ${error}`);
            throw error;
        }
    },
    /**
     * Delete (soft delete) a cost component
     */
    delete: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('UPDATE estimate_cost_components SET is_active = 0 WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting cost component ${id}: ${error}`);
            throw error;
        }
    },
    /**
     * Calculate totals for all components of an estimate
     * Updates the total field based on quantity × unit_rate × waste_factor
     */
    recalculateComponentTotals: (estimateId) => {
        try {
            const db = getDatabase();
            // Get the estimate to get quantity
            const estimateStmt = db.prepare('SELECT quantity FROM project_estimates WHERE id = ?');
            const estimate = estimateStmt.get(estimateId);
            if (!estimate)
                throw new Error('Estimate not found');
            // Update all components with calculated totals
            const updateStmt = db.prepare(`
        UPDATE estimate_cost_components
        SET total = ? * unit_rate * waste_factor
        WHERE estimate_id = ? AND is_active = 1
      `);
            updateStmt.run(estimate.quantity, estimateId);
        }
        catch (error) {
            logger.error(`Error recalculating component totals for estimate ${estimateId}: ${error}`);
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