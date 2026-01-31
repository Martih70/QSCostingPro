import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';
// CATEGORIES REPOSITORY
export const categoriesRepository = {
    getAll: () => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM cost_categories
        ORDER BY sort_order ASC, name ASC
      `);
            return stmt.all();
        }
        catch (error) {
            logger.error(`Error fetching categories: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM cost_categories WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching category ${id}: ${error}`);
            throw error;
        }
    },
    getByCode: (code) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM cost_categories WHERE code = ?');
            const result = stmt.get(code);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching category by code ${code}: ${error}`);
            throw error;
        }
    },
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO cost_categories (code, name, description, sort_order)
        VALUES (?, ?, ?, ?)
      `);
            const result = stmt.run(data.code, data.name, data.description || null, data.sort_order || 0);
            const created = categoriesRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create category');
            return created;
        }
        catch (error) {
            logger.error(`Error creating category: ${error}`);
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
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            if (data.sort_order !== undefined) {
                updates.push('sort_order = ?');
                values.push(data.sort_order);
            }
            if (updates.length === 0) {
                const existing = categoriesRepository.getById(id);
                if (!existing)
                    throw new Error('Category not found');
                return existing;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const stmt = db.prepare(`
        UPDATE cost_categories
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
            stmt.run(...values);
            const updated = categoriesRepository.getById(id);
            if (!updated)
                throw new Error('Failed to update category');
            return updated;
        }
        catch (error) {
            logger.error(`Error updating category ${id}: ${error}`);
            throw error;
        }
    },
    delete: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('DELETE FROM cost_categories WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting category ${id}: ${error}`);
            throw error;
        }
    },
};
// SUB-ELEMENTS REPOSITORY
export const subElementsRepository = {
    getAll: () => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM cost_sub_elements
        ORDER BY category_id ASC, sort_order ASC
      `);
            return stmt.all();
        }
        catch (error) {
            logger.error(`Error fetching sub-elements: ${error}`);
            throw error;
        }
    },
    getByCategoryId: (categoryId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM cost_sub_elements
        WHERE category_id = ?
        ORDER BY sort_order ASC
      `);
            return stmt.all(categoryId);
        }
        catch (error) {
            logger.error(`Error fetching sub-elements for category ${categoryId}: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM cost_sub_elements WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching sub-element ${id}: ${error}`);
            throw error;
        }
    },
    getByCode: (code) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM cost_sub_elements WHERE code = ?');
            const result = stmt.get(code);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching sub-element by code ${code}: ${error}`);
            throw error;
        }
    },
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO cost_sub_elements (category_id, code, name, description, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.category_id, data.code, data.name, data.description || null, data.sort_order || 0);
            const created = subElementsRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create sub-element');
            return created;
        }
        catch (error) {
            logger.error(`Error creating sub-element: ${error}`);
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
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            if (data.sort_order !== undefined) {
                updates.push('sort_order = ?');
                values.push(data.sort_order);
            }
            if (updates.length === 0) {
                const existing = subElementsRepository.getById(id);
                if (!existing)
                    throw new Error('Sub-element not found');
                return existing;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const stmt = db.prepare(`
        UPDATE cost_sub_elements
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
            stmt.run(...values);
            const updated = subElementsRepository.getById(id);
            if (!updated)
                throw new Error('Failed to update sub-element');
            return updated;
        }
        catch (error) {
            logger.error(`Error updating sub-element ${id}: ${error}`);
            throw error;
        }
    },
    delete: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('DELETE FROM cost_sub_elements WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting sub-element ${id}: ${error}`);
            throw error;
        }
    },
};
// UNITS REPOSITORY
export const unitsRepository = {
    getAll: () => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM units ORDER BY unit_type ASC, name ASC');
            return stmt.all();
        }
        catch (error) {
            logger.error(`Error fetching units: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM units WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching unit ${id}: ${error}`);
            throw error;
        }
    },
    getByCode: (code) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM units WHERE code = ?');
            const result = stmt.get(code);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching unit by code ${code}: ${error}`);
            throw error;
        }
    },
};
// COST ITEMS REPOSITORY
export const costItemsRepository = {
    getAll: (databaseType) => {
        try {
            const db = getDatabase();
            // If databaseType is specified, filter by it; otherwise return all
            const whereClause = databaseType ? `WHERE database_type = ?` : '';
            const params = databaseType ? [databaseType] : [];
            const stmt = db.prepare(`
        SELECT * FROM cost_items
        ${whereClause}
        ORDER BY sub_element_id ASC, code ASC
      `);
            return params.length > 0 ? stmt.all(...params) : stmt.all();
        }
        catch (error) {
            logger.error(`Error fetching cost items: ${error}`);
            throw error;
        }
    },
    getById: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM cost_items WHERE id = ?');
            const result = stmt.get(id);
            return result || null;
        }
        catch (error) {
            logger.error(`Error fetching cost item ${id}: ${error}`);
            throw error;
        }
    },
    getBySubElementId: (subElementId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT * FROM cost_items
        WHERE sub_element_id = ?
        ORDER BY code ASC
      `);
            return stmt.all(subElementId);
        }
        catch (error) {
            logger.error(`Error fetching cost items for sub-element ${subElementId}: ${error}`);
            throw error;
        }
    },
    getByCategoryId: (categoryId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        SELECT ci.* FROM cost_items ci
        JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
        WHERE cse.category_id = ?
        ORDER BY ci.code ASC
      `);
            return stmt.all(categoryId);
        }
        catch (error) {
            logger.error(`Error fetching cost items for category ${categoryId}: ${error}`);
            throw error;
        }
    },
    search: (filters) => {
        try {
            const db = getDatabase();
            const conditions = [];
            const values = [];
            if (filters.searchTerm) {
                conditions.push('(ci.code LIKE ? OR ci.description LIKE ?)');
                const term = `%${filters.searchTerm}%`;
                values.push(term, term);
            }
            if (filters.categoryId) {
                conditions.push('cse.category_id = ?');
                values.push(filters.categoryId);
            }
            if (filters.subElementId) {
                conditions.push('ci.sub_element_id = ?');
                values.push(filters.subElementId);
            }
            if (filters.unitId) {
                conditions.push('ci.unit_id = ?');
                values.push(filters.unitId);
            }
            if (filters.region) {
                conditions.push('ci.region = ?');
                values.push(filters.region);
            }
            if (filters.isContractorRequired !== undefined) {
                conditions.push('ci.is_contractor_required = ?');
                values.push(filters.isContractorRequired ? 1 : 0);
            }
            if (filters.databaseType) {
                conditions.push('ci.database_type = ?');
                values.push(filters.databaseType);
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const sql = `
        SELECT ci.* FROM cost_items ci
        JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
        ${whereClause}
        ORDER BY ci.code ASC
      `;
            const stmt = db.prepare(sql);
            return stmt.all(...values);
        }
        catch (error) {
            logger.error(`Error searching cost items: ${error}`);
            throw error;
        }
    },
    create: (data) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO cost_items (
          sub_element_id, code, description, unit_id, material_cost,
          management_cost, contractor_cost, is_contractor_required,
          volunteer_hours_estimated, waste_factor, currency, price_date, region, database_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.sub_element_id, data.code, data.description, data.unit_id, data.material_cost, data.management_cost || 0, data.contractor_cost || 0, data.is_contractor_required ? 1 : 0, data.volunteer_hours_estimated || null, data.waste_factor || 1.05, data.currency || 'GBP', data.price_date || null, data.region || null, data.database_type || 'witness');
            const created = costItemsRepository.getById(result.lastInsertRowid);
            if (!created)
                throw new Error('Failed to create cost item');
            return created;
        }
        catch (error) {
            logger.error(`Error creating cost item: ${error}`);
            throw error;
        }
    },
    update: (id, data) => {
        try {
            const db = getDatabase();
            const updates = [];
            const values = [];
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            if (data.material_cost !== undefined) {
                updates.push('material_cost = ?');
                values.push(data.material_cost);
            }
            if (data.management_cost !== undefined) {
                updates.push('management_cost = ?');
                values.push(data.management_cost);
            }
            if (data.contractor_cost !== undefined) {
                updates.push('contractor_cost = ?');
                values.push(data.contractor_cost);
            }
            if (data.is_contractor_required !== undefined) {
                updates.push('is_contractor_required = ?');
                values.push(data.is_contractor_required ? 1 : 0);
            }
            if (data.volunteer_hours_estimated !== undefined) {
                updates.push('volunteer_hours_estimated = ?');
                values.push(data.volunteer_hours_estimated);
            }
            if (data.waste_factor !== undefined) {
                updates.push('waste_factor = ?');
                values.push(data.waste_factor);
            }
            if (data.region !== undefined) {
                updates.push('region = ?');
                values.push(data.region);
            }
            if (data.price_date !== undefined) {
                updates.push('price_date = ?');
                values.push(data.price_date);
            }
            if (updates.length === 0) {
                const existing = costItemsRepository.getById(id);
                if (!existing)
                    throw new Error('Cost item not found');
                return existing;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const stmt = db.prepare(`
        UPDATE cost_items
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
            stmt.run(...values);
            const updated = costItemsRepository.getById(id);
            if (!updated)
                throw new Error('Failed to update cost item');
            return updated;
        }
        catch (error) {
            logger.error(`Error updating cost item ${id}: ${error}`);
            throw error;
        }
    },
    delete: (id) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('DELETE FROM cost_items WHERE id = ?');
            const result = stmt.run(id);
            return (result.changes || 0) > 0;
        }
        catch (error) {
            logger.error(`Error deleting cost item ${id}: ${error}`);
            throw error;
        }
    },
};
//# sourceMappingURL=costRepository.js.map