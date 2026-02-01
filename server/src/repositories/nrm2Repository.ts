import { Database } from 'better-sqlite3';

export interface NRM2WorkSection {
  id: number;
  sub_element_id: number;
  code: string;
  title: string;
  description?: string;
  measurement_rules?: string;
  unit?: string;
  inclusions?: string;
  exclusions?: string;
  sort_order?: number;
  created_at: string;
}

export interface NRM2SubElement {
  id: number;
  element_id: number;
  code: string;
  title: string;
  description?: string;
  measurement_rules?: string;
  unit?: string;
  sort_order?: number;
  created_at: string;
  work_sections?: NRM2WorkSection[];
}

export interface NRM2Element {
  id: number;
  group_id: number;
  code: string;
  title: string;
  description?: string;
  measurement_rules?: string;
  sort_order?: number;
  created_at: string;
  sub_elements?: NRM2SubElement[];
}

export interface NRM2Group {
  id: number;
  code: string;
  title: string;
  description?: string;
  sort_order?: number;
  created_at: string;
  elements?: NRM2Element[];
}

export interface SearchResult {
  type: 'group' | 'element' | 'sub_element' | 'work_section';
  id: number;
  code: string;
  title: string;
  description?: string;
}

export class NRM2Repository {
  constructor(private db: Database) {}

  /**
   * Get all top-level groups
   */
  getAllGroups(): NRM2Group[] {
    const stmt = this.db.prepare(`
      SELECT id, code, title, description, sort_order, created_at
      FROM nrm2_groups
      ORDER BY sort_order ASC, code ASC
    `);
    return stmt.all() as NRM2Group[];
  }

  /**
   * Get a group with all its elements
   */
  getGroupById(id: number): NRM2Group | null {
    const groupStmt = this.db.prepare(`
      SELECT id, code, title, description, sort_order, created_at
      FROM nrm2_groups
      WHERE id = ?
    `);
    const group = groupStmt.get(id) as NRM2Group | undefined;

    if (!group) return null;

    // Get elements for this group
    group.elements = this.getElementsByGroupId(group.id);
    return group;
  }

  /**
   * Get all elements for a group
   */
  getElementsByGroupId(groupId: number): NRM2Element[] {
    const stmt = this.db.prepare(`
      SELECT id, group_id, code, title, description, measurement_rules, sort_order, created_at
      FROM nrm2_elements
      WHERE group_id = ?
      ORDER BY sort_order ASC, code ASC
    `);
    return stmt.all(groupId) as NRM2Element[];
  }

  /**
   * Get an element with all its sub-elements
   */
  getElementById(id: number): NRM2Element | null {
    const stmt = this.db.prepare(`
      SELECT id, group_id, code, title, description, measurement_rules, sort_order, created_at
      FROM nrm2_elements
      WHERE id = ?
    `);
    const element = stmt.get(id) as NRM2Element | undefined;

    if (!element) return null;

    // Get sub-elements for this element
    element.sub_elements = this.getSubElementsByElementId(element.id);
    return element;
  }

  /**
   * Get all sub-elements for an element
   */
  getSubElementsByElementId(elementId: number): NRM2SubElement[] {
    const stmt = this.db.prepare(`
      SELECT id, element_id, code, title, description, measurement_rules, unit, sort_order, created_at
      FROM nrm2_sub_elements
      WHERE element_id = ?
      ORDER BY sort_order ASC, code ASC
    `);
    return stmt.all(elementId) as NRM2SubElement[];
  }

  /**
   * Get a sub-element with all its work sections
   */
  getSubElementById(id: number): NRM2SubElement | null {
    const stmt = this.db.prepare(`
      SELECT id, element_id, code, title, description, measurement_rules, unit, sort_order, created_at
      FROM nrm2_sub_elements
      WHERE id = ?
    `);
    const subElement = stmt.get(id) as NRM2SubElement | undefined;

    if (!subElement) return null;

    // Get work sections for this sub-element
    subElement.work_sections = this.getWorkSectionsBySubElementId(subElement.id);
    return subElement;
  }

  /**
   * Get all work sections for a sub-element
   */
  getWorkSectionsBySubElementId(subElementId: number): NRM2WorkSection[] {
    const stmt = this.db.prepare(`
      SELECT id, sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order, created_at
      FROM nrm2_work_sections
      WHERE sub_element_id = ?
      ORDER BY sort_order ASC, code ASC
    `);
    return stmt.all(subElementId) as NRM2WorkSection[];
  }

  /**
   * Get a specific work section by ID
   */
  getWorkSectionById(id: number): NRM2WorkSection | null {
    const stmt = this.db.prepare(`
      SELECT id, sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order, created_at
      FROM nrm2_work_sections
      WHERE id = ?
    `);
    return stmt.get(id) as NRM2WorkSection | null;
  }

  /**
   * Get a work section by its code
   */
  getWorkSectionByCode(code: string): NRM2WorkSection | null {
    const stmt = this.db.prepare(`
      SELECT id, sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order, created_at
      FROM nrm2_work_sections
      WHERE code = ?
    `);
    return stmt.get(code) as NRM2WorkSection | null;
  }

  /**
   * Search across all NRM 2 levels
   */
  searchNRM2(keyword: string, limit: number = 50): SearchResult[] {
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
    return stmt.all(
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm,
      limit
    ) as SearchResult[];
  }

  /**
   * Get full hierarchical tree starting from a group
   * Uses lazy loading structure - returns hierarchy but not full details
   */
  getTreeStructure(groupId?: number): any {
    if (groupId) {
      return this.getGroupById(groupId);
    }

    // Return all groups with element summaries
    const groups = this.getAllGroups();
    return groups.map(group => ({
      id: group.id,
      code: group.code,
      title: group.title,
      description: group.description,
      elements_count: this.db.prepare(
        'SELECT COUNT(*) as count FROM nrm2_elements WHERE group_id = ?'
      ).get(group.id) as { count: number }
    }));
  }

  /**
   * Get statistics about the NRM 2 database
   */
  getStatistics(): {
    groups: number;
    elements: number;
    sub_elements: number;
    work_sections: number;
  } {
    const groups = (this.db.prepare('SELECT COUNT(*) as count FROM nrm2_groups').get() as { count: number }).count;
    const elements = (this.db.prepare('SELECT COUNT(*) as count FROM nrm2_elements').get() as { count: number }).count;
    const subElements = (this.db.prepare('SELECT COUNT(*) as count FROM nrm2_sub_elements').get() as { count: number }).count;
    const workSections = (this.db.prepare('SELECT COUNT(*) as count FROM nrm2_work_sections').get() as { count: number }).count;

    return { groups, elements, sub_elements: subElements, work_sections: workSections };
  }
}
