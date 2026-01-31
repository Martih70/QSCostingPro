export type TemplateType = 'quick' | 'standard' | 'complex';

export interface TemplateLineItem {
  id?: number;
  template_id?: number;
  sequence_order?: number;
  cost_item_id?: number | null;
  custom_description?: string;
  custom_unit_rate?: number;
  custom_unit?: string;
  category_id?: number;
  quantity?: number;
  unit_cost_override?: number;
  notes?: string;
  created_at?: string;
}

export interface EstimateTemplate {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  template_type: TemplateType;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstimateTemplateWithItems extends EstimateTemplate {
  line_items: TemplateLineItem[];
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  template_type?: TemplateType;
  is_public?: boolean;
  line_items: TemplateLineItem[];
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface ApplyTemplateData {
  template_id: number;
  override_quantities?: Record<number, number>; // sequence_order -> quantity
}
