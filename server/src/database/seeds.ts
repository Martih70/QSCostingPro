import { Database } from 'better-sqlite3';
import { hashPassword } from '../services/authService.js';
import logger from '../utils/logger.js';
import { seedBCISDatabase } from './seedBCIS.js';
import { seedSponsDatabase } from './seedSpons.js';
import { seedNRM2 } from './seedNRM2.js';

/**
 * Seed default units
 */
function seedUnits(db: Database): void {
  try {
    const units = [
      { code: 'm2', name: 'Square Metre', unit_type: 'area' },
      { code: 'm', name: 'Metre', unit_type: 'length' },
      { code: 'item', name: 'Item', unit_type: 'count' },
      { code: 'hours', name: 'Hours', unit_type: 'time' },
    ];

    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM units');
    const { count } = checkStmt.get() as { count: number };

    if (count === 0) {
      const insertStmt = db.prepare(
        'INSERT INTO units (code, name, unit_type) VALUES (?, ?, ?)'
      );
      for (const unit of units) {
        insertStmt.run(unit.code, unit.name, unit.unit_type);
      }
      logger.info(`✓ Seeded ${units.length} units`);
    }
  } catch (error) {
    logger.error(`Error seeding units: ${error}`);
  }
}

/**
 * Seed default cost categories
 */
function seedCategories(db: Database): void {
  try {
    const categories = [
      {
        code: 'CAT-001',
        name: 'Structural Works',
        description: 'Foundation, walls, floors, and structural elements',
      },
      {
        code: 'CAT-002',
        name: 'Roofing',
        description: 'Roof coverings, gutters, and associated work',
      },
      {
        code: 'CAT-003',
        name: 'Electrical Systems',
        description: 'Rewiring, distribution, lighting, and electrical fixtures',
      },
      {
        code: 'CAT-004',
        name: 'Plumbing & HVAC',
        description: 'Water supply, drainage, heating, and ventilation',
      },
      {
        code: 'CAT-005',
        name: 'Interior Finishes',
        description: 'Walls, ceilings, flooring, and interior decoration',
      },
      {
        code: 'CAT-006',
        name: 'Exterior Works',
        description: 'External walls, doors, windows, and finishes',
      },
      {
        code: 'CAT-007',
        name: 'Site Works',
        description: 'Landscaping, drainage, paths, and site preparation',
      },
    ];

    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM cost_categories');
    const { count } = checkStmt.get() as { count: number };

    if (count === 0) {
      const insertStmt = db.prepare(
        'INSERT INTO cost_categories (code, name, description, sort_order) VALUES (?, ?, ?, ?)'
      );
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        insertStmt.run(cat.code, cat.name, cat.description, i);
      }
      logger.info(`✓ Seeded ${categories.length} cost categories`);
    }
  } catch (error) {
    logger.error(`Error seeding categories: ${error}`);
  }
}

/**
 * Seed default cost sub-elements
 */
function seedSubElements(db: Database): void {
  try {
    // Get category IDs
    const getCatStmt = db.prepare('SELECT id, code FROM cost_categories');
    const categories = getCatStmt.all() as Array<{ id: number; code: string }>;
    const catMap = new Map(categories.map((c) => [c.code, c.id]));

    const subElements = [
      // Structural Works (CAT-001)
      {
        categoryCode: 'CAT-001',
        code: 'SUB-001',
        name: 'Foundation Repairs',
        description: 'Repair and consolidation of building foundations',
      },
      {
        categoryCode: 'CAT-001',
        code: 'SUB-002',
        name: 'Wall Repairs/Replacement',
        description: 'Repairing or replacing load-bearing and partition walls',
      },
      {
        categoryCode: 'CAT-001',
        code: 'SUB-003',
        name: 'Floor Structural Work',
        description: 'Repair and replacement of floor joists and structural floors',
      },
      // Roofing (CAT-002)
      {
        categoryCode: 'CAT-002',
        code: 'SUB-004',
        name: 'Roof Covering',
        description: 'Replacement of roof tiles, slate, or other roof coverings',
      },
      {
        categoryCode: 'CAT-002',
        code: 'SUB-005',
        name: 'Gutters & Downpipes',
        description: 'Replacement of guttering, guttering boards, and downpipes',
      },
      // Electrical (CAT-003)
      {
        categoryCode: 'CAT-003',
        code: 'SUB-006',
        name: 'Rewiring',
        description: 'Complete or partial rewiring of the building',
      },
      {
        categoryCode: 'CAT-003',
        code: 'SUB-007',
        name: 'Lighting Installation',
        description: 'Installation of light fittings and lighting systems',
      },
      // Plumbing (CAT-004)
      {
        categoryCode: 'CAT-004',
        code: 'SUB-008',
        name: 'Water Supply',
        description: 'Water piping and supply system installation/repair',
      },
      {
        categoryCode: 'CAT-004',
        code: 'SUB-009',
        name: 'Heating System',
        description: 'Installation and repair of heating systems',
      },
      // Interior (CAT-005)
      {
        categoryCode: 'CAT-005',
        code: 'SUB-010',
        name: 'Wall & Ceiling Finishes',
        description: 'Plastering, painting, and wallcoverings',
      },
      {
        categoryCode: 'CAT-005',
        code: 'SUB-011',
        name: 'Flooring',
        description: 'Installation of floor coverings and finishes',
      },
      // Exterior (CAT-006)
      {
        categoryCode: 'CAT-006',
        code: 'SUB-012',
        name: 'External Walls',
        description: 'Repointing, rendering, or cladding of external walls',
      },
      {
        categoryCode: 'CAT-006',
        code: 'SUB-013',
        name: 'Windows & Doors',
        description: 'Replacement of windows, doors, and frames',
      },
    ];

    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM cost_sub_elements');
    const { count } = checkStmt.get() as { count: number };

    if (count === 0) {
      const insertStmt = db.prepare(
        'INSERT INTO cost_sub_elements (category_id, code, name, description, sort_order) VALUES (?, ?, ?, ?, ?)'
      );
      for (let i = 0; i < subElements.length; i++) {
        const sub = subElements[i];
        const categoryId = catMap.get(sub.categoryCode);
        if (categoryId) {
          insertStmt.run(categoryId, sub.code, sub.name, sub.description, i);
        }
      }
      logger.info(`✓ Seeded ${subElements.length} sub-elements`);
    }
  } catch (error) {
    logger.error(`Error seeding sub-elements: ${error}`);
  }
}

/**
 * Seed default cost items (mock data)
 */
function seedCostItems(db: Database): void {
  try {
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM cost_items');
    const { count } = checkStmt.get() as { count: number };

    if (count === 0) {
      // Get unit and sub-element IDs
      const getUnitsStmt = db.prepare('SELECT id, code FROM units');
      const units = getUnitsStmt.all() as Array<{ id: number; code: string }>;
      const unitMap = new Map(units.map((u) => [u.code, u.id]));

      const getSubsStmt = db.prepare('SELECT id, code FROM cost_sub_elements');
      const subs = getSubsStmt.all() as Array<{ id: number; code: string }>;
      const subMap = new Map(subs.map((s) => [s.code, s.id]));

      const costItems = [
        // Foundation work
        {
          subCode: 'SUB-001',
          code: 'ITM-001',
          description: 'Concrete foundation repair (per m²)',
          unitCode: 'm2',
          materialCost: 150.0,
          managementCost: 20.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 8.0,
        },
        // Wall repairs
        {
          subCode: 'SUB-002',
          code: 'ITM-002',
          description: 'Wall stud replacement (per m)',
          unitCode: 'm',
          materialCost: 45.0,
          managementCost: 10.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 1.5,
        },
        // Floor work
        {
          subCode: 'SUB-003',
          code: 'ITM-003',
          description: 'Floor joist replacement (per m²)',
          unitCode: 'm2',
          materialCost: 80.0,
          managementCost: 15.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 4.0,
        },
        // Roofing
        {
          subCode: 'SUB-004',
          code: 'ITM-004',
          description: 'Roof tiling (per m²)',
          unitCode: 'm2',
          materialCost: 120.0,
          managementCost: 25.0,
          contractorCost: 80.0,
          isContractor: true,
          volunteerHours: 2.0,
        },
        // Gutters
        {
          subCode: 'SUB-005',
          code: 'ITM-005',
          description: 'Gutter replacement (per m)',
          unitCode: 'm',
          materialCost: 35.0,
          managementCost: 8.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 0.5,
        },
        // Electrical rewiring
        {
          subCode: 'SUB-006',
          code: 'ITM-006',
          description: 'Electrical rewiring (per circuit)',
          unitCode: 'item',
          materialCost: 250.0,
          managementCost: 30.0,
          contractorCost: 200.0,
          isContractor: true,
          volunteerHours: 0.0,
        },
        // Lighting
        {
          subCode: 'SUB-007',
          code: 'ITM-007',
          description: 'Light point installation (per item)',
          unitCode: 'item',
          materialCost: 75.0,
          managementCost: 12.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 0.25,
        },
        // Water supply
        {
          subCode: 'SUB-008',
          code: 'ITM-008',
          description: 'Water piping work (per m)',
          unitCode: 'm',
          materialCost: 40.0,
          managementCost: 8.0,
          contractorCost: 35.0,
          isContractor: true,
          volunteerHours: 0.0,
        },
        // Heating
        {
          subCode: 'SUB-009',
          code: 'ITM-009',
          description: 'Heating system installation',
          unitCode: 'item',
          materialCost: 3000.0,
          managementCost: 150.0,
          contractorCost: 1500.0,
          isContractor: true,
          volunteerHours: 0.0,
        },
        // Interior finishes
        {
          subCode: 'SUB-010',
          code: 'ITM-010',
          description: 'Interior wall painting (per m²)',
          unitCode: 'm2',
          materialCost: 12.0,
          managementCost: 3.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 0.3,
        },
        // Flooring
        {
          subCode: 'SUB-011',
          code: 'ITM-011',
          description: 'Carpet flooring (per m²)',
          unitCode: 'm2',
          materialCost: 35.0,
          managementCost: 8.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 0.5,
        },
        // External walls
        {
          subCode: 'SUB-012',
          code: 'ITM-012',
          description: 'External wall repointing (per m²)',
          unitCode: 'm2',
          materialCost: 25.0,
          managementCost: 5.0,
          contractorCost: 0.0,
          isContractor: false,
          volunteerHours: 1.0,
        },
        // Windows and doors
        {
          subCode: 'SUB-013',
          code: 'ITM-013',
          description: 'Window replacement (per item)',
          unitCode: 'item',
          materialCost: 400.0,
          managementCost: 50.0,
          contractorCost: 150.0,
          isContractor: true,
          volunteerHours: 0.0,
        },
      ];

      const insertStmt = db.prepare(`
        INSERT INTO cost_items (
          sub_element_id, code, description, unit_id, material_cost,
          management_cost, contractor_cost, is_contractor_required,
          volunteer_hours_estimated, currency, price_date, database_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of costItems) {
        const subId = subMap.get(item.subCode);
        const unitId = unitMap.get(item.unitCode);
        if (subId && unitId) {
          insertStmt.run(
            subId,
            item.code,
            item.description,
            unitId,
            item.materialCost,
            item.managementCost,
            item.contractorCost,
            item.isContractor ? 1 : 0,
            item.volunteerHours,
            'GBP',
            new Date().toISOString().split('T')[0],
            'witness'
          );
        }
      }

      logger.info(`✓ Seeded ${costItems.length} witness cost items`);
    }
  } catch (error) {
    logger.error(`Error seeding cost items: ${error}`);
  }
}

/**
 * Seed admin user
 */
async function seedAdminUser(db: Database): Promise<void> {
  try {
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const { count } = checkStmt.get() as { count: number };

    if (count === 0) {
      const passwordHash = await hashPassword('admin123456');
      const insertStmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertStmt.run('admin', 'admin@qscosting.local', passwordHash, 'admin', 1);
      logger.info('✓ Seeded admin user (username: admin, password: admin123456)');
    }
  } catch (error) {
    logger.error(`Error seeding admin user: ${error}`);
  }
}

/**
 * Seed Standard UK cost database
 * This provides a pre-populated cost database for non-witness users
 */
function seedStandardUKCosts(db: Database): void {
  try {
    // Check if Standard UK costs already exist
    const checkStmt = db.prepare(
      "SELECT COUNT(*) as count FROM cost_items WHERE database_type = 'standard_uk'"
    );
    const { count } = checkStmt.get() as { count: number };

    if (count > 0) {
      logger.info('✓ Standard UK costs already seeded');
      return;
    }

    // Get or create Standard UK category
    const catCheckStmt = db.prepare("SELECT id FROM cost_categories WHERE code = 'UK-001'");
    let categoryId = (catCheckStmt.get() as { id: number } | undefined)?.id;

    if (!categoryId) {
      const catInsertStmt = db.prepare(
        'INSERT INTO cost_categories (code, name, description, sort_order) VALUES (?, ?, ?, ?)'
      );
      const catResult = catInsertStmt.run(
        'UK-001',
        'Standard UK Construction',
        'Standard UK market construction costs',
        100
      );
      categoryId = catResult.lastInsertRowid as number;
    }

    // Standard UK sub-elements
    const subElements = [
      {
        code: 'UK-SUB-001',
        name: 'Structural Work',
        description: 'Foundation, walls, and structural repairs',
      },
      {
        code: 'UK-SUB-002',
        name: 'Roofing Work',
        description: 'Roof repairs and replacement',
      },
      {
        code: 'UK-SUB-003',
        name: 'Electrical Work',
        description: 'Electrical installation and repairs',
      },
      {
        code: 'UK-SUB-004',
        name: 'Plumbing & Heating',
        description: 'Water supply, drainage, and heating systems',
      },
      {
        code: 'UK-SUB-005',
        name: 'Interior Finishes',
        description: 'Flooring, walls, and interior decoration',
      },
      {
        code: 'UK-SUB-006',
        name: 'Exterior Work',
        description: 'Windows, doors, and external finishes',
      },
    ];

    const subInsertStmt = db.prepare(
      'INSERT INTO cost_sub_elements (category_id, code, name, description, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const subMap = new Map<string, number>();

    for (let i = 0; i < subElements.length; i++) {
      const sub = subElements[i];
      const result = subInsertStmt.run(categoryId, sub.code, sub.name, sub.description, i);
      subMap.set(sub.code, result.lastInsertRowid as number);
    }

    // Get unit IDs
    const unitsStmt = db.prepare('SELECT id, code FROM units');
    const units = unitsStmt.all() as Array<{ id: number; code: string }>;
    const unitMap = new Map(units.map((u) => [u.code, u.id]));

    // Standard UK cost items (realistic UK market rates as of 2024)
    const standardUKItems = [
      // Structural Work
      {
        subCode: 'UK-SUB-001',
        code: 'UK-STR-001',
        description: 'Concrete foundation repair (per m²)',
        unitCode: 'm2',
        materialCost: 180.0,
        managementCost: 25.0,
        contractorCost: 120.0,
      },
      {
        subCode: 'UK-SUB-001',
        code: 'UK-STR-002',
        description: 'Brick wall repair (per m²)',
        unitCode: 'm2',
        materialCost: 95.0,
        managementCost: 15.0,
        contractorCost: 75.0,
      },
      // Roofing
      {
        subCode: 'UK-SUB-002',
        code: 'UK-ROO-001',
        description: 'Slate roof replacement (per m²)',
        unitCode: 'm2',
        materialCost: 145.0,
        managementCost: 30.0,
        contractorCost: 95.0,
      },
      {
        subCode: 'UK-SUB-002',
        code: 'UK-ROO-002',
        description: 'Tile roof replacement (per m²)',
        unitCode: 'm2',
        materialCost: 115.0,
        managementCost: 25.0,
        contractorCost: 75.0,
      },
      // Electrical
      {
        subCode: 'UK-SUB-003',
        code: 'UK-ELE-001',
        description: 'Full electrical rewiring (per circuit)',
        unitCode: 'item',
        materialCost: 280.0,
        managementCost: 40.0,
        contractorCost: 220.0,
      },
      {
        subCode: 'UK-SUB-003',
        code: 'UK-ELE-002',
        description: 'Light fitting installation (per item)',
        unitCode: 'item',
        materialCost: 85.0,
        managementCost: 15.0,
        contractorCost: 45.0,
      },
      // Plumbing & Heating
      {
        subCode: 'UK-SUB-004',
        code: 'UK-PLU-001',
        description: 'Water piping installation (per m)',
        unitCode: 'm',
        materialCost: 50.0,
        managementCost: 10.0,
        contractorCost: 45.0,
      },
      {
        subCode: 'UK-SUB-004',
        code: 'UK-PLU-002',
        description: 'Boiler installation (per item)',
        unitCode: 'item',
        materialCost: 3500.0,
        managementCost: 200.0,
        contractorCost: 1800.0,
      },
      // Interior Finishes
      {
        subCode: 'UK-SUB-005',
        code: 'UK-INT-001',
        description: 'Internal wall painting (per m²)',
        unitCode: 'm2',
        materialCost: 14.0,
        managementCost: 4.0,
        contractorCost: 18.0,
      },
      {
        subCode: 'UK-SUB-005',
        code: 'UK-INT-002',
        description: 'Ceramic floor tiling (per m²)',
        unitCode: 'm2',
        materialCost: 52.0,
        managementCost: 12.0,
        contractorCost: 55.0,
      },
      // Exterior Work
      {
        subCode: 'UK-SUB-006',
        code: 'UK-EXT-001',
        description: 'Window replacement (per item)',
        unitCode: 'item',
        materialCost: 450.0,
        managementCost: 60.0,
        contractorCost: 180.0,
      },
      {
        subCode: 'UK-SUB-006',
        code: 'UK-EXT-002',
        description: 'Door installation (per item)',
        unitCode: 'item',
        materialCost: 350.0,
        managementCost: 50.0,
        contractorCost: 140.0,
      },
    ];

    const costInsertStmt = db.prepare(`
      INSERT INTO cost_items (
        sub_element_id, code, description, unit_id, material_cost,
        management_cost, contractor_cost, is_contractor_required,
        currency, price_date, database_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of standardUKItems) {
      const subId = subMap.get(item.subCode);
      const unitId = unitMap.get(item.unitCode);
      if (subId && unitId) {
        costInsertStmt.run(
          subId,
          item.code,
          item.description,
          unitId,
          item.materialCost,
          item.managementCost,
          item.contractorCost,
          1, // is_contractor_required
          'GBP',
          new Date().toISOString().split('T')[0],
          'standard_uk'
        );
      }
    }

    logger.info(`✓ Seeded ${standardUKItems.length} Standard UK cost items`);
  } catch (error) {
    logger.error(`Error seeding Standard UK costs: ${error}`);
  }
}

/**
 * Run all seeds
 */
export async function runSeeds(db: Database): Promise<void> {
  try {
    logger.info('Starting database seeding...');
    seedUnits(db);
    seedCategories(db);
    seedSubElements(db);
    seedCostItems(db);
    seedStandardUKCosts(db);
    seedBCISDatabase(db);
    seedSponsDatabase(db);
    seedNRM2(db);
    await seedAdminUser(db);
    logger.info('✓ Database seeding completed');
  } catch (error) {
    logger.error(`Database seeding failed: ${error}`);
  }
}
