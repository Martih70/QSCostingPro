import type { BuildingContractor, CreateContractorRequest, UpdateContractorRequest } from '../models/types.js';
export interface ContractorFilters {
    searchTerm?: string;
    specialization?: string;
    minRating?: number;
    isActive?: boolean;
}
export declare const contractorsRepository: {
    getAll: (userId: number, filters?: ContractorFilters) => BuildingContractor[];
    getById: (id: number, userId: number) => BuildingContractor | null;
    getByName: (name: string, userId: number) => BuildingContractor | null;
    create: (userId: number, data: CreateContractorRequest) => BuildingContractor;
    update: (id: number, userId: number, data: UpdateContractorRequest) => BuildingContractor;
    delete: (id: number, userId: number) => boolean;
    countByUser: (userId: number) => number;
};
//# sourceMappingURL=contractorRepository.d.ts.map