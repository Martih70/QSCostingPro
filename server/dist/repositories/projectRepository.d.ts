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
    }) => ProjectEstimate;
    update: (id: number, data: {
        quantity?: number;
        unit_cost_override?: number;
        notes?: string;
        line_total?: number;
    }) => ProjectEstimate;
    delete: (id: number) => boolean;
    getByProjectAndCostItem: (projectId: number, costItemId: number) => ProjectEstimate | null;
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