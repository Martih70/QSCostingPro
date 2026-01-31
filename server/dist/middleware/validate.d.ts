import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
/**
 * Validation middleware factory
 * Validates request body against a Zod schema
 */
export declare function validate(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare const createCategorySchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sort_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    description?: string | undefined;
    sort_order?: number | undefined;
}, {
    name: string;
    code: string;
    description?: string | undefined;
    sort_order?: number | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sort_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    sort_order?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    sort_order?: number | undefined;
}>;
export declare const createSubElementSchema: z.ZodObject<{
    category_id: z.ZodNumber;
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sort_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    category_id: number;
    description?: string | undefined;
    sort_order?: number | undefined;
}, {
    name: string;
    code: string;
    category_id: number;
    description?: string | undefined;
    sort_order?: number | undefined;
}>;
export declare const updateSubElementSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sort_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    sort_order?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    sort_order?: number | undefined;
}>;
export declare const createCostItemSchema: z.ZodObject<{
    sub_element_id: z.ZodNumber;
    code: z.ZodString;
    description: z.ZodString;
    unit_id: z.ZodNumber;
    material_cost: z.ZodNumber;
    management_cost: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    contractor_cost: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    is_contractor_required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    volunteer_hours_estimated: z.ZodOptional<z.ZodNumber>;
    waste_factor: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    price_date: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    code: string;
    sub_element_id: number;
    unit_id: number;
    material_cost: number;
    management_cost: number;
    contractor_cost: number;
    is_contractor_required: boolean;
    waste_factor: number;
    currency: string;
    volunteer_hours_estimated?: number | undefined;
    price_date?: string | undefined;
    region?: string | undefined;
}, {
    description: string;
    code: string;
    sub_element_id: number;
    unit_id: number;
    material_cost: number;
    management_cost?: number | undefined;
    contractor_cost?: number | undefined;
    is_contractor_required?: boolean | undefined;
    volunteer_hours_estimated?: number | undefined;
    waste_factor?: number | undefined;
    currency?: string | undefined;
    price_date?: string | undefined;
    region?: string | undefined;
}>;
export declare const updateCostItemSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    material_cost: z.ZodOptional<z.ZodNumber>;
    management_cost: z.ZodOptional<z.ZodNumber>;
    contractor_cost: z.ZodOptional<z.ZodNumber>;
    is_contractor_required: z.ZodOptional<z.ZodBoolean>;
    volunteer_hours_estimated: z.ZodOptional<z.ZodNumber>;
    waste_factor: z.ZodOptional<z.ZodNumber>;
    region: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price_date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    material_cost?: number | undefined;
    management_cost?: number | undefined;
    contractor_cost?: number | undefined;
    is_contractor_required?: boolean | undefined;
    volunteer_hours_estimated?: number | undefined;
    waste_factor?: number | undefined;
    price_date?: string | null | undefined;
    region?: string | null | undefined;
}, {
    description?: string | undefined;
    material_cost?: number | undefined;
    management_cost?: number | undefined;
    contractor_cost?: number | undefined;
    is_contractor_required?: boolean | undefined;
    volunteer_hours_estimated?: number | undefined;
    waste_factor?: number | undefined;
    price_date?: string | null | undefined;
    region?: string | null | undefined;
}>;
export declare const costItemSearchSchema: z.ZodEffects<z.ZodObject<{
    searchTerm: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodNumber>;
    subElementId: z.ZodOptional<z.ZodNumber>;
    unitId: z.ZodOptional<z.ZodNumber>;
    region: z.ZodOptional<z.ZodString>;
    isContractorRequired: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    database_type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    region?: string | undefined;
    searchTerm?: string | undefined;
    q?: string | undefined;
    categoryId?: number | undefined;
    subElementId?: number | undefined;
    unitId?: number | undefined;
    isContractorRequired?: "true" | "false" | undefined;
    database_type?: string | undefined;
}, {
    region?: string | undefined;
    searchTerm?: string | undefined;
    q?: string | undefined;
    categoryId?: number | undefined;
    subElementId?: number | undefined;
    unitId?: number | undefined;
    isContractorRequired?: "true" | "false" | undefined;
    database_type?: string | undefined;
}>, {
    region?: string | undefined;
    searchTerm?: string | undefined;
    q?: string | undefined;
    categoryId?: number | undefined;
    subElementId?: number | undefined;
    unitId?: number | undefined;
    isContractorRequired?: "true" | "false" | undefined;
    database_type?: string | undefined;
}, {
    region?: string | undefined;
    searchTerm?: string | undefined;
    q?: string | undefined;
    categoryId?: number | undefined;
    subElementId?: number | undefined;
    unitId?: number | undefined;
    isContractorRequired?: "true" | "false" | undefined;
    database_type?: string | undefined;
}>;
//# sourceMappingURL=validate.d.ts.map