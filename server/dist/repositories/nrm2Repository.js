export class NRM2Repository {
    constructor(db) {
        this.db = db;
    }
    /**
     * Get all top-level groups
     */
    getAllGroups() {
        const stmt = this.db.prepare(`
      SELECT id, code, title, description, sort_order, created_at
      FROM nrm2_groups
      ORDER BY sort_order ASC, code ASC
    `);
        return stmt.all();
    }
    /**
     * Get a group with all its elements
     */
    getGroupById(id) {
        const groupStmt = this.db.prepare(`
      SELECT id, code, title, description, sort_order, created_at
      FROM nrm2_groups
      WHERE id = ?
    `);
        const group = groupStmt.get(id);
        if (!group)
            return null;
        // Get elements for this group
        group.elements = this.getElementsByGroupId(group.id);
        return group;
    }
    /**
     * Get all elements for a group
     */
    getElementsByGroupId(groupId) {
        const stmt = this.db.prepare(`
      SELECT id, group_id, code, title, description, measurement_rules, sort_order, created_at
      FROM nrm2_elements
      WHERE group_id = ?
      ORDER BY sort_order ASC, code ASC
    `);
        return stmt.all(groupId);
    }
    /**
     * Get an element with all its sub-elements
     */
    getElementById(id) {
        const stmt = this.db.prepare(`
      SELECT id, group_id, code, title, description, measurement_rules, sort_order, created_at
      FROM nrm2_elements
      WHERE id = ?
    `);
        const element = stmt.get(id);
        if (!element)
            return null;
        // Get sub-elements for this element
        element.sub_elements = this.getSubElementsByElementId(element.id);
        return element;
    }
    /**
     * Get all sub-elements for an element
     */
    getSubElementsByElementId(elementId) {
        const stmt = this.db.prepare(`
      SELECT id, element_id, code, title, description, measurement_rules, unit, sort_order, created_at
      FROM nrm2_sub_elements
      WHERE element_id = ?
      ORDER BY sort_order ASC, code ASC
    `);
        return stmt.all(elementId);
    }
    /**
     * Get a sub-element with all its work sections
     */
    getSubElementById(id) {
        const stmt = this.db.prepare(`
      SELECT id, element_id, code, title, description, measurement_rules, unit, sort_order, created_at
      FROM nrm2_sub_elements
      WHERE id = ?
    `);
        const subElement = stmt.get(id);
        if (!subElement)
            return null;
        // Get work sections for this sub-element
        subElement.work_sections = this.getWorkSectionsBySubElementId(subElement.id);
        return subElement;
    }
    /**
     * Get all work sections for a sub-element
     */
    getWorkSectionsBySubElementId(subElementId) {
        const stmt = this.db.prepare(`
      SELECT id, sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order, created_at
      FROM nrm2_work_sections
      WHERE sub_element_id = ?
      ORDER BY sort_order ASC, code ASC
    `);
        return stmt.all(subElementId);
    }
    /**
     * Get a specific work section by ID
     */
    getWorkSectionById(id) {
        const stmt = this.db.prepare(`
      SELECT id, sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order, created_at
      FROM nrm2_work_sections
      WHERE id = ?
    `);
        return stmt.get(id);
    }
    /**
     * Get a work section by its code
     */
    getWorkSectionByCode(code) {
        const stmt = this.db.prepare(`
      SELECT id, sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order, created_at
      FROM nrm2_work_sections
      WHERE code = ?
    `);
        return stmt.get(code);
    }
    /**
     * Search across all NRM 2 levels
     */
    searchNRM2(keyword, limit = 50) {
        const searchTerm = `%${keyword}%`;
        const query = `
      SELECT 'group' as type, id, code, title, description FROM nrm2_groups
      WHERE title LIKE ? OR description LIKE ? OR code LIKE ?
      UNION ALL
      SELECT 'element' as type, id, code, title, description FROM nrm2_elements
      WHERE title LIKE ? OR description LIKE ? OR code LIKE ?
      UNION ALL
      SELECT 'sub_element' as type, id, code, title, description FROM nrm2_sub_elements
      WHERE title LIKE ? OR description LIKE ? OR code LIKE ?
      UNION ALL
      SELECT 'work_section' as type, id, code, title, description FROM nrm2_work_sections
      WHERE title LIKE ? OR description LIKE ? OR code LIKE ?
      ORDER BY code ASC
      LIMIT ?
    `;
        const stmt = this.db.prepare(query);
        return stmt.all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit);
    }
    /**
     * Get full hierarchical tree starting from a group
     * Returns complete nested structure with all elements and sub-elements
     */
    getTreeStructure(groupId) {
        if (groupId) {
            return this.getGroupById(groupId);
        }
        // Return all groups with full nested structure
        const groups = this.getAllGroups();
        return groups.map(group => {
            group.elements = this.getElementsByGroupId(group.id).map(element => {
                element.sub_elements = this.getSubElementsByElementId(element.id).map(subElement => {
                    subElement.work_sections = this.getWorkSectionsBySubElementId(subElement.id);
                    return subElement;
                });
                return element;
            });
            return group;
        });
    }
    /**
     * Get statistics about the NRM 2 database
     */
    getStatistics() {
        const groups = this.db.prepare('SELECT COUNT(*) as count FROM nrm2_groups').get().count;
        const elements = this.db.prepare('SELECT COUNT(*) as count FROM nrm2_elements').get().count;
        const subElements = this.db.prepare('SELECT COUNT(*) as count FROM nrm2_sub_elements').get().count;
        const workSections = this.db.prepare('SELECT COUNT(*) as count FROM nrm2_work_sections').get().count;
        return { groups, elements, sub_elements: subElements, work_sections: workSections };
    }
}
//# sourceMappingURL=nrm2Repository.js.map