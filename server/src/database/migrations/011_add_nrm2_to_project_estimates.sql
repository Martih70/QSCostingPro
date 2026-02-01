-- Migration: Add NRM 2 linkage to project estimates
-- Allows project estimates to be linked to NRM 2 work sections
-- Enables import of BOQ items with NRM 2 codes

-- Add NRM 2 linkage columns to project_estimates
ALTER TABLE project_estimates ADD COLUMN nrm2_work_section_id INTEGER REFERENCES nrm2_work_sections(id) ON DELETE SET NULL;
ALTER TABLE project_estimates ADD COLUMN nrm2_code TEXT;

-- Create indexes for performance
CREATE INDEX idx_project_estimates_nrm2_work_section ON project_estimates(nrm2_work_section_id);
CREATE INDEX idx_project_estimates_nrm2_code ON project_estimates(nrm2_code);
