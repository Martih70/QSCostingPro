/**
 * NRM 2 (New Rules of Measurement) Type Definitions
 */

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

export interface NRM2SearchResult {
  type: 'group' | 'element' | 'sub_element' | 'work_section';
  id: number;
  code: string;
  title: string;
  description?: string;
}

export interface NRM2Statistics {
  groups: number;
  elements: number;
  sub_elements: number;
  work_sections: number;
}

export interface ReferenceDocument {
  id: number;
  name: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  uploaded_by: number;
  uploaded_at: string;
}

export interface NRM2ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
  keyword?: string;
}
