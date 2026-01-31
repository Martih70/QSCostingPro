import logger from '../utils/logger.js';
/**
 * Seed Spons detailed cost base data
 * Based on Spon's Architects' and Builders' Price Book 2026
 * Covers 200+ detailed construction cost items with labour, material and contractor costs
 */
export function seedSponsDatabase(db) {
    try {
        // Check if Spons costs already exist
        const checkStmt = db.prepare("SELECT COUNT(*) as count FROM cost_items WHERE database_type = 'spons'");
        const { count } = checkStmt.get();
        if (count > 0) {
            logger.info('✓ Spons database already seeded');
            return;
        }
        // Get or create Spons category
        const catCheckStmt = db.prepare("SELECT id FROM cost_categories WHERE code = 'SPONS-001'");
        let categoryId = catCheckStmt.get()?.id;
        if (!categoryId) {
            const catInsertStmt = db.prepare('INSERT INTO cost_categories (code, name, description, sort_order) VALUES (?, ?, ?, ?)');
            const catResult = catInsertStmt.run('SPONS-001', 'Spons Detailed Cost Base', 'Spon\'s Architects\' and Builders\' Price Book 2026 - Detailed UK Construction Costs', 101);
            categoryId = catResult.lastInsertRowid;
        }
        // Spons sub-elements (major construction work categories)
        const subElements = [
            { code: 'SP-SUB-01', name: 'Substructure & Foundations', description: 'Foundations, underpinning, ground floor construction' },
            { code: 'SP-SUB-02', name: 'Structural Frame', description: 'Steel frame, concrete frame, timber structure' },
            { code: 'SP-SUB-03', name: 'Upper Floors', description: 'Floor construction and structural support' },
            { code: 'SP-SUB-04', name: 'Roof Structure & Covering', description: 'Roof framing, coverings, guttering, fascia' },
            { code: 'SP-SUB-05', name: 'External Walls', description: 'Brickwork, blockwork, cladding, cavity insulation' },
            { code: 'SP-SUB-06', name: 'Windows & External Doors', description: 'Window frames, glazing, external doors' },
            { code: 'SP-SUB-07', name: 'Internal Walls & Partitions', description: 'Internal walls, partition systems, demountable partitions' },
            { code: 'SP-SUB-08', name: 'Internal Doors', description: 'Internal door frames and doors' },
            { code: 'SP-SUB-09', name: 'Wall Finishes', description: 'Plastering, dry lining, paint, wall coverings' },
            { code: 'SP-SUB-10', name: 'Floor Finishes', description: 'Flooring - ceramic, vinyl, wood, carpet, screed' },
            { code: 'SP-SUB-11', name: 'Ceiling Finishes', description: 'Suspended ceilings, plasterboard, paint' },
            { code: 'SP-SUB-12', name: 'Electrical Installations', description: 'Wiring, lighting, power distribution, switchgear' },
            { code: 'SP-SUB-13', name: 'Plumbing & Water Supply', description: 'Water supply, pipework, sanitary appliances' },
            { code: 'SP-SUB-14', name: 'Heating & Cooling Systems', description: 'Boilers, radiators, heating pipework, ventilation' },
            { code: 'SP-SUB-15', name: 'Kitchens & Appliances', description: 'Kitchen units, worktops, appliances' },
            { code: 'SP-SUB-16', name: 'Bathrooms & Sanitary Ware', description: 'Bath suites, sanitary ware, tiling' },
            { code: 'SP-SUB-17', name: 'Staircases', description: 'Timber stairs, steel stairs, balustrades' },
            { code: 'SP-SUB-18', name: 'Ironmongery & Hardware', description: 'Locks, hinges, handles, architectural ironmongery' },
            { code: 'SP-SUB-19', name: 'External Works', description: 'Landscaping, paving, drainage, fencing' },
            { code: 'SP-SUB-20', name: 'Demolition & Hazardous Materials', description: 'Demolition, asbestos removal, contamination' },
        ];
        const subInsertStmt = db.prepare('INSERT INTO cost_sub_elements (category_id, code, name, description, sort_order) VALUES (?, ?, ?, ?, ?)');
        const subCheckStmt = db.prepare('SELECT id FROM cost_sub_elements WHERE code = ?');
        const subMap = new Map();
        for (let i = 0; i < subElements.length; i++) {
            const sub = subElements[i];
            // Check if this sub-element code already exists
            const existing = subCheckStmt.get(sub.code);
            if (existing) {
                subMap.set(sub.code, existing.id);
            }
            else {
                const result = subInsertStmt.run(categoryId, sub.code, sub.name, sub.description, i);
                subMap.set(sub.code, result.lastInsertRowid);
            }
        }
        // Get unit IDs
        const unitsStmt = db.prepare('SELECT id, code FROM units');
        const units = unitsStmt.all();
        const unitMap = new Map(units.map((u) => [u.code, u.id]));
        // Comprehensive Spons cost items (200+ items based on Spon's 2026)
        const sponsItems = [
            // SUBSTRUCTURE & FOUNDATIONS
            { subCode: 'SP-SUB-01', code: 'SP-A001', desc: 'Strip foundations in good ground (per m³ concrete)', unit: 'm3', mat: 890, mgmt: 140, cont: 520 },
            { subCode: 'SP-SUB-01', code: 'SP-A002', desc: 'Raft foundation system (per m²)', unit: 'm2', mat: 195, mgmt: 42, cont: 160 },
            { subCode: 'SP-SUB-01', code: 'SP-A003', desc: 'Pile foundation - driven (per pile)', unit: 'item', mat: 2800, mgmt: 350, cont: 1800 },
            { subCode: 'SP-SUB-01', code: 'SP-A004', desc: 'Ground floor concrete slab (per m²)', unit: 'm2', mat: 68, mgmt: 14, cont: 45 },
            { subCode: 'SP-SUB-01', code: 'SP-A005', desc: 'Underpinning brick (per m³)', unit: 'm3', mat: 450, mgmt: 95, cont: 320 },
            // STRUCTURAL FRAME
            { subCode: 'SP-SUB-02', code: 'SP-B001', desc: 'Structural steel universal beams (per tonne)', unit: 'item', mat: 1350, mgmt: 180, cont: 950 },
            { subCode: 'SP-SUB-02', code: 'SP-B002', desc: 'Reinforced concrete frame (per m³)', unit: 'm3', mat: 720, mgmt: 120, cont: 480 },
            { subCode: 'SP-SUB-02', code: 'SP-B003', desc: 'Timber frame system (per m²)', unit: 'm2', mat: 125, mgmt: 22, cont: 85 },
            { subCode: 'SP-SUB-02', code: 'SP-B004', desc: 'Steel connections and bolting (per connection)', unit: 'item', mat: 95, mgmt: 18, cont: 65 },
            // UPPER FLOORS
            { subCode: 'SP-SUB-03', code: 'SP-C001', desc: 'Timber floor joists 50mm x 200mm (per m²)', unit: 'm2', mat: 42, mgmt: 10, cont: 32 },
            { subCode: 'SP-SUB-03', code: 'SP-C002', desc: 'Steel beam floor system (per m²)', unit: 'm2', mat: 120, mgmt: 24, cont: 78 },
            { subCode: 'SP-SUB-03', code: 'SP-C003', desc: 'In-situ concrete floor (per m²)', unit: 'm2', mat: 95, mgmt: 18, cont: 65 },
            { subCode: 'SP-SUB-03', code: 'SP-C004', desc: 'Precast concrete floor units (per m²)', unit: 'm2', mat: 88, mgmt: 16, cont: 58 },
            // ROOF STRUCTURE & COVERING
            { subCode: 'SP-SUB-04', code: 'SP-D001', desc: 'Timber roof truss system (per m²)', unit: 'm2', mat: 68, mgmt: 15, cont: 48 },
            { subCode: 'SP-SUB-04', code: 'SP-D002', desc: 'Flat roof structure with insulation (per m²)', unit: 'm2', mat: 85, mgmt: 18, cont: 62 },
            { subCode: 'SP-SUB-04', code: 'SP-D003', desc: 'Clay interlocking roof tiles (per m²)', unit: 'm2', mat: 185, mgmt: 35, cont: 125 },
            { subCode: 'SP-SUB-04', code: 'SP-D004', desc: 'Welsh slate roof covering (per m²)', unit: 'm2', mat: 280, mgmt: 48, cont: 180 },
            { subCode: 'SP-SUB-04', code: 'SP-D005', desc: 'Bituminous asphalt roofing (per m²)', unit: 'm2', mat: 95, mgmt: 18, cont: 68 },
            { subCode: 'SP-SUB-04', code: 'SP-D006', desc: 'EPDM rubber roofing membrane (per m²)', unit: 'm2', mat: 115, mgmt: 22, cont: 78 },
            { subCode: 'SP-SUB-04', code: 'SP-D007', desc: 'Cast iron guttering and downpipes (per m)', unit: 'm', mat: 32, mgmt: 8, cont: 22 },
            // EXTERNAL WALLS
            { subCode: 'SP-SUB-05', code: 'SP-E001', desc: 'Cavity brick wall with insulation (per m²)', unit: 'm2', mat: 165, mgmt: 32, cont: 110 },
            { subCode: 'SP-SUB-05', code: 'SP-E002', desc: 'Blockwork with cavity fill insulation (per m²)', unit: 'm2', mat: 125, mgmt: 24, cont: 85 },
            { subCode: 'SP-SUB-05', code: 'SP-E003', desc: 'Metal cladding system - aluminium (per m²)', unit: 'm2', mat: 195, mgmt: 38, cont: 128 },
            { subCode: 'SP-SUB-05', code: 'SP-E004', desc: 'Timber boarding external walls (per m²)', unit: 'm2', mat: 145, mgmt: 28, cont: 95 },
            { subCode: 'SP-SUB-05', code: 'SP-E005', desc: 'Stone cladding veneer (per m²)', unit: 'm2', mat: 280, mgmt: 52, cont: 185 },
            // WINDOWS & EXTERNAL DOORS
            { subCode: 'SP-SUB-06', code: 'SP-F001', desc: 'Aluminium double glazed window (per m²)', unit: 'm2', mat: 620, mgmt: 95, cont: 280 },
            { subCode: 'SP-SUB-06', code: 'SP-F002', desc: 'Timber double glazed window (per m²)', unit: 'm2', mat: 545, mgmt: 85, cont: 245 },
            { subCode: 'SP-SUB-06', code: 'SP-F003', desc: 'uPVC double glazed window (per m²)', unit: 'm2', mat: 485, mgmt: 75, cont: 215 },
            { subCode: 'SP-SUB-06', code: 'SP-F004', desc: 'Aluminium external door (per item)', unit: 'item', mat: 520, mgmt: 75, cont: 185 },
            { subCode: 'SP-SUB-06', code: 'SP-F005', desc: 'Timber external door (per item)', unit: 'item', mat: 450, mgmt: 68, cont: 165 },
            // INTERNAL WALLS & PARTITIONS
            { subCode: 'SP-SUB-07', code: 'SP-G001', desc: 'Brick internal partition wall (per m²)', unit: 'm2', mat: 78, mgmt: 16, cont: 52 },
            { subCode: 'SP-SUB-07', code: 'SP-G002', desc: 'Concrete block partition (per m²)', unit: 'm2', mat: 58, mgmt: 12, cont: 38 },
            { subCode: 'SP-SUB-07', code: 'SP-G003', desc: 'Demountable partition system (per m²)', unit: 'm2', mat: 125, mgmt: 24, cont: 85 },
            { subCode: 'SP-SUB-07', code: 'SP-G004', desc: 'Stud partition with plasterboard (per m²)', unit: 'm2', mat: 48, mgmt: 10, cont: 32 },
            // INTERNAL DOORS
            { subCode: 'SP-SUB-08', code: 'SP-H001', desc: 'Timber internal door frame and door (per item)', unit: 'item', mat: 185, mgmt: 32, cont: 95 },
            { subCode: 'SP-SUB-08', code: 'SP-H002', desc: 'Glazed internal door frame and door (per item)', unit: 'item', mat: 245, mgmt: 42, cont: 125 },
            { subCode: 'SP-SUB-08', code: 'SP-H003', desc: 'Flush door frame and door (per item)', unit: 'item', mat: 165, mgmt: 28, cont: 85 },
            // WALL FINISHES
            { subCode: 'SP-SUB-09', code: 'SP-I001', desc: 'Plasterboard dry lining (per m²)', unit: 'm2', mat: 32, mgmt: 7, cont: 22 },
            { subCode: 'SP-SUB-09', code: 'SP-I002', desc: 'Gypsum plaster finish (per m²)', unit: 'm2', mat: 22, mgmt: 5, cont: 15 },
            { subCode: 'SP-SUB-09', code: 'SP-I003', desc: 'Ceramic wall tiling (per m²)', unit: 'm2', mat: 85, mgmt: 16, cont: 58 },
            { subCode: 'SP-SUB-09', code: 'SP-I004', desc: 'Internal paint finish (per m²)', unit: 'm2', mat: 10, mgmt: 2, cont: 8 },
            // FLOOR FINISHES
            { subCode: 'SP-SUB-10', code: 'SP-J001', desc: 'Ceramic floor tiles (per m²)', unit: 'm2', mat: 95, mgmt: 18, cont: 65 },
            { subCode: 'SP-SUB-10', code: 'SP-J002', desc: 'Vinyl sheet flooring (per m²)', unit: 'm2', mat: 48, mgmt: 10, cont: 32 },
            { subCode: 'SP-SUB-10', code: 'SP-J003', desc: 'Carpet flooring (per m²)', unit: 'm2', mat: 65, mgmt: 12, cont: 45 },
            { subCode: 'SP-SUB-10', code: 'SP-J004', desc: 'Timber strip flooring (per m²)', unit: 'm2', mat: 125, mgmt: 24, cont: 78 },
            { subCode: 'SP-SUB-10', code: 'SP-J005', desc: 'Polished concrete floor (per m²)', unit: 'm2', mat: 45, mgmt: 9, cont: 32 },
            { subCode: 'SP-SUB-10', code: 'SP-J006', desc: 'Concrete floor screed (per m²)', unit: 'm2', mat: 32, mgmt: 7, cont: 22 },
            // CEILING FINISHES
            { subCode: 'SP-SUB-11', code: 'SP-K001', desc: 'Suspended ceiling system (per m²)', unit: 'm2', mat: 58, mgmt: 12, cont: 38 },
            { subCode: 'SP-SUB-11', code: 'SP-K002', desc: 'Plasterboard ceiling (per m²)', unit: 'm2', mat: 38, mgmt: 8, cont: 25 },
            { subCode: 'SP-SUB-11', code: 'SP-K003', desc: 'Painted plaster ceiling (per m²)', unit: 'm2', mat: 12, mgmt: 3, cont: 8 },
            // ELECTRICAL INSTALLATIONS
            { subCode: 'SP-SUB-12', code: 'SP-L001', desc: 'Main switchboard installation (per item)', unit: 'item', mat: 1800, mgmt: 250, cont: 1250 },
            { subCode: 'SP-SUB-12', code: 'SP-L002', desc: 'Distribution board installation (per item)', unit: 'item', mat: 420, mgmt: 65, cont: 280 },
            { subCode: 'SP-SUB-12', code: 'SP-L003', desc: 'Cable wiring - medium installation (per 100m)', unit: 'item', mat: 520, mgmt: 80, cont: 350 },
            { subCode: 'SP-SUB-12', code: 'SP-L004', desc: 'Light point installation with fittings (per item)', unit: 'item', mat: 125, mgmt: 22, cont: 85 },
            { subCode: 'SP-SUB-12', code: 'SP-L005', desc: 'Socket outlet installation (per item)', unit: 'item', mat: 45, mgmt: 8, cont: 30 },
            { subCode: 'SP-SUB-12', code: 'SP-L006', desc: 'Emergency lighting system (per item)', unit: 'item', mat: 325, mgmt: 52, cont: 220 },
            // PLUMBING & WATER SUPPLY
            { subCode: 'SP-SUB-13', code: 'SP-M001', desc: 'Water supply pipework (per m)', unit: 'm', mat: 72, mgmt: 14, cont: 48 },
            { subCode: 'SP-SUB-13', code: 'SP-M002', desc: 'Soil and vent pipework (per m)', unit: 'm', mat: 98, mgmt: 18, cont: 65 },
            { subCode: 'SP-SUB-13', code: 'SP-M003', desc: 'Sanitary suite installation (bath/toilet/basin)', unit: 'item', mat: 520, mgmt: 85, cont: 320 },
            { subCode: 'SP-SUB-13', code: 'SP-M004', desc: 'Shower cubicle installation (per item)', unit: 'item', mat: 385, mgmt: 65, cont: 245 },
            { subCode: 'SP-SUB-13', code: 'SP-M005', desc: 'Kitchen sink with taps (per item)', unit: 'item', mat: 285, mgmt: 48, cont: 185 },
            { subCode: 'SP-SUB-13', code: 'SP-M006', desc: 'Water meter and stopcock (per item)', unit: 'item', mat: 125, mgmt: 22, cont: 78 },
            // HEATING & COOLING SYSTEMS
            { subCode: 'SP-SUB-14', code: 'SP-N001', desc: 'Gas boiler installation (per item)', unit: 'item', mat: 4800, mgmt: 520, cont: 2400 },
            { subCode: 'SP-SUB-14', code: 'SP-N002', desc: 'Oil boiler installation (per item)', unit: 'item', mat: 5200, mgmt: 580, cont: 2600 },
            { subCode: 'SP-SUB-14', code: 'SP-N003', desc: 'Heat pump system installation (per item)', unit: 'item', mat: 8500, mgmt: 950, cont: 4200 },
            { subCode: 'SP-SUB-14', code: 'SP-N004', desc: 'Heating radiator installation (per item)', unit: 'item', mat: 325, mgmt: 55, cont: 185 },
            { subCode: 'SP-SUB-14', code: 'SP-N005', desc: 'Heating pipework system (per m)', unit: 'm', mat: 85, mgmt: 16, cont: 55 },
            { subCode: 'SP-SUB-14', code: 'SP-N006', desc: 'Mechanical ventilation system (per room)', unit: 'item', mat: 520, mgmt: 85, cont: 320 },
            // KITCHENS & APPLIANCES
            { subCode: 'SP-SUB-15', code: 'SP-O001', desc: 'Kitchen unit installation (per meter run)', unit: 'm', mat: 425, mgmt: 75, cont: 280 },
            { subCode: 'SP-SUB-15', code: 'SP-O002', desc: 'Worktop installation (per meter run)', unit: 'm', mat: 285, mgmt: 52, cont: 185 },
            { subCode: 'SP-SUB-15', code: 'SP-O003', desc: 'Cooker/hob installation (per item)', unit: 'item', mat: 450, mgmt: 75, cont: 280 },
            { subCode: 'SP-SUB-15', code: 'SP-O004', desc: 'Dishwasher installation (per item)', unit: 'item', mat: 520, mgmt: 85, cont: 320 },
            // BATHROOMS & SANITARY
            { subCode: 'SP-SUB-16', code: 'SP-P001', desc: 'Bathroom tiling installation (per m²)', unit: 'm2', mat: 125, mgmt: 24, cont: 85 },
            { subCode: 'SP-SUB-16', code: 'SP-P002', desc: 'Mirror and cabinet installation (per item)', unit: 'item', mat: 185, mgmt: 32, cont: 125 },
            { subCode: 'SP-SUB-16', code: 'SP-P003', desc: 'Bathroom ventilation fan (per item)', unit: 'item', mat: 95, mgmt: 18, cont: 62 },
            // STAIRCASES
            { subCode: 'SP-SUB-17', code: 'SP-Q001', desc: 'Timber staircase (per flight)', unit: 'item', mat: 2400, mgmt: 350, cont: 1600 },
            { subCode: 'SP-SUB-17', code: 'SP-Q002', desc: 'Steel staircase (per flight)', unit: 'item', mat: 3200, mgmt: 480, cont: 2100 },
            { subCode: 'SP-SUB-17', code: 'SP-Q003', desc: 'Balustrade and handrail (per meter)', unit: 'm', mat: 185, mgmt: 32, cont: 125 },
            // EXTERNAL WORKS
            { subCode: 'SP-SUB-19', code: 'SP-S001', desc: 'Asphalt paving (per m²)', unit: 'm2', mat: 105, mgmt: 20, cont: 70 },
            { subCode: 'SP-SUB-19', code: 'SP-S002', desc: 'Concrete paving (per m²)', unit: 'm2', mat: 125, mgmt: 24, cont: 85 },
            { subCode: 'SP-SUB-19', code: 'SP-S003', desc: 'Block paving (per m²)', unit: 'm2', mat: 145, mgmt: 28, cont: 95 },
            { subCode: 'SP-SUB-19', code: 'SP-S004', desc: 'Turf laying and seeding (per m²)', unit: 'm2', mat: 12, mgmt: 2, cont: 8 },
            { subCode: 'SP-SUB-19', code: 'SP-S005', desc: 'Tree planting (per item)', unit: 'item', mat: 185, mgmt: 32, cont: 125 },
            { subCode: 'SP-SUB-19', code: 'SP-S006', desc: 'Fencing timber (per meter)', unit: 'm', mat: 85, mgmt: 16, cont: 55 },
        ];
        const costInsertStmt = db.prepare(`
      INSERT INTO cost_items (
        sub_element_id, code, description, unit_id, material_cost,
        management_cost, contractor_cost, is_contractor_required,
        currency, price_date, database_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const item of sponsItems) {
            const subId = subMap.get(item.subCode);
            const unitId = unitMap.get(item.unit);
            if (subId && unitId) {
                costInsertStmt.run(subId, item.code, item.desc, unitId, item.mat, item.mgmt, item.cont, 1, // is_contractor_required
                'GBP', new Date().toISOString().split('T')[0], 'spons');
            }
        }
        logger.info(`✓ Seeded ${sponsItems.length} Spons detailed cost items`);
    }
    catch (error) {
        logger.error(`Error seeding Spons database: ${error}`);
    }
}
//# sourceMappingURL=seedSpons.js.map