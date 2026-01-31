/**
 * EstimationEngine Service
 * Handles all cost calculations for project estimates
 */
export interface LineItemCalculation {
    item_id: number;
    estimate_id: number;
    description: string;
    quantity: number;
    unit_code: string;
    material_cost: number;
    management_cost: number;
    contractor_cost: number;
    waste_factor: number;
    is_contractor_required: boolean;
    material_total: number;
    management_total: number;
    contractor_total: number;
    line_total: number;
}
export interface CategoryTotal {
    category_id: number;
    category_code: string;
    category_name: string;
    line_count: number;
    line_items: LineItemCalculation[];
    subtotal: number;
    contractor_items_subtotal: number;
}
export interface ProjectEstimateTotal {
    project_id: number;
    floor_area_m2: number | null;
    categories: CategoryTotal[];
    subtotal: number;
    contingency_amount: number;
    contingency_percentage: number;
    grand_total: number;
    cost_per_m2: number | null;
    contractor_cost_total: number;
    volunteer_cost_total: number;
}
/**
 * Calculate all line items for a project
 */
export declare function calculateProjectEstimates(projectId: number): LineItemCalculation[];
/**
 * Calculate category-level totals
 */
export declare function calculateCategoryTotals(projectId: number, lineItems: LineItemCalculation[]): CategoryTotal[];
/**
 * Calculate complete project estimate with contingency
 */
export declare function calculateProjectTotal(projectId: number): ProjectEstimateTotal;
/**
 * Update line item total in database after calculation
 */
export declare function updateLineItemTotal(estimateId: number, lineTotal: number): void;
/**
 * Calculate cost per m² from historic data
 * Filters by region, building age, and condition rating
 */
export declare function getCostPerM2Benchmark(categoryId: number, region?: string, buildingAge?: number, conditionRating?: number): number | null;
/**
 * Compare estimate to historic benchmark
 */
export declare function compareToHistoricData(projectId: number, categoryId: number): {
    estimated_cost_per_m2: number | null;
    historic_cost_per_m2: number | null;
    variance_percent: number | null;
};
/**
 * Get estimate summary for display
 */
export declare function getEstimateSummary(projectId: number): {
    total_line_items: number;
    total_cost: number;
    contractor_cost: number;
    volunteer_cost: number;
    cost_per_m2: number | null;
    contingency_amount: number;
    estimate_status: string;
} | null;
//# sourceMappingURL=estimationEngine.d.ts.map