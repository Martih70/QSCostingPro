import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';
// CLIENTS REPOSITORY
export const clientsRepository = {
    getAll: (userId, filters) => {
        try {
            const db = getDatabase();
            let query = 'SELECT * FROM clients WHERE user_id = ?';
            const params = [userId];
            if (filters?.isActive !== undefined) {
                query += ' AND is_active = ?';
                params.push(filters.isActive ? 1 : 0);
            }
            if (filters?.searchTerm) {
                query += ' AND (name LIKE ? OR email LIKE ? OR city LIKE ?)';
                const searchTerm = `%${filters.searchTerm}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            query += ' ORDER BY created_at DESC';
            const stmt = db.prepare(query);
            return stmt.all(...params);
        }
        catch (error) {
            logger.error(`Error fetching clients: ${error}`);
            throw error;
        }
    },
    getById: (id, userId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?');
            const client = stmt.get(id, userId);
            return client || null;
        }
        catch (error) {
            logger.error(`Error fetching client by ID: ${error}`);
            throw error;
        }
    },
    getByName: (name, userId) => {
        try {
            const db = getDatabase();
            const stmt = db.prepare('SELECT * FROM clients WHERE name = ? AND user_id = ?');
            const client = stmt.get(name, userId);
            return client || null;
        }
        catch (error) {
            logger.error(`Error fetching client by name: ${error}`);
            throw error;
        }
    },
    create: (userId, data) => {
        try {
            // Check if client already exists with same name for this user
            const existing = clientsRepository.getByName(data.name, userId);
            if (existing) {
                throw new Error(`Client "${data.name}" already exists for your account`);
            }
            const db = getDatabase();
            const stmt = db.prepare(`
        INSERT INTO clients (user_id, name, email, phone, address, city, postcode, country, website, is_active, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(userId, data.name, data.email || null, data.phone || null, data.address || null, data.city || null, data.postcode || null, data.country || 'United Kingdom', data.website || null, 1, data.notes || null);
            const client = clientsRepository.getById(result.lastInsertRowid, userId);
            if (!client) {
                throw new Error('Failed to create client');
            }
            logger.info(`Client created: ${data.name} (ID: ${client.id}) for user ${userId}`);
            return client;
        }
        catch (error) {
            logger.error(`Error creating client: ${error}`);
            throw error;
        }
    },
    update: (id, userId, data) => {
        try {
            const db = getDatabase();
            // Check if client exists
            const existing = clientsRepository.getById(id, userId);
            if (!existing) {
                throw new Error('Client not found');
            }
            // Build update query
            const updates = [];
            const values = [];
            if (data.name !== undefined) {
                // Check if name already exists for another client
                const other = db.prepare('SELECT * FROM clients WHERE name = ? AND user_id = ? AND id != ?').get(data.name, userId, id);
                if (other) {
                    throw new Error(`Client name "${data.name}" already exists`);
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
            if (data.notes !== undefined) {
                updates.push('notes = ?');
                values.push(data.notes || null);
            }
            if (data.is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(data.is_active ? 1 : 0);
            }
            if (updates.length === 0) {
                return existing;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id, userId);
            const stmt = db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`);
            stmt.run(...values);
            const updated = clientsRepository.getById(id, userId);
            if (!updated) {
                throw new Error('Failed to update client');
            }
            logger.info(`Client updated: ID ${id}`);
            return updated;
        }
        catch (error) {
            logger.error(`Error updating client: ${error}`);
            throw error;
        }
    },
    delete: (id, userId) => {
        try {
            const db = getDatabase();
            // Check if client exists
            const existing = clientsRepository.getById(id, userId);
            if (!existing) {
                throw new Error('Client not found');
            }
            // Check if client is used in any projects
            const projects = db.prepare('SELECT COUNT(*) as count FROM projects WHERE client_id = ?').get(id);
            if (projects.count > 0) {
                throw new Error(`Cannot delete client - it is linked to ${projects.count} project(s)`);
            }
            const stmt = db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?');
            const result = stmt.run(id, userId);
            logger.info(`Client deleted: ID ${id}`);
            return result.changes > 0;
        }
        catch (error) {
            logger.error(`Error deleting client: ${error}`);
            throw error;
        }
    },
    countByUser: (userId) => {
        try {
            const db = getDatabase();
            const result = db.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').get(userId);
            return result.count;
        }
        catch (error) {
            logger.error(`Error counting clients: ${error}`);
            throw error;
        }
    },
};
//# sourceMappingURL=clientRepository.js.map