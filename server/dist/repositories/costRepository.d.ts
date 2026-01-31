export interface CostCategory {
    id: number;
    code: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}
export interface CostSubElement {
    id: number;
    category_id: number;
    code: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}
export interface Unit {
    id: number;
    code: string;
    name: string;
    unit_type: string;
    created_at: string;
}
export interface CostItem {
    id: number;
    sub_element_id: number;
    code: string;
    description: string;
    unit_id: number;
    material_cost: number;
    management_cost: number;
    contractor_cost: number;
    is_contractor_required: boolean;
    volunteer_hours_estimated: number | null;
    waste_factor: number;
    currency: string;
    price_date: string | null;
    region: string | null;
    date_recorded: string;
    project_source_id: number | null;
    database_type: string;
    created_at: string;
    updated_at: string;
}
export declare const categoriesRepository: {
    getAll: () => CostCategory[];
    getById: (id: number) => CostCategory | null;
    getByCode: (code: string) => CostCategory | null;
    create: (data: {
        code: string;
        name: string;
        description?: string;
        sort_order?: number;
    }) => CostCategory;
    update: (id: number, data: {
        name?: string;
        description?: string;
        sort_order?: number;
    }) => CostCategory;
    delete: (id: number) => boolean;
};
export declare const subElementsRepository: {
    getAll: () => CostSubElement[];
    getByCategoryId: (categoryId: number) => CostSubElement[];
    getById: (id: number) => CostSubElement | null;
    getByCode: (code: string) => CostSubElement | null;
    create: (data: {
        category_id: number;
        code: string;
        name: string;
        description?: string;
        sort_order?: number;
    }) => CostSubElement;
    update: (id: number, data: {
        name?: string;
        description?: string;
        sort_order?: number;
    }) => CostSubElement;
    delete: (id: number) => boolean;
};
export declare const unitsRepository: {
    getAll: () => Unit[];
    getById: (id: number) => Unit | null;
    getByCode: (code: string) => Unit | null;
};
export declare const costItemsRepository: {
    getAll: (databaseType?: string) => CostItem[];
    getById: (id: number) => CostItem | null;
    getBySubElementId: (subElementId: number) => CostItem[];
    getByCategoryId: (categoryId: number) => CostItem[];
    search: (filters: {
        searchTerm?: string;
        categoryId?: number;
        subElementId?: number;
        unitId?: number;
        region?: string;
        isContractorRequired?: boolean;
        databaseType?: string;
    }) => CostItem[];
    create: (data: {
        sub_element_id: number;
        code: string;
        description: string;
        unit_id: number;
        material_cost: number;
        management_cost?: number;
        contractor_cost?: number;
        is_contractor_required?: boolean;
        volunteer_hours_estimated?: number;
        waste_factor?: number;
        currency?: string;
        price_date?: string;
        region?: string;
        database_type?: string;
    }) => CostItem;
    update: (id: number, data: {
        description?: string;
        material_cost?: number;
        management_cost?: number;
        contractor_cost?: number;
        is_contractor_required?: boolean;
        volunteer_hours_estimated?: number;
        waste_factor?: number;
        region?: string;
        price_date?: string;
    }) => CostItem;
    delete: (id: number) => boolean;
};
//# sourceMappingURL=costRepository.d.ts.map