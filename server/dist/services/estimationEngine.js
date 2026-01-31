import { getDatabase } from '../database/connection.js';
import logger from '../utils/logger.js';
/**
 * Calculate line item total with waste factor
 */
function calculateLineTotal(quantity, materialCost, managementCost, contractorCost, wasteFactor, isContractorRequired) {
    // Apply waste factor only to material costs
    const materialTotal = materialCost * quantity * wasteFactor;
    const managementTotal = managementCost * quantity;
    // Only include contractor costs if required
    const contractorTotal = isContractorRequired ? contractorCost * quantity : 0;
    const total = materialTotal + managementTotal + contractorTotal;
    return {
        material: materialTotal,
        management: managementTotal,
        contractor: contractorTotal,
        total,
    };
}
/**
 * Calculate all line items for a project
 */
export function calculateProjectEstimates(projectId) {
    try {
        const db = getDatabase();
        // Query that handles both cost_item_id and custom items
        const stmt = db.prepare(`
      SELECT
        pe.id as estimate_id,
        COALESCE(ci.id, pe.id) as item_id,
        COALESCE(ci.description, pe.custom_description) as description,
        pe.quantity,
        COALESCE(u.code, pe.custom_unit) as unit_code,
        COALESCE(pe.unit_cost_override, ci.material_cost, pe.custom_unit_rate) as material_cost,
        COALESCE(ci.management_cost, 0) as management_cost,
        COALESCE(ci.contractor_cost, 0) as contractor_cost,
        COALESCE(ci.waste_factor, 1.0) as waste_factor,
        COALESCE(ci.is_contractor_required, 0) as is_contractor_required,
        pe.line_total
      FROM project_estimates pe
      LEFT JOIN cost_items ci ON pe.cost_item_id = ci.id
      LEFT JOIN units u ON ci.unit_id = u.id
      WHERE pe.project_id = ? AND pe.is_active = 1
      ORDER BY pe.created_at ASC
    `);
        const rows = stmt.all(projectId);
        return rows.map((row) => {
            const costs = calculateLineTotal(row.quantity, row.material_cost, row.management_cost, row.contractor_cost, row.waste_factor, row.is_contractor_required);
            return {
                item_id: row.item_id,
                estimate_id: row.estimate_id,
                description: row.description,
                quantity: row.quantity,
                unit_code: row.unit_code,
                material_cost: row.material_cost,
                management_cost: row.management_cost,
                contractor_cost: row.contractor_cost,
                waste_factor: row.waste_factor,
                is_contractor_required: row.is_contractor_required,
                material_total: costs.material,
                management_total: costs.management,
                contractor_total: costs.contractor,
                line_total: costs.total,
            };
        });
    }
    catch (error) {
        logger.error(`Error calculating project estimates for project ${projectId}: ${error}`);
        throw error;
    }
}
/**
 * Calculate category-level totals
 */
export function calculateCategoryTotals(projectId, lineItems) {
    try {
        const db = getDatabase();
        // Get categories from both cost_items and custom items
        const categoryStmt = db.prepare(`
      SELECT DISTINCT
        cc.id,
        cc.code,
        cc.name
      FROM cost_categories cc
      WHERE cc.id IN (
        SELECT DISTINCT cse.category_id
        FROM project_estimates pe
        JOIN cost_items ci ON pe.cost_item_id = ci.id
        JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
        WHERE pe.project_id = ? AND pe.is_active = 1
        UNION
        SELECT DISTINCT pe.category_id
        FROM project_estimates pe
        WHERE pe.project_id = ? AND pe.is_active = 1 AND pe.cost_item_id IS NULL AND pe.category_id IS NOT NULL
      )
      ORDER BY cc.code ASC
    `);
        const categories = categoryStmt.all(projectId, projectId);
        // Batch-load all category mappings instead of querying per-item
        const costItemCategoriesStmt = db.prepare(`
      SELECT DISTINCT ci.id, cse.category_id
      FROM cost_items ci
      JOIN cost_sub_elements cse ON ci.sub_element_id = cse.id
    `);
        const costItemCategories = costItemCategoriesStmt.all();
        const costItemCategoryMap = new Map(costItemCategories.map(row => [row.id, row.category_id]));
        const customItemCategoriesStmt = db.prepare(`
      SELECT id, category_id
      FROM project_estimates
      WHERE project_id = ? AND is_active = 1 AND cost_item_id IS NULL AND category_id IS NOT NULL
    `);
        const customItemCategories = customItemCategoriesStmt.all(projectId);
        const customItemCategoryMap = new Map(customItemCategories.map(row => [row.id, row.category_id]));
        return categories.map((category) => {
            const categoryItems = lineItems.filter((item) => {
                // Check cost_item-based items
                const costItemCategoryId = costItemCategoryMap.get(item.item_id);
                if (costItemCategoryId === category.id) {
                    return true;
                }
                // Check custom items
                const customItemCategoryId = customItemCategoryMap.get(item.estimate_id);
                return customItemCategoryId === category.id;
            });
            const subtotal = categoryItems.reduce((sum, item) => sum + item.line_total, 0);
            const contractorSubtotal = categoryItems.reduce((sum, item) => sum + item.contractor_total, 0);
            return {
                category_id: category.id,
                category_code: category.code,
                category_name: category.name,
                line_count: categoryItems.length,
                line_items: categoryItems,
                subtotal,
                contractor_items_subtotal: contractorSubtotal,
            };
        });
    }
    catch (error) {
        logger.error(`Error calculating category totals for project ${projectId}: ${error}`);
        throw error;
    }
}
/**
 * Calculate complete project estimate with contingency
 */
export function calculateProjectTotal(projectId) {
    try {
        const db = getDatabase();
        // Get project details
        const projectStmt = db.prepare('SELECT floor_area_m2, contingency_percentage FROM projects WHERE id = ?');
        const project = projectStmt.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        // Calculate line items
        const lineItems = calculateProjectEstimates(projectId);
        // Calculate category totals
        const categories = calculateCategoryTotals(projectId, lineItems);
        // Calculate subtotal
        const subtotal = categories.reduce((sum, cat) => sum + cat.subtotal, 0);
        // Calculate contingency
        const contingencyPercentage = project.contingency_percentage || 10;
        const contingencyAmount = subtotal * (contingencyPercentage / 100);
        // Calculate grand total
        const grandTotal = subtotal + contingencyAmount;
        // Calculate cost per m²
        const costPerM2 = project.floor_area_m2 && project.floor_area_m2 > 0
            ? grandTotal / project.floor_area_m2
            : null;
        // Calculate totals by cost type
        const contractorTotal = lineItems.reduce((sum, item) => sum + item.contractor_total, 0);
        const volunteerTotal = subtotal - contractorTotal;
        return {
            project_id: projectId,
            floor_area_m2: project.floor_area_m2,
            categories,
            subtotal,
            contingency_amount: contingencyAmount,
            contingency_percentage: contingencyPercentage,
            grand_total: grandTotal,
            cost_per_m2: costPerM2,
            contractor_cost_total: contractorTotal,
            volunteer_cost_total: volunteerTotal,
        };
    }
    catch (error) {
        logger.error(`Error calculating project total for project ${projectId}: ${error}`);
        throw error;
    }
}
/**
 * Update line item total in database after calculation
 */
export function updateLineItemTotal(estimateId, lineTotal) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('UPDATE project_estimates SET line_total = ? WHERE id = ?');
        stmt.run(lineTotal, estimateId);
    }
    catch (error) {
        logger.error(`Error updating line item total ${estimateId}: ${error}`);
        throw error;
    }
}
/**
 * Calculate cost per m² from historic data
 * Filters by region, building age, and condition rating
 */
export function getCostPerM2Benchmark(categoryId, region, buildingAge, conditionRating) {
    try {
        const db = getDatabase();
        let whereConditions = ['category_id = ?'];
        let params = [categoryId];
        if (region) {
            whereConditions.push('region = ?');
            params.push(region);
        }
        if (buildingAge !== undefined && buildingAge !== null) {
            let ageRange = '30+';
            if (buildingAge < 10)
                ageRange = '0-10';
            else if (buildingAge < 20)
                ageRange = '10-20';
            else if (buildingAge < 30)
                ageRange = '20-30';
            whereConditions.push('building_age_range = ?');
            params.push(ageRange);
        }
        if (conditionRating !== undefined && conditionRating !== null) {
            let ratingRange = '4-5';
            if (conditionRating <= 2)
                ratingRange = '1-2';
            else if (conditionRating === 3)
                ratingRange = '3';
            whereConditions.push('condition_rating_range = ?');
            params.push(ratingRange);
        }
        whereConditions.push('sample_size >= 3'); // Only use reliable data
        const stmt = db.prepare(`
      SELECT cost_per_m2
      FROM historic_cost_analysis
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY sample_size DESC
      LIMIT 1
    `);
        const result = stmt.get(...params);
        return result ? result.cost_per_m2 : null;
    }
    catch (error) {
        logger.error(`Error getting cost per m² benchmark: ${error}`);
        return null;
    }
}
/**
 * Compare estimate to historic benchmark
 */
export function compareToHistoricData(projectId, categoryId) {
    try {
        const db = getDatabase();
        // Get project details
        const projectStmt = db.prepare('SELECT floor_area_m2, region, building_age, condition_rating FROM projects WHERE id = ?');
        const project = projectStmt.get(projectId);
        if (!project || !project.floor_area_m2) {
            return {
                estimated_cost_per_m2: null,
                historic_cost_per_m2: null,
                variance_percent: null,
            };
        }
        // Get category total for this project
        const lineItems = calculateProjectEstimates(projectId);
        const categories = calculateCategoryTotals(projectId, lineItems);
        const categoryTotal = categories.find((c) => c.category_id === categoryId);
        if (!categoryTotal) {
            return {
                estimated_cost_per_m2: null,
                historic_cost_per_m2: null,
                variance_percent: null,
            };
        }
        const estimatedCostPerM2 = categoryTotal.subtotal / project.floor_area_m2;
        // Get historic benchmark
        const historicCostPerM2 = getCostPerM2Benchmark(categoryId, project.region, project.building_age, project.condition_rating);
        if (!historicCostPerM2) {
            return {
                estimated_cost_per_m2: estimatedCostPerM2,
                historic_cost_per_m2: null,
                variance_percent: null,
            };
        }
        const variancePercent = ((estimatedCostPerM2 - historicCostPerM2) / historicCostPerM2) * 100;
        return {
            estimated_cost_per_m2: estimatedCostPerM2,
            historic_cost_per_m2: historicCostPerM2,
            variance_percent: variancePercent,
        };
    }
    catch (error) {
        logger.error(`Error comparing to historic data: ${error}`);
        return {
            estimated_cost_per_m2: null,
            historic_cost_per_m2: null,
            variance_percent: null,
        };
    }
}
/**
 * Get estimate summary for display
 */
export function getEstimateSummary(projectId) {
    try {
        const estimate = calculateProjectTotal(projectId);
        return {
            total_line_items: estimate.categories.reduce((sum, cat) => sum + cat.line_count, 0),
            total_cost: estimate.grand_total,
            contractor_cost: estimate.contractor_cost_total,
            volunteer_cost: estimate.volunteer_cost_total,
            cost_per_m2: estimate.cost_per_m2,
            contingency_amount: estimate.contingency_amount,
            estimate_status: 'calculated',
        };
    }
    catch (error) {
        logger.error(`Error getting estimate summary: ${error}`);
        return null;
    }
}
//# sourceMappingURL=estimationEngine.js.map