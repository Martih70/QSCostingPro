export interface ProjectEstimate {
  id: number
  project_id: number
  cost_item_id?: number | null
  quantity: number
  unit_cost_override?: number
  notes?: string
  line_total: number
  created_by: number
  created_at: string
  version_number: number
  is_active: boolean
  // Custom item fields
  custom_description?: string
  custom_unit_rate?: number
  custom_unit?: string
  category_id?: number
  // NRM 2 fields
  nrm2_work_section_id?: number | null
  nrm2_code?: string | null
}

export interface CreateEstimateRequest {
  cost_item_id?: number
  quantity: number
  unit_cost_override?: number
  notes?: string
  // Custom item fields
  custom_description?: string
  custom_unit_rate?: number
  custom_unit?: string
  category_id?: number
  // NRM 2 fields
  nrm2_work_section_id?: number
  nrm2_code?: string
}

export interface LineItemCalculation {
  item_id: number
  estimate_id: number
  description: string
  quantity: number
  unit_code: string
  material_cost: number
  management_cost: number
  contractor_cost: number
  waste_factor: number
  is_contractor_required: boolean
  material_total: number
  management_total: number
  contractor_total: number
  line_total: number
  // NRM 2 fields (optional)
  nrm2_code?: string
  nrm2_work_section_id?: number
}

export interface CategoryTotal {
  category_id: number
  category_code: string
  category_name: string
  line_count: number
  line_items: LineItemCalculation[]
  subtotal: number
  contractor_items_subtotal: number
}

export interface ProjectEstimateTotal {
  project_id: number
  floor_area_m2?: number
  categories: CategoryTotal[]
  subtotal: number
  contingency_amount: number
  contingency_percentage: number
  grand_total: number
  cost_per_m2?: number
  contractor_cost_total: number
  volunteer_cost_total: number
}

export interface EstimateResponse {
  success: boolean
  data: ProjectEstimate
}

export interface EstimatesListResponse {
  success: boolean
  data: {
    project_id: number
    estimate_count: number
    estimates: ProjectEstimate[]
    totals: ProjectEstimateTotal
  }
}

export interface EstimateSummaryResponse {
  success: boolean
  data: {
    project: {
      id: number
      name: string
      location: string
      floor_area_m2?: number
      contingency_percentage: number
    }
    estimate: ProjectEstimateTotal
  }
}
