import type { Client, CreateClientRequest, UpdateClientRequest } from '../models/types.js';
export interface ClientFilters {
    searchTerm?: string;
    isActive?: boolean;
}
export declare const clientsRepository: {
    getAll: (userId: number, filters?: ClientFilters) => Client[];
    getById: (id: number, userId: number) => Client | null;
    getByName: (name: string, userId: number) => Client | null;
    create: (userId: number, data: CreateClientRequest) => Client;
    update: (id: number, userId: number, data: UpdateClientRequest) => Client;
    delete: (id: number, userId: number) => boolean;
    countByUser: (userId: number) => number;
};
//# sourceMappingURL=clientRepository.d.ts.map