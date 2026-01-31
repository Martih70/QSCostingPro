-- Migration: Add support for custom line items (Phase 1 feature)
-- Allows QS to add custom items without selecting from cost database

-- SQLite doesn't support ALTER COLUMN, so we recreate the table
-- Disable foreign key checks during migration
PRAGMA foreign_keys = OFF;

-- Rename old table
ALTER TABLE project_estimates RENAME TO project_estimates_old;

-- Create new table with custom item support
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
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (cost_item_id) REFERENCES cost_items(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES cost_categories(id)
);

-- Copy all existing data
INSERT INTO project_estimates (
  id, project_id, cost_item_id, quantity, unit_cost_override,
  notes, line_total, created_by, created_at, version_number, is_active
)
SELECT
  id, project_id, cost_item_id, quantity, unit_cost_override,
  notes, line_total, created_by, created_at, version_number, is_active
FROM project_estimates_old;

-- Drop old table
DROP TABLE project_estimates_old;

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
