-- Migration: Add BoQ (Bill of Quantities) import fields
-- Adds support for importing structured BoQ data with sections and hierarchical item numbers

-- Disable foreign key checks during migration
PRAGMA foreign_keys = OFF;

-- Rename old table
ALTER TABLE project_estimates RENAME TO project_estimates_old;

-- Create new table with BoQ import support
CREATE TABLE project_estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  cost_item_id INTEGER,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost_override DECIMAL(10, 2),
  notes TEXT,
  line_total DECIMAL(12, 2),
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  custom_description TEXT,
  custom_unit_rate DECIMAL(10, 2),
  custom_unit TEXT,
  category_id INTEGER,
  -- New BoQ import fields
  item_number VARCHAR(50),
  section_id INTEGER,
  section_title VARCHAR(255),
  boq_import_id INTEGER,
  page_number INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (cost_item_id) REFERENCES cost_items(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES cost_categories(id)
);

-- Copy all existing data
INSERT INTO project_estimates (
  id, project_id, cost_item_id, quantity, unit_cost_override,
  notes, line_total, created_by, created_at, version_number, is_active,
  custom_description, custom_unit_rate, custom_unit, category_id
)
SELECT
  id, project_id, cost_item_id, quantity, unit_cost_override,
  notes, line_total, created_by, created_at, version_number, is_active,
  custom_description, custom_unit_rate, custom_unit, category_id
FROM project_estimates_old;

-- Drop old table
DROP TABLE project_estimates_old;

-- Create table for tracking BoQ imports
CREATE TABLE boq_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  import_name VARCHAR(255) NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for faster queries
CREATE INDEX idx_project_estimates_project_id ON project_estimates(project_id);
CREATE INDEX idx_project_estimates_section_id ON project_estimates(section_id);
CREATE INDEX idx_project_estimates_boq_import_id ON project_estimates(boq_import_id);
CREATE INDEX idx_project_estimates_item_number ON project_estimates(item_number);
CREATE INDEX idx_boq_imports_project_id ON boq_imports(project_id);

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
