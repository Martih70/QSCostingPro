import type { EstimateTemplate, EstimateTemplateWithItems, CreateTemplateRequest, UpdateTemplateRequest } from '../models/types.js';
export declare const estimateTemplateRepository: {
    getAll: (userId: number, includeShared?: boolean) => EstimateTemplate[];
    getById: (id: number, userId?: number) => EstimateTemplateWithItems | null;
    create: (userId: number, data: CreateTemplateRequest) => EstimateTemplateWithItems;
    update: (id: number, userId: number, data: UpdateTemplateRequest) => EstimateTemplateWithItems | null;
    delete: (id: number, userId: number) => boolean;
    getByType: (templateType: string) => EstimateTemplate[];
};
//# sourceMappingURL=estimateTemplateRepository.d.ts.map