export interface Project {
    id: number;
    name: string;
    client_id: number;
    contractor_id: number | null;
    budget_cost: number | null;
    start_date: string;
    project_address: string | null;
    description: string | null;
    notes: string | null;
    created_by: number;
    status: 'draft' | 'in_progress' | 'completed';
    estimate_status: 'draft' | 'submitted' | 'approved' | 'rejected';
    approved_by: number | null;
    approved_at: string | null;
    approval_notes: string | null;
    created_at: string;
    updated_at: string;
}
export interface ProjectEstimate {
    id: number;
    project_id: number;
    cost_item_id: number;
    quantity: number;
    unit_cost_override: number | null;
    notes: string | null;
    line_total: number | null;
    created_by: number;
    created_at: string;
    version_number: number;
    is_active: boolean;
    custom_description?: string | null;
    custom_unit_rate?: number | null;
    custom_unit?: string | null;
    category_id?: number | null;
    nrm2_work_section_id?: number | null;
    nrm2_code?: string | null;
}
export interface ProjectAttachment {
    id: number;
    project_id: number;
    file_path: string;
    file_type: 'image' | 'pdf' | 'document';
    description: string | null;
    uploaded_by: number;
    uploaded_at: string;
}
export interface CostComponent {
    id: number;
    estimate_id: number;
    component_type: 'material' | 'labor' | 'plant';
    unit_rate: number;
    waste_factor: number;
    total: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface BCISDetailedItem {
    id: number;
    description: string;
    quantity: number;
    unit: string;
    nrm2_code?: string;
    notes?: string;
    components: {
        material?: CostComponent;
        labor?: CostComponent;
        plant?: CostComponent;
    };
    subtotal: number;
}
export interface BCISElementGroup {
    bcis_code: string;
    bcis_name: string;
    sort_order: number;
    items: BCISDetailedItem[];
    subtotal: number;
    item_count: number;
}
export interface BCISGroupedEstimates {
    project_id: number;
    elements: BCISElementGroup[];
    total_items: number;
    grand_total: number;
}
export declare const projectsRepository: {
    getAll: (userId?: number, role?: string) => Project[];
    getById: (id: number) => Project | null;
    getByCreator: (userId: number) => Project[];
    create: (data: {
        name: string;
        client_id: number;
        contractor_id?: number;
        budget_cost?: number;
        start_date: string;
        project_address?: string;
        description?: string;
        notes?: string;
        created_by: number;
    }) => Project;
    update: (id: number, data: {
        name?: string;
        client_id?: number;
        contractor_id?: number;
        budget_cost?: number;
        start_date?: string;
        project_address?: string;
        description?: string;
        notes?: string;
        status?: "draft" | "in_progress" | "completed";
    }) => Project;
    submitEstimate: (id: number) => Project;
    approveEstimate: (id: number, approvedBy: number, notes?: string) => Project;
    rejectEstimate: (id: number, reason?: string) => Project;
    delete: (id: number) => boolean;
};
export declare const projectEstimatesRepository: {
    getAll: (projectId: number) => ProjectEstimate[];
    getById: (id: number) => ProjectEstimate | null;
    create: (data: {
        project_id: number;
        cost_item_id?: number;
        quantity: number;
        unit_cost_override?: number;
        notes?: string;
        line_total?: number;
        created_by: number;
        custom_description?: string;
        custom_unit_rate?: number;
        custom_unit?: string;
        category_id?: number;
        nrm2_work_section_id?: number;
        nrm2_code?: string;
    }) => ProjectEstimate;
    update: (id: number, data: {
        quantity?: number;
        unit_cost_override?: number;
        notes?: string;
        line_total?: number;
    }) => ProjectEstimate;
    delete: (id: number) => boolean;
    getByProjectAndCostItem: (projectId: number, costItemId: number) => ProjectEstimate | null;
    /**
     * Get all estimates grouped by BCIS element
     * Handles both library items (via cost_items) and custom items (via category_id)
     */
    getEstimatesByBCISElement: (projectId: number) => BCISGroupedEstimates;
};
export declare const costComponentsRepository: {
    /**
     * Add a cost component to an estimate (material, labor, or plant)
     */
    create: (data: {
        estimate_id: number;
        component_type: "material" | "labor" | "plant";
        unit_rate: number;
        waste_factor: number;
    }) => CostComponent;
    /**
     * Get a cost component by ID
     */
    getById: (id: number) => CostComponent | null;
    /**
     * Get all cost components for an estimate
     */
    getByEstimateId: (estimateId: number) => CostComponent[];
    /**
     * Update a cost component (unit rate and/or waste factor)
     */
    update: (id: number, data: {
        unit_rate?: number;
        waste_factor?: number;
    }) => CostComponent;
    /**
     * Delete (soft delete) a cost component
     */
    delete: (id: number) => boolean;
    /**
     * Calculate totals for all components of an estimate
     * Updates the total field based on quantity × unit_rate × waste_factor
     */
    recalculateComponentTotals: (estimateId: number) => void;
};
export declare const projectAttachmentsRepository: {
    getAll: (projectId: number) => ProjectAttachment[];
    create: (data: {
        project_id: number;
        file_path: string;
        file_type: "image" | "pdf" | "document";
        description?: string;
        uploaded_by: number;
    }) => ProjectAttachment;
    delete: (id: number) => boolean;
    getById: (id: number) => ProjectAttachment | null;
};
//# sourceMappingURL=projectRepository.d.ts.map