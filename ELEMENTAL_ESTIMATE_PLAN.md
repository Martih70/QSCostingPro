# Elemental Estimate Structure Implementation Plan

## Overview
Transform the Build Estimate from a flat list view to a hierarchical, section-based elemental estimate system with Collection Pages and Summary Page.

## Architecture

### Data Model Changes
1. **Section Entity** (implicit from BoQ Library)
   - section_name (Prelims, Substructure, etc.)
   - section_id (from BoQ Library)

2. **Page Entity** (new concept)
   - page_number (within section: 1, 2, 3, 4)
   - section_id
   - page_total (sum of line items on this page)
   - is_complete (flag for when page has data entries)

3. **Line Item modifications**
   - Add: section_name, page_number
   - Track: which section and page each item belongs to

4. **Collection Page Entity** (new)
   - section_id
   - collection_pages_data: [{ page_number, page_total }, ...]
   - section_total (sum of all page totals)
   - auto_generated: true/false

5. **Summary Page** (aggregate)
   - sections_data: [{ section_name, section_total }, ...]
   - grand_total

## UI Components to Create/Modify

### 1. Section Page View (Current BuildEstimate refinement)
- Display items for a specific section and page
- Show: Section name, page number (1/4, 2/4, etc.)
- Footer: "Page X/Y"
- Action: Edit quantities, rates, descriptions
- When complete: Auto-flag page as complete

### 2. Collection Page View (New)
- Display all pages in a section
- Format each line: "Page 1/4 - £500"
- Auto-generate when ALL pages in section are marked complete
- Section name at top
- Total at bottom
- Not editable (summary only)

### 3. Summary Page View (New)
- Display all sections with Collection Page totals
- Format each line: "Section Name - £X"
- Grand total at bottom
- Links to drill into each section's Collection Page

### 4. Navigation Component (New)
- Breadcrumb or tabs: Summary → Section Selection → Section Pages → Collection Page
- Quick navigation between sections

## Implementation Steps

### Phase 1: Data Structure (Database/Repository)
1. Add section and page tracking to project_estimates
   - Add columns: `section_name`, `page_number`, `is_page_complete`
   - Create migration

2. Create Collection Page calculation logic
   - Query all line items by section
   - Group by page_number
   - Calculate page_totals
   - Sum for section_total

3. Update estimationEngine to handle section-level calculations
   - Calculate section totals (sum of page totals)
   - Calculate grand total (sum of section totals)

### Phase 2: UI - Section Pages View
1. Modify LineItemsTable to show:
   - Current section name
   - Current page number (X/Y format)
   - Items only for that page

2. Add pagination controls:
   - Previous/Next page buttons
   - Page number display
   - Mark page as complete button

3. Update estimations calculations for section/page level

### Phase 3: UI - Collection Page View
1. Create CollectionPageView component:
   - Auto-generated after all pages in section have data
   - Display: Page 1/4 - £500, Page 2/4 - £3200, etc.
   - Section total at bottom
   - Section name in header

2. Auto-generation logic:
   - Check if all pages in section are marked complete
   - Calculate section total
   - Create Collection Page snapshot

### Phase 4: UI - Summary Page View
1. Create SummaryPageView component:
   - List all sections with their Collection Page totals
   - Format: "Prelims - £7600"
   - Grand total at bottom
   - Links to drill into Collection Pages

2. Auto-generation:
   - Aggregate all Collection Page totals
   - Calculate grand total

### Phase 5: Navigation & Integration
1. Refactor ProjectEstimatesPage:
   - Add view mode selector: Section Pages / Collection Pages / Summary
   - Implement navigation flow
   - Handle view transitions

2. Update sidebar/breadcrumbs for navigation

3. Implement auto-grouping on import:
   - When items imported from BoQ, auto-assign section_name
   - Auto-paginate items (e.g., 10 items per page)
   - Auto-flag initial page_number

## Database Migration Required

```sql
-- Add section and page tracking to project_estimates
ALTER TABLE project_estimates ADD COLUMN section_name TEXT;
ALTER TABLE project_estimates ADD COLUMN page_number INTEGER DEFAULT 1;
ALTER TABLE project_estimates ADD COLUMN is_page_complete BOOLEAN DEFAULT 0;

-- Create collection_pages table
CREATE TABLE collection_pages (
  id INTEGER PRIMARY KEY,
  estimate_id INTEGER,
  section_name TEXT,
  page_data JSON, -- [{page_number, page_total}, ...]
  section_total DECIMAL,
  auto_generated BOOLEAN DEFAULT 1,
  created_at DATETIME,
  FOREIGN KEY (estimate_id) REFERENCES project_estimates(id)
);
```

## Expected User Flow

1. **Import**: User selects items from BoQ Library by section
   - Items auto-grouped into pages
   - Section name assigned
   - Page numbers auto-generated

2. **Build Pages**: User enters data page by page
   - Sees: Section name, items, "Page X/Y" footer
   - Marks page complete when done

3. **View Collection**: When all pages done, user views Collection Page
   - Shows all pages with totals: "Page 1/4 - £500", etc.
   - Can drill back to edit individual pages if needed

4. **View Summary**: User sees final Summary Page
   - All sections with their totals
   - Grand total
   - Can drill into any Collection Page

## Success Criteria

- ✅ Items auto-grouped by BoQ Library section
- ✅ Pages auto-created with pagination (X/Y format)
- ✅ Section page view shows current page items only
- ✅ Collection Pages auto-generate when section complete
- ✅ Summary Page aggregates all Collection Page totals
- ✅ Proper footer numbering (1/4, 2/4, 3/4, 4/4)
- ✅ All calculations align (page total = sum items, section total = sum pages, grand total = sum sections)
- ✅ Users can navigate between pages and views seamlessly
