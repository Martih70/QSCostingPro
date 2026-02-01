-- NRM 2 (New Rules of Measurement) Integration
-- Adds complete NRM 2 hierarchical structure and reference document storage

-- NRM 2 Level 1: Groups (e.g., "1 Facilitating works", "2 Substructure")
CREATE TABLE nrm2_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NRM 2 Level 2: Elements (e.g., "1.1 Toxic/hazardous material", "2.1 Excavation")
CREATE TABLE nrm2_elements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  measurement_rules TEXT,
  sort_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES nrm2_groups(id) ON DELETE CASCADE
);

-- NRM 2 Level 3: Sub-elements (e.g., "1.1.1 Removal of toxic waste")
CREATE TABLE nrm2_sub_elements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  element_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  measurement_rules TEXT,
  unit TEXT,
  sort_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (element_id) REFERENCES nrm2_elements(id) ON DELETE CASCADE
);

-- NRM 2 Level 4: Work sections (detailed items with measurement and assessment rules)
CREATE TABLE nrm2_work_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sub_element_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  measurement_rules TEXT,
  unit TEXT,
  inclusions TEXT,
  exclusions TEXT,
  sort_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_element_id) REFERENCES nrm2_sub_elements(id) ON DELETE CASCADE
);

-- Reference Documents (for storing PDFs and other reference materials)
CREATE TABLE reference_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT DEFAULT 'standards',
  uploaded_by INTEGER NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Link cost_items to NRM 2 codes for integrated measurement system
ALTER TABLE cost_items ADD COLUMN nrm2_code TEXT;
ALTER TABLE cost_items ADD COLUMN nrm2_work_section_id INTEGER REFERENCES nrm2_work_sections(id);

-- Indexes for performance optimization
CREATE INDEX idx_nrm2_elements_group ON nrm2_elements(group_id);
CREATE INDEX idx_nrm2_sub_elements_element ON nrm2_sub_elements(element_id);
CREATE INDEX idx_nrm2_work_sections_sub_element ON nrm2_work_sections(sub_element_id);
CREATE INDEX idx_cost_items_nrm2_code ON cost_items(nrm2_code);
CREATE INDEX idx_cost_items_nrm2_work_section ON cost_items(nrm2_work_section_id);
CREATE INDEX idx_reference_documents_category ON reference_documents(category);
CREATE INDEX idx_reference_documents_uploaded_by ON reference_documents(uploaded_by);
