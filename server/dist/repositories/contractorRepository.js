import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';
// BUILDING CONTRACTORS REPOSITORY
export const contractorsRepository = {
    getAll: (userId, filters) => {
        try {
            const db = getDatabase();
            let query = 'SELECT * FROM building_contractors WHERE user_id = ?';
            const params = [userId];
            if (filters?.isActive !== undefined) {
                query += ' AND is_active = ?';
                params.push(filters.isActive ? 1 : 0);
            }
            if (filters?.specialization) {
                query += ' AND specialization LIKE ?';
                params.push(`%${filters.specialization}%`);
            }
            if (filters?.minRating !== undefined) {
                query += ' AND rating >= ?';
                params.push(filters.minRating);
            }
            if (filters?.searchTerm) {
                query += ' AND (name LIKE ? OR email LIKE ? OR city LIKE ? OR specialization LIKE ?)';
                const searchTerm = `%${filters.searchTerm}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            query += ' ORDER BY rating DESC, name ASC';
            const stmt = db.prepare(query);
            return stmt.all(...params);
        }
        catch (error) {
            logger.error(`Error fetching contractors: ${error}`);
            throw error;
        }
    },
    getById: (id, userId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM building_contractors WHERE id = ? AND user_id = ?');
            const contractor = stmt.get(id, userId);
            return contractor || null;
        }
        catch (error) {
            logger.error(`Error fetching contractor by ID: ${error}`);
            throw error;
        }
    },
    getByName: (name, userId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM building_contractors WHERE name = ? AND user_id = ?');
            const contractor = stmt.get(name, userId);
            return contractor || null;
        }
        catch (error) {
            logger.error(`Error fetching contractor by name: ${error}`);
            throw error;
        }
    },
    create: (userId, data) => {
        try {
            // Check if contractor already exists with same name for this user
            const existing = contractorsRepository.getByName(data.name, userId);
            if (existing) {
                throw new Error(`Contractor "${data.name}" already exists for your account`);
            }
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO building_contractors (user_id, name, email, phone, address, city, postcode, country, website, specialization, is_active, rating, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(userId, data.name, data.email || null, data.phone || null, data.address || null, data.city || null, data.postcode || null, data.country || 'United Kingdom', data.website || null, data.specialization || null, 1, 0, // Default rating
            data.notes || null);
            const contractor = contractorsRepository.getById(result.lastInsertRowid, userId);
            if (!contractor) {
                throw new Error('Failed to create contractor');
            }
            logger.info(`Contractor created: ${data.name} (ID: ${contractor.id}) for user ${userId}`);
            return contractor;
        }
        catch (error) {
            logger.error(`Error creating contractor: ${error}`);
            throw error;
        }
    },
    update: (id, userId, data) => {
        try {
            const db = getDatabase();
            // Check if contractor exists
            const existing = contractorsRepository.getById(id, userId);
            if (!existing) {
                throw new Error('Contractor not found');
            }
            // Build update query
            const updates = [];
            const values = [];
            if (data.name !== undefined) {
                // Check if name already exists for another contractor
                const other = db
                    .prepare('SELECT * FROM building_contractors WHERE name = ? AND user_id = ? AND id != ?')
                    .get(data.name, userId, id);
                if (other) {
                    throw new Error(`Contractor name "${data.name}" already exists`);
                }
                updates.push('name = ?');
                values.push(data.name);
            }
            if (data.email !== undefined) {
                updates.push('email = ?');
                values.push(data.email || null);
            }
            if (data.phone !== undefined) {
                updates.push('phone = ?');
                values.push(data.phone || null);
            }
            if (data.address !== undefined) {
                updates.push('address = ?');
                values.push(data.address || null);
            }
            if (data.city !== undefined) {
                updates.push('city = ?');
                values.push(data.city || null);
            }
            if (data.postcode !== undefined) {
                updates.push('postcode = ?');
                values.push(data.postcode || null);
            }
            if (data.country !== undefined) {
                updates.push('country = ?');
                values.push(data.country || 'United Kingdom');
            }
            if (data.website !== undefined) {
                updates.push('website = ?');
                values.push(data.website || null);
            }
            if (data.specialization !== undefined) {
                updates.push('specialization = ?');
                values.push(data.specialization || null);
            }
            if (data.notes !== undefined) {
                updates.push('notes = ?');
                values.push(data.notes || null);
            }
            if (data.is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(data.is_active ? 1 : 0);
            }
            if (data.rating !== undefined) {
                // Validate rating is between 0 and 5
                if (data.rating < 0 || data.rating > 5) {
                    throw new Error('Rating must be between 0 and 5');
                }
                updates.push('rating = ?');
                values.push(data.rating);
            }
            if (updates.length === 0) {
                return existing;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id, userId);
            const stmt = db.prepare(`UPDATE building_contractors SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`);
            stmt.run(...values);
            const updated = contractorsRepository.getById(id, userId);
            if (!updated) {
                throw new Error('Failed to update contractor');
            }
            logger.info(`Contractor updated: ID ${id}`);
            return updated;
        }
        catch (error) {
            logger.error(`Error updating contractor: ${error}`);
            throw error;
        }
    },
    delete: (id, userId) => {
        try {
            const db = getDatabase();
            // Check if contractor exists
            const existing = contractorsRepository.getById(id, userId);
            if (!existing) {
                throw new Error('Contractor not found');
            }
            // Check if contractor is used in any projects
            const projects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE contractor_id = ?').get(id);
            if (projects.count > 0) {
                throw new Error(`Cannot delete contractor - it is linked to ${projects.count} project(s)`);
            }
            const stmt = db.prepare('DELETE FROM building_contractors WHERE id = ? AND user_id = ?');
            const result = stmt.run(id, userId);
            logger.info(`Contractor deleted: ID ${id}`);
            return result.changes > 0;
        }
        catch (error) {
            logger.error(`Error deleting contractor: ${error}`);
            throw error;
        }
    },
    countByUser: (userId) => {
        try {
            const db = getDatabase();
            const result = db
                .prepare('SELECT COUNT(*) as count FROM building_contractors WHERE user_id = ?')
                .get(userId);
            return result.count;
        }
        catch (error) {
            logger.error(`Error counting contractors: ${error}`);
            throw error;
        }
    },
};
//# sourceMappingURL=contractorRepository.js.map