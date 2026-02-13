import { Database } from 'better-sqlite3';
/**
 * Seed default cost categories
 * @deprecated - Cost database removed, using BoQ Library instead
 */
export declare function seedCategories(db: Database): void;
/**
 * Seed default cost sub-elements
 * @deprecated - Cost database removed, using BoQ Library instead
 */
export declare function seedSubElements(db: Database): void;
/**
 * Seed default cost items (mock data)
 * @deprecated - Cost database removed, using BoQ Library instead
 */
export declare function seedCostItems(db: Database): void;
/**
 * Seed Standard UK cost database
 * This provides a pre-populated cost database for non-witness users
 * @deprecated - Cost database removed, using BoQ Library instead
 */
export declare function seedStandardUKCosts(db: Database): void;
/**
 * Run all seeds
 */
export declare function runSeeds(db: Database): Promise<void>;
//# sourceMappingURL=seeds.d.ts.map