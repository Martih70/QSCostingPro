-- Migration 009: Add Estimate Templates system
-- This adds support for saving and reusing estimate line item templates

CREATE TABLE estimate_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT, -- 'quick', 'standard', 'complex'
  is_public BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE template_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  sequence_order INTEGER NOT NULL,
  cost_item_id INTEGER,
  custom_description TEXT,
  custom_unit_rate DECIMAL(10, 2),
  custom_unit TEXT,
  category_id INTEGER,
  quantity DECIMAL(10, 2),
  unit_cost_override DECIMAL(10, 2),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES estimate_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (cost_item_id) REFERENCES cost_items(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES cost_categories(id) ON DELETE SET NULL
);

-- Add index for user_id for faster queries
CREATE INDEX idx_estimate_templates_user_id ON estimate_templates(user_id);
CREATE INDEX idx_estimate_templates_is_public ON estimate_templates(is_public);
CREATE INDEX idx_template_line_items_template_id ON template_line_items(template_id);
