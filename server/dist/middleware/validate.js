import { z } from 'zod';
import logger from '../utils/logger.js';
/**
 * Validation middleware factory
 * Validates request body against a Zod schema
 */
export function validate(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                logger.warn(`Validation error: ${error.message}`);
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                });
                return;
            }
            logger.error(`Unexpected validation error: ${error}`);
            res.status(500).json({
                success: false,
                error: 'Validation error',
            });
        }
    };
}
// Validation Schemas
export const createCategorySchema = z.object({
    code: z.string().min(1).max(50).toUpperCase(),
    name: z.string().min(1).max(255),
    description: z.string().max(500).optional(),
    sort_order: z.number().int().nonnegative().optional(),
});
export const updateCategorySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(500).optional().nullable(),
    sort_order: z.number().int().nonnegative().optional(),
});
export const createSubElementSchema = z.object({
    category_id: z.number().int().positive(),
    code: z.string().min(1).max(50).toUpperCase(),
    name: z.string().min(1).max(255),
    description: z.string().max(500).optional(),
    sort_order: z.number().int().nonnegative().optional(),
});
export const updateSubElementSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(500).optional().nullable(),
    sort_order: z.number().int().nonnegative().optional(),
});
export const createCostItemSchema = z.object({
    sub_element_id: z.number().int().positive(),
    code: z.string().min(1).max(50).toUpperCase(),
    description: z.string().min(1).max(500),
    unit_id: z.number().int().positive(),
    material_cost: z.number().nonnegative(),
    management_cost: z.number().nonnegative().optional().default(0),
    contractor_cost: z.number().nonnegative().optional().default(0),
    is_contractor_required: z.boolean().optional().default(false),
    volunteer_hours_estimated: z.number().nonnegative().optional(),
    waste_factor: z.number().min(1).max(2).optional().default(1.05),
    currency: z.string().length(3).optional().default('GBP'),
    price_date: z.string().date().optional(),
    region: z.string().max(100).optional(),
});
export const updateCostItemSchema = z.object({
    description: z.string().min(1).max(500).optional(),
    material_cost: z.number().nonnegative().optional(),
    management_cost: z.number().nonnegative().optional(),
    contractor_cost: z.number().nonnegative().optional(),
    is_contractor_required: z.boolean().optional(),
    volunteer_hours_estimated: z.number().nonnegative().optional(),
    waste_factor: z.number().min(1).max(2).optional(),
    region: z.string().max(100).optional().nullable(),
    price_date: z.string().date().optional().nullable(),
});
export const costItemSearchSchema = z.object({
    searchTerm: z.string().max(255).optional(),
    q: z.string().max(255).optional(), // Accept 'q' parameter as well
    categoryId: z.coerce.number().int().positive().optional(),
    subElementId: z.coerce.number().int().positive().optional(),
    unitId: z.coerce.number().int().positive().optional(),
    region: z.string().max(100).optional(),
    isContractorRequired: z.enum(['true', 'false']).optional(),
    database_type: z.string().max(50).optional(), // Accept database type filter
}).transform((data) => {
    // Use 'q' as searchTerm if searchTerm is not provided
    if (!data.searchTerm && data.q) {
        data.searchTerm = data.q;
    }
    return data;
});
//# sourceMappingURL=validate.js.map