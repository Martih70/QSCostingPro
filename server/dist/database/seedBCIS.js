import logger from '../utils/logger.js';
const BCIS_ELEMENTS = [
    {
        code: 'BCIS-A',
        name: 'Substructure',
        description: 'Foundations, basement work, and ground preparation',
    },
    {
        code: 'BCIS-B',
        name: 'Superstructure',
        description: 'Frame, walls, floors, roof, stairs',
    },
    {
        code: 'BCIS-C',
        name: 'Internal Finishes',
        description: 'Wall and ceiling finishes, flooring, decoration',
    },
    {
        code: 'BCIS-D',
        name: 'Fittings and Furnishings',
        description: 'Kitchens, bathrooms, built-in furniture',
    },
    {
        code: 'BCIS-E',
        name: 'Services',
        description: 'Mechanical, Electrical, Plumbing (MEP)',
    },
    {
        code: 'BCIS-F',
        name: 'Prefabricated Buildings',
        description: 'Modular and prefabricated construction',
    },
    {
        code: 'BCIS-G',
        name: 'Building Work to Complete Services',
        description: 'Ducts, conduits, and infrastructure for services',
    },
    {
        code: 'BCIS-H',
        name: 'External Works',
        description: 'Site works, landscaping, roads, parking',
    },
    {
        code: 'BCIS-I',
        name: 'General Summary',
        description: 'Insurance, contingencies, and other costs',
    },
    {
        code: 'BCIS-J',
        name: 'Preliminaries and General Items',
        description: 'Site supervision, temporary works, clearance',
    },
    {
        code: 'BCIS-K',
        name: 'Design and Professional Fees',
        description: 'Architecture, engineering, and consultant fees',
    },
];
const BCIS_SUB_ELEMENTS = [
    // Substructure (A)
    {
        elementCode: 'BCIS-A',
        code: 'BCIS-A1',
        name: 'Foundations',
        description: 'Excavation, ground beams, pile foundations',
    },
    {
        elementCode: 'BCIS-A',
        code: 'BCIS-A2',
        name: 'Basement Construction',
        description: 'Basement walls, floors, waterproofing',
    },
    {
        elementCode: 'BCIS-A',
        code: 'BCIS-A3',
        name: 'Ground Floor Construction',
        description: 'Ground floor slabs and structural support',
    },
    // Superstructure (B)
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B1',
        name: 'Frame',
        description: 'Steel, concrete, timber frames',
    },
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B2',
        name: 'Upper Floors',
        description: 'Intermediate floor slabs and joists',
    },
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B3',
        name: 'Roof Structure',
        description: 'Timber trusses, steel frames, concrete ribs',
    },
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B4',
        name: 'External Walls',
        description: 'Brickwork, blockwork, cladding, insulation',
    },
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B5',
        name: 'Windows and Doors',
        description: 'Windows, external doors, curtain walls',
    },
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B6',
        name: 'Roof Covering',
        description: 'Tiles, slates, felt, membranes',
    },
    {
        elementCode: 'BCIS-B',
        code: 'BCIS-B7',
        name: 'Stairs',
        description: 'Internal and external staircases',
    },
    // Internal Finishes (C)
    {
        elementCode: 'BCIS-C',
        code: 'BCIS-C1',
        name: 'Wall Finishes',
        description: 'Plasterboard, plaster, paint, wallcoverings',
    },
    {
        elementCode: 'BCIS-C',
        code: 'BCIS-C2',
        name: 'Ceiling Finishes',
        description: 'Suspended ceilings, plaster, boards',
    },
    {
        elementCode: 'BCIS-C',
        code: 'BCIS-C3',
        name: 'Flooring',
        description: 'Tiles, carpet, timber, vinyl, concrete',
    },
    {
        elementCode: 'BCIS-C',
        code: 'BCIS-C4',
        name: 'Partitioning',
        description: 'Internal partition walls and glazing',
    },
    // Fittings and Furnishings (D)
    {
        elementCode: 'BCIS-D',
        code: 'BCIS-D1',
        name: 'Sanitary Appliances',
        description: 'Basins, toilets, baths, shower trays',
    },
    {
        elementCode: 'BCIS-D',
        code: 'BCIS-D2',
        name: 'Kitchen Equipment',
        description: 'Fitted kitchens, units, appliances',
    },
    {
        elementCode: 'BCIS-D',
        code: 'BCIS-D3',
        name: 'Built-in Furniture',
        description: 'Wardrobes, shelving, joinery',
    },
    // Services (E)
    {
        elementCode: 'BCIS-E',
        code: 'BCIS-E1',
        name: 'Electrical Services',
        description: 'Distribution, lighting, power, safety',
    },
    {
        elementCode: 'BCIS-E',
        code: 'BCIS-E2',
        name: 'Water and Sanitation',
        description: 'Cold water, hot water, drainage, WCs',
    },
    {
        elementCode: 'BCIS-E',
        code: 'BCIS-E3',
        name: 'Heating and Cooling',
        description: 'Central heating, ventilation, air conditioning',
    },
    {
        elementCode: 'BCIS-E',
        code: 'BCIS-E4',
        name: 'Gas Supply',
        description: 'Gas distribution and appliances',
    },
    {
        elementCode: 'BCIS-E',
        code: 'BCIS-E5',
        name: 'Lifts and Conveyances',
        description: 'Elevators, escalators, ramps',
    },
    // External Works (H)
    {
        elementCode: 'BCIS-H',
        code: 'BCIS-H1',
        name: 'Site Works',
        description: 'Excavation, grading, site preparation',
    },
    {
        elementCode: 'BCIS-H',
        code: 'BCIS-H2',
        name: 'Roads and Parking',
        description: 'Asphalt, concrete, drainage',
    },
    {
        elementCode: 'BCIS-H',
        code: 'BCIS-H3',
        name: 'Landscaping',
        description: 'Planting, paving, boundaries',
    },
    {
        elementCode: 'BCIS-H',
        code: 'BCIS-H4',
        name: 'Fencing and Gates',
        description: 'Boundary fencing, gates, walls',
    },
];
const BCIS_ITEMS = [
    // Substructure - Foundations
    {
        subElementCode: 'BCIS-A1',
        code: 'BCIS-A1-001',
        description: 'Strip foundations (per m³ concrete)',
        unitCode: 'm3',
        materialCost: 850,
        managementCost: 120,
        contractorCost: 450,
        bcisReference: 'A1010',
    },
    {
        subElementCode: 'BCIS-A1',
        code: 'BCIS-A1-002',
        description: 'Raft foundation (per m²)',
        unitCode: 'm2',
        materialCost: 180,
        managementCost: 35,
        contractorCost: 140,
        bcisReference: 'A1020',
    },
    {
        subElementCode: 'BCIS-A1',
        code: 'BCIS-A1-003',
        description: 'Pile foundation (per pile)',
        unitCode: 'item',
        materialCost: 2500,
        managementCost: 300,
        contractorCost: 1500,
        bcisReference: 'A1030',
    },
    // Superstructure - Frame
    {
        subElementCode: 'BCIS-B1',
        code: 'BCIS-B1-001',
        description: 'Structural steel frame (per tonne)',
        unitCode: 'item',
        materialCost: 1200,
        managementCost: 150,
        contractorCost: 800,
        bcisReference: 'B1010',
    },
    {
        subElementCode: 'BCIS-B1',
        code: 'BCIS-B1-002',
        description: 'Concrete frame (per m³)',
        unitCode: 'm3',
        materialCost: 650,
        managementCost: 100,
        contractorCost: 400,
        bcisReference: 'B1020',
    },
    {
        subElementCode: 'BCIS-B1',
        code: 'BCIS-B1-003',
        description: 'Timber frame construction (per m²)',
        unitCode: 'm2',
        materialCost: 95,
        managementCost: 15,
        contractorCost: 65,
        bcisReference: 'B1030',
    },
    // Superstructure - Upper Floors
    {
        subElementCode: 'BCIS-B2',
        code: 'BCIS-B2-001',
        description: 'Reinforced concrete floor slab (per m²)',
        unitCode: 'm2',
        materialCost: 75,
        managementCost: 15,
        contractorCost: 50,
        bcisReference: 'B2010',
    },
    {
        subElementCode: 'BCIS-B2',
        code: 'BCIS-B2-002',
        description: 'Timber floor joists (per m²)',
        unitCode: 'm2',
        materialCost: 35,
        managementCost: 8,
        contractorCost: 25,
        bcisReference: 'B2020',
    },
    {
        subElementCode: 'BCIS-B2',
        code: 'BCIS-B2-003',
        description: 'Steel beam floor system (per m²)',
        unitCode: 'm2',
        materialCost: 95,
        managementCost: 18,
        contractorCost: 60,
        bcisReference: 'B2030',
    },
    // Superstructure - Roof
    {
        subElementCode: 'BCIS-B3',
        code: 'BCIS-B3-001',
        description: 'Timber roof truss system (per m²)',
        unitCode: 'm2',
        materialCost: 55,
        managementCost: 12,
        contractorCost: 40,
        bcisReference: 'B3010',
    },
    {
        subElementCode: 'BCIS-B3',
        code: 'BCIS-B3-002',
        description: 'Flat roof structure (per m²)',
        unitCode: 'm2',
        materialCost: 65,
        managementCost: 14,
        contractorCost: 45,
        bcisReference: 'B3020',
    },
    // Superstructure - External Walls
    {
        subElementCode: 'BCIS-B4',
        code: 'BCIS-B4-001',
        description: 'Cavity brick wall (per m²)',
        unitCode: 'm2',
        materialCost: 115,
        managementCost: 20,
        contractorCost: 75,
        bcisReference: 'B4010',
    },
    {
        subElementCode: 'BCIS-B4',
        code: 'BCIS-B4-002',
        description: 'Blockwork wall with insulation (per m²)',
        unitCode: 'm2',
        materialCost: 95,
        managementCost: 18,
        contractorCost: 65,
        bcisReference: 'B4020',
    },
    {
        subElementCode: 'BCIS-B4',
        code: 'BCIS-B4-003',
        description: 'Metal cladding system (per m²)',
        unitCode: 'm2',
        materialCost: 140,
        managementCost: 25,
        contractorCost: 85,
        bcisReference: 'B4030',
    },
    // Superstructure - Windows and Doors
    {
        subElementCode: 'BCIS-B5',
        code: 'BCIS-B5-001',
        description: 'Aluminium window (per m²)',
        unitCode: 'm2',
        materialCost: 520,
        managementCost: 80,
        contractorCost: 200,
        bcisReference: 'B5010',
    },
    {
        subElementCode: 'BCIS-B5',
        code: 'BCIS-B5-002',
        description: 'Timber window (per m²)',
        unitCode: 'm2',
        materialCost: 450,
        managementCost: 70,
        contractorCost: 180,
        bcisReference: 'B5020',
    },
    {
        subElementCode: 'BCIS-B5',
        code: 'BCIS-B5-003',
        description: 'External door (per item)',
        unitCode: 'item',
        materialCost: 450,
        managementCost: 60,
        contractorCost: 150,
        bcisReference: 'B5030',
    },
    // Superstructure - Roof Covering
    {
        subElementCode: 'BCIS-B6',
        code: 'BCIS-B6-001',
        description: 'Clay tile roof covering (per m²)',
        unitCode: 'm2',
        materialCost: 155,
        managementCost: 28,
        contractorCost: 95,
        bcisReference: 'B6010',
    },
    {
        subElementCode: 'BCIS-B6',
        code: 'BCIS-B6-002',
        description: 'Slate roof covering (per m²)',
        unitCode: 'm2',
        materialCost: 245,
        managementCost: 40,
        contractorCost: 140,
        bcisReference: 'B6020',
    },
    {
        subElementCode: 'BCIS-B6',
        code: 'BCIS-B6-003',
        description: 'Asphalt roofing (per m²)',
        unitCode: 'm2',
        materialCost: 75,
        managementCost: 15,
        contractorCost: 45,
        bcisReference: 'B6030',
    },
    {
        subElementCode: 'BCIS-B6',
        code: 'BCIS-B6-004',
        description: 'Membrane roofing (per m²)',
        unitCode: 'm2',
        materialCost: 85,
        managementCost: 16,
        contractorCost: 50,
        bcisReference: 'B6040',
    },
    // Internal Finishes - Wall Finishes
    {
        subElementCode: 'BCIS-C1',
        code: 'BCIS-C1-001',
        description: 'Plasterboard wall (per m²)',
        unitCode: 'm2',
        materialCost: 28,
        managementCost: 6,
        contractorCost: 18,
        bcisReference: 'C1010',
    },
    {
        subElementCode: 'BCIS-C1',
        code: 'BCIS-C1-002',
        description: 'Plaster finish (per m²)',
        unitCode: 'm2',
        materialCost: 18,
        managementCost: 4,
        contractorCost: 12,
        bcisReference: 'C1020',
    },
    {
        subElementCode: 'BCIS-C1',
        code: 'BCIS-C1-003',
        description: 'Wall paint finish (per m²)',
        unitCode: 'm2',
        materialCost: 8,
        managementCost: 2,
        contractorCost: 6,
        bcisReference: 'C1030',
    },
    // Internal Finishes - Flooring
    {
        subElementCode: 'BCIS-C3',
        code: 'BCIS-C3-001',
        description: 'Ceramic floor tiling (per m²)',
        unitCode: 'm2',
        materialCost: 65,
        managementCost: 14,
        contractorCost: 55,
        bcisReference: 'C3010',
    },
    {
        subElementCode: 'BCIS-C3',
        code: 'BCIS-C3-002',
        description: 'Carpet flooring (per m²)',
        unitCode: 'm2',
        materialCost: 45,
        managementCost: 10,
        contractorCost: 30,
        bcisReference: 'C3020',
    },
    {
        subElementCode: 'BCIS-C3',
        code: 'BCIS-C3-003',
        description: 'Timber flooring (per m²)',
        unitCode: 'm2',
        materialCost: 85,
        managementCost: 16,
        contractorCost: 50,
        bcisReference: 'C3030',
    },
    {
        subElementCode: 'BCIS-C3',
        code: 'BCIS-C3-004',
        description: 'Vinyl flooring (per m²)',
        unitCode: 'm2',
        materialCost: 35,
        managementCost: 8,
        contractorCost: 20,
        bcisReference: 'C3040',
    },
    // Services - Electrical
    {
        subElementCode: 'BCIS-E1',
        code: 'BCIS-E1-001',
        description: 'Main switchboard installation (per item)',
        unitCode: 'item',
        materialCost: 1500,
        managementCost: 200,
        contractorCost: 1000,
        bcisReference: 'E1010',
    },
    {
        subElementCode: 'BCIS-E1',
        code: 'BCIS-E1-002',
        description: 'Circuit wiring (per 100m)',
        unitCode: 'item',
        materialCost: 350,
        managementCost: 50,
        contractorCost: 250,
        bcisReference: 'E1020',
    },
    {
        subElementCode: 'BCIS-E1',
        code: 'BCIS-E1-003',
        description: 'Light point installation (per item)',
        unitCode: 'item',
        materialCost: 95,
        managementCost: 16,
        contractorCost: 65,
        bcisReference: 'E1030',
    },
    // Services - Water and Sanitation
    {
        subElementCode: 'BCIS-E2',
        code: 'BCIS-E2-001',
        description: 'Water supply piping (per m)',
        unitCode: 'm',
        materialCost: 55,
        managementCost: 10,
        contractorCost: 40,
        bcisReference: 'E2010',
    },
    {
        subElementCode: 'BCIS-E2',
        code: 'BCIS-E2-002',
        description: 'Soil and vent piping (per m)',
        unitCode: 'm',
        materialCost: 75,
        managementCost: 14,
        contractorCost: 50,
        bcisReference: 'E2020',
    },
    {
        subElementCode: 'BCIS-E2',
        code: 'BCIS-E2-003',
        description: 'Sanitary appliance installation (per item)',
        unitCode: 'item',
        materialCost: 250,
        managementCost: 40,
        contractorCost: 150,
        bcisReference: 'E2030',
    },
    // Services - Heating and Cooling
    {
        subElementCode: 'BCIS-E3',
        code: 'BCIS-E3-001',
        description: 'Gas boiler installation (per item)',
        unitCode: 'item',
        materialCost: 4000,
        managementCost: 400,
        contractorCost: 2000,
        bcisReference: 'E3010',
    },
    {
        subElementCode: 'BCIS-E3',
        code: 'BCIS-E3-002',
        description: 'Heating radiator installation (per item)',
        unitCode: 'item',
        materialCost: 250,
        managementCost: 40,
        contractorCost: 120,
        bcisReference: 'E3020',
    },
    {
        subElementCode: 'BCIS-E3',
        code: 'BCIS-E3-003',
        description: 'Ventilation system (per room)',
        unitCode: 'item',
        materialCost: 450,
        managementCost: 70,
        contractorCost: 280,
        bcisReference: 'E3030',
    },
    // External Works - Roads and Parking
    {
        subElementCode: 'BCIS-H2',
        code: 'BCIS-H2-001',
        description: 'Asphalt paving (per m²)',
        unitCode: 'm2',
        materialCost: 85,
        managementCost: 15,
        contractorCost: 55,
        bcisReference: 'H2010',
    },
    {
        subElementCode: 'BCIS-H2',
        code: 'BCIS-H2-002',
        description: 'Concrete paving (per m²)',
        unitCode: 'm2',
        materialCost: 95,
        managementCost: 17,
        contractorCost: 60,
        bcisReference: 'H2020',
    },
    // External Works - Landscaping
    {
        subElementCode: 'BCIS-H3',
        code: 'BCIS-H3-001',
        description: 'Tree planting (per item)',
        unitCode: 'item',
        materialCost: 150,
        managementCost: 25,
        contractorCost: 100,
        bcisReference: 'H3010',
    },
    {
        subElementCode: 'BCIS-H3',
        code: 'BCIS-H3-002',
        description: 'Grass seeding (per m²)',
        unitCode: 'm2',
        materialCost: 8,
        managementCost: 2,
        contractorCost: 5,
        bcisReference: 'H3020',
    },
];
export function seedBCISDatabase(db) {
    try {
        // Check if BCIS cost items already seeded (more reliable than checking just categories)
        const checkStmt = db.prepare("SELECT COUNT(*) as count FROM cost_items WHERE database_type = 'bcis'");
        const { count } = checkStmt.get();
        if (count > 0) {
            logger.info('✓ BCIS database already seeded');
            return;
        }
        // Insert BCIS Elements (Categories)
        const elementInsertStmt = db.prepare('INSERT INTO cost_categories (code, name, description, sort_order) VALUES (?, ?, ?, ?)');
        const elementMap = new Map();
        for (let i = 0; i < BCIS_ELEMENTS.length; i++) {
            const element = BCIS_ELEMENTS[i];
            const result = elementInsertStmt.run(element.code, element.name, element.description, i);
            elementMap.set(element.code, result.lastInsertRowid);
        }
        logger.info(`✓ Seeded ${BCIS_ELEMENTS.length} BCIS Elements`);
        // Insert BCIS Sub-Elements
        const subElementInsertStmt = db.prepare('INSERT INTO cost_sub_elements (category_id, code, name, description, sort_order) VALUES (?, ?, ?, ?, ?)');
        const subElementMap = new Map();
        let subElementCount = 0;
        for (const subElement of BCIS_SUB_ELEMENTS) {
            const categoryId = elementMap.get(subElement.elementCode);
            if (categoryId) {
                const result = subElementInsertStmt.run(categoryId, subElement.code, subElement.name, subElement.description, subElementCount);
                subElementMap.set(subElement.code, result.lastInsertRowid);
                subElementCount++;
            }
        }
        logger.info(`✓ Seeded ${subElementCount} BCIS Sub-Elements`);
        // Get unit IDs
        const unitsStmt = db.prepare('SELECT id, code FROM units');
        const units = unitsStmt.all();
        const unitMap = new Map(units.map((u) => [u.code, u.id]));
        // Insert BCIS Items
        const costItemInsertStmt = db.prepare(`
      INSERT INTO cost_items (
        sub_element_id, code, description, unit_id, material_cost,
        management_cost, contractor_cost, is_contractor_required,
        currency, price_date, bcis_reference, database_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        let itemCount = 0;
        for (const item of BCIS_ITEMS) {
            const subElementId = subElementMap.get(item.subElementCode);
            const unitId = unitMap.get(item.unitCode);
            if (subElementId && unitId) {
                costItemInsertStmt.run(subElementId, item.code, item.description, unitId, item.materialCost, item.managementCost, item.contractorCost, 1, // is_contractor_required
                'GBP', new Date().toISOString().split('T')[0], item.bcisReference || null, 'bcis');
                itemCount++;
            }
        }
        logger.info(`✓ Seeded ${itemCount} BCIS Cost Items`);
        logger.info('✓ BCIS Database seeding completed successfully');
    }
    catch (error) {
        logger.error(`Error seeding BCIS database: ${error}`);
        throw error;
    }
}
//# sourceMappingURL=seedBCIS.js.map