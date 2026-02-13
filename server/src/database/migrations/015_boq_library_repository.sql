-- Migration 015: BoQ Central Library Repository
-- Restructures BoQ tables from project-level to centralized library
-- Admin imports once, users browse and copy items to projects

-- Drop existing project-level BoQ structure (Migration 014)
-- These were experiments; we're replacing with library model
DROP TABLE IF EXISTS boq_main_summary;
DROP TABLE IF EXISTS boq_collection_pages;
DROP TABLE IF EXISTS boq_pages;
DROP TABLE IF EXISTS boq_sections;
DROP INDEX IF EXISTS idx_boq_summary_project;
DROP INDEX IF EXISTS idx_boq_collection_project;
DROP INDEX IF EXISTS idx_boq_pages_section;
DROP INDEX IF EXISTS idx_boq_sections_number;
DROP INDEX IF EXISTS idx_boq_sections_project;

-- ============================================================================
-- BoQ Library Tables (Centralized Repository)
-- ============================================================================

-- boq_library_sections: Sections in the centralized library (one-time import)
CREATE TABLE boq_library_sections (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  section_number   INTEGER NOT NULL UNIQUE,     -- Sequential: 1, 2, 3, ...
  section_title    VARCHAR(255) NOT NULL,
  items_per_page   INTEGER NOT NULL DEFAULT 25,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  item_count       INTEGER NOT NULL DEFAULT 0,  -- Denormalized for quick lookup
  created_by       INTEGER NOT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- boq_library_items: Line items in the library with standard rates
CREATE TABLE boq_library_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id         INTEGER NOT NULL,
  item_number        VARCHAR(50) NOT NULL,      -- e.g., "1.1", "1.2", "2.1"
  description        TEXT NOT NULL,
  quantity           DECIMAL(10, 2),            -- May be null, left for user to specify
  unit               VARCHAR(50) NOT NULL,
  standard_rate      DECIMAL(10, 2) NOT NULL,   -- Standard unit cost
  notes              TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT 1,
  page_number        INTEGER,                   -- Set by pagination service
  created_by         INTEGER NOT NULL,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES boq_library_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE (section_id, item_number)
);

-- boq_library_pages: Auto-generated pagination for library items
CREATE TABLE boq_library_pages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id   INTEGER NOT NULL,
  page_number  INTEGER NOT NULL,                -- 1-based within section
  total_pages  INTEGER NOT NULL,                -- Total pages in section
  item_count   INTEGER NOT NULL DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES boq_library_sections(id) ON DELETE CASCADE,
  UNIQUE (section_id, page_number)
);

-- boq_library_collections: Section-level summary (auto-generated)
-- Stores JSON of page references for quick section browsing
CREATE TABLE boq_library_collections (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id       INTEGER NOT NULL,
  page_references  TEXT NOT NULL DEFAULT '[]',  -- JSON: [{"page_number":1,"item_count":25}, ...]
  item_count       INTEGER NOT NULL DEFAULT 0,
  generated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES boq_library_sections(id) ON DELETE CASCADE,
  UNIQUE (section_id)
);

-- boq_library_summary: Library-wide summary (single row, auto-generated)
-- Stores JSON of section references and total item count
CREATE TABLE boq_library_summary (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  section_references  TEXT NOT NULL DEFAULT '[]',  -- JSON: [{"section_id":1,"section_number":1,"section_title":"...","item_count":50}, ...]
  total_sections      INTEGER NOT NULL DEFAULT 0,
  total_items         INTEGER NOT NULL DEFAULT 0,
  generated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- BoQ Import tracking (moved from project-level)
-- Records each CSV import to the library
CREATE TABLE boq_library_imports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  import_name     VARCHAR(255) NOT NULL,
  total_sections  INTEGER NOT NULL DEFAULT 0,
  total_items     INTEGER NOT NULL DEFAULT 0,
  created_by      INTEGER NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- Project-Level Tracking (for snapshots from library)
-- ============================================================================

-- Link items copied from library to projects (optional tracking)
-- If users need to know "this item came from library item X", use this
CREATE TABLE project_boq_library_refs (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id            INTEGER NOT NULL,
  project_estimate_id   INTEGER NOT NULL,
  library_item_id       INTEGER NOT NULL,        -- Reference to original library item
  library_section_id    INTEGER NOT NULL,        -- Snapshot of section at time of copy
  copied_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (project_estimate_id) REFERENCES project_estimates(id) ON DELETE CASCADE,
  FOREIGN KEY (library_item_id) REFERENCES boq_library_items(id),
  FOREIGN KEY (library_section_id) REFERENCES boq_library_sections(id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_boq_library_sections_number   ON boq_library_sections(section_number);
CREATE INDEX idx_boq_library_sections_sort     ON boq_library_sections(sort_order);
CREATE INDEX idx_boq_library_items_section     ON boq_library_items(section_id);
CREATE INDEX idx_boq_library_items_active      ON boq_library_items(is_active);
CREATE INDEX idx_boq_library_items_number      ON boq_library_items(section_id, item_number);
CREATE INDEX idx_boq_library_pages_section     ON boq_library_pages(section_id);
CREATE INDEX idx_boq_library_collections_section ON boq_library_collections(section_id);
CREATE INDEX idx_project_boq_refs_project      ON project_boq_library_refs(project_id);
CREATE INDEX idx_project_boq_refs_estimate     ON project_boq_library_refs(project_estimate_id);
CREATE INDEX idx_project_boq_refs_library      ON project_boq_library_refs(library_item_id);
