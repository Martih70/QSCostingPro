-- Migration: Fix waste_factor default from 1.00 to 0.00
-- The waste_factor should be a percentage (0 for 0%, 5 for 5%, etc.)
-- Previous default of 1.00 was incorrect as it represented 1% waste
-- Update existing components with waste_factor = 1.00 to 0 (0% waste)

-- Update existing components that have the old default
UPDATE estimate_cost_components
SET waste_factor = 0
WHERE waste_factor = 1.00 AND unit_rate = 0;

-- Alter table to change default (SQLite doesn't support ALTER DEFAULT directly)
-- We'll recreate the table with the correct default
CREATE TABLE estimate_cost_components_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estimate_id INTEGER NOT NULL,
  component_type TEXT NOT NULL CHECK(component_type IN ('material', 'labor', 'plant')),
  unit_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  waste_factor DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimate_id) REFERENCES project_estimates(id) ON DELETE CASCADE,
  UNIQUE(estimate_id, component_type)
);

INSERT INTO estimate_cost_components_new
SELECT * FROM estimate_cost_components;

DROP TABLE estimate_cost_components;

ALTER TABLE estimate_cost_components_new RENAME TO estimate_cost_components;

CREATE INDEX idx_estimate_cost_components_estimate_id ON estimate_cost_components(estimate_id);
CREATE INDEX idx_estimate_cost_components_component_type ON estimate_cost_components(component_type);
