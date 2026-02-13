-- Migration: Remove entire Cost Database
-- No longer needed as BoQ Library is the primary source
-- Removes all cost-related tables and clears references

-- Clear foreign key references from project_estimates
UPDATE project_estimates SET cost_item_id = NULL WHERE cost_item_id IS NOT NULL;
UPDATE project_estimates SET category_id = NULL WHERE category_id IS NOT NULL;

-- Drop cost-related tables
DROP TABLE IF EXISTS cost_item_suppliers;
DROP TABLE IF EXISTS cost_items;
DROP TABLE IF EXISTS cost_sub_elements;
DROP TABLE IF EXISTS cost_categories;
DROP TABLE IF EXISTS historic_cost_analysis;
