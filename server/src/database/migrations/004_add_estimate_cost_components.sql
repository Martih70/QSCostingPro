-- Migration: Add estimate cost components table for QS-level detail
-- Allows each estimate to have material, labor, and plant cost components
-- Each with independent unit rates, waste factors, and totals

CREATE TABLE IF NOT EXISTS estimate_cost_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estimate_id INTEGER NOT NULL,
  component_type TEXT NOT NULL CHECK(component_type IN ('material', 'labor', 'plant')),
  unit_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  waste_factor DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimate_id) REFERENCES project_estimates(id) ON DELETE CASCADE,
  UNIQUE(estimate_id, component_type)
);

CREATE INDEX idx_estimate_cost_components_estimate_id ON estimate_cost_components(estimate_id);
CREATE INDEX idx_estimate_cost_components_component_type ON estimate_cost_components(component_type);
