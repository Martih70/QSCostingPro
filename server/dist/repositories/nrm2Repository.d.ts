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
export declare class NRM2Repository {
    private db;
    constructor(db: Database);
    /**
     * Get all top-level groups with full hierarchy
     */
    getAllGroups(): NRM2Group[];
    /**
     * Get a group with all its elements
     */
    getGroupById(id: number): NRM2Group | null;
    /**
     * Get all elements for a group with full sub-hierarchy
     */
    getElementsByGroupId(groupId: number): NRM2Element[];
    /**
     * Get an element with all its sub-elements
     */
    getElementById(id: number): NRM2Element | null;
    /**
     * Get all sub-elements for an element
     */
    getSubElementsByElementId(elementId: number): NRM2SubElement[];
    /**
     * Get a sub-element with all its work sections
     */
    getSubElementById(id: number): NRM2SubElement | null;
    /**
     * Get all work sections for a sub-element
     */
    getWorkSectionsBySubElementId(subElementId: number): NRM2WorkSection[];
    /**
     * Get a specific work section by ID
     */
    getWorkSectionById(id: number): NRM2WorkSection | null;
    /**
     * Get a work section by its code
     */
    getWorkSectionByCode(code: string): NRM2WorkSection | null;
    /**
     * Search across all NRM 2 levels
     */
    searchNRM2(keyword: string, limit?: number): SearchResult[];
    /**
     * Get full hierarchical tree starting from a group
     * Returns complete nested structure with all elements and sub-elements
     */
    getTreeStructure(groupId?: number): any;
    /**
     * Get statistics about the NRM 2 database
     */
    getStatistics(): {
        groups: number;
        elements: number;
        sub_elements: number;
        work_sections: number;
    };
}
//# sourceMappingURL=nrm2Repository.d.ts.map