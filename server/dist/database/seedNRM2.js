import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export function seedNRM2(db) {
    try {
        // Check if NRM 2 data already exists
        const groupCount = db.prepare('SELECT COUNT(*) as count FROM nrm2_groups').get();
        if (groupCount.count > 0) {
            logger.info('✓ NRM 2 data already seeded, skipping');
            return;
        }
        logger.info('Seeding NRM 2 data...');
        // Load NRM 2 data from JSON
        const dataPath = path.join(__dirname, 'seeds', 'nrm2_data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error(`NRM 2 data file not found at ${dataPath}`);
        }
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const nrm2Data = JSON.parse(fileContent);
        // Prepare statements
        const insertGroupStmt = db.prepare(`
      INSERT INTO nrm2_groups (code, title, description, sort_order)
      VALUES (?, ?, ?, ?)
    `);
        const insertElementStmt = db.prepare(`
      INSERT INTO nrm2_elements (group_id, code, title, description, measurement_rules, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const insertSubElementStmt = db.prepare(`
      INSERT INTO nrm2_sub_elements (element_id, code, title, description, measurement_rules, unit, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const insertWorkSectionStmt = db.prepare(`
      INSERT INTO nrm2_work_sections (sub_element_id, code, title, description, measurement_rules, unit, inclusions, exclusions, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        // Wrap in transaction for performance
        const transaction = db.transaction(() => {
            nrm2Data.groups.forEach((group, groupIndex) => {
                const groupId = insertGroupStmt.run(group.code, group.title, group.description || '', groupIndex).lastInsertRowid;
                group.elements.forEach((element, elementIndex) => {
                    const elementId = insertElementStmt.run(groupId, element.code, element.title, element.description || '', element.measurement_rules || '', elementIndex).lastInsertRowid;
                    element.sub_elements.forEach((subElement, subElementIndex) => {
                        const subElementId = insertSubElementStmt.run(elementId, subElement.code, subElement.title, subElement.description || '', subElement.measurement_rules || '', subElement.unit || '', subElementIndex).lastInsertRowid;
                        subElement.work_sections.forEach((workSection, workSectionIndex) => {
                            insertWorkSectionStmt.run(subElementId, workSection.code, workSection.title, workSection.description || '', workSection.measurement_rules || '', workSection.unit || '', workSection.inclusions || '', workSection.exclusions || '', workSectionIndex);
                        });
                    });
                });
            });
        });
        transaction();
        // Count and report
        const finalGroupCount = db.prepare('SELECT COUNT(*) as count FROM nrm2_groups').get();
        const elementCount = db.prepare('SELECT COUNT(*) as count FROM nrm2_elements').get();
        const subElementCount = db.prepare('SELECT COUNT(*) as count FROM nrm2_sub_elements').get();
        const workSectionCount = db.prepare('SELECT COUNT(*) as count FROM nrm2_work_sections').get();
        logger.info(`✓ NRM 2 seeding completed:`);
        logger.info(`  - Groups: ${finalGroupCount.count}`);
        logger.info(`  - Elements: ${elementCount.count}`);
        logger.info(`  - Sub-elements: ${subElementCount.count}`);
        logger.info(`  - Work sections: ${workSectionCount.count}`);
    }
    catch (error) {
        logger.error(`Error seeding NRM 2 data: ${error}`);
        throw error;
    }
}
//# sourceMappingURL=seedNRM2.js.map