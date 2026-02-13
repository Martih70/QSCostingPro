# Bill of Quantities (BoQ) Import System - Implementation Guide

## Overview

This document describes the comprehensive Bill of Quantities (BoQ) import system that has been implemented for QSCostingPro. The system enables users to:

1. Import structured BoQ data from CSV files
2. Organize items into hierarchical sections
3. Generate professional multi-page PDF reports with automatic pagination
4. Track BoQ imports and manage line items

## Database Schema Changes

### Migration: `013_add_boq_import_fields.sql`

This migration adds the following tables and fields:

#### New Tables

**`boq_imports`** - Tracks BoQ import batches
```sql
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
```

#### Enhanced `project_estimates` Table

New columns added:
- `item_number VARCHAR(50)` - Hierarchical item numbering (e.g., "1.1.1", "1.2.3")
- `section_id INTEGER` - Section grouping
- `section_title VARCHAR(255)` - Custom section name
- `boq_import_id INTEGER` - Links to boq_imports for batch tracking
- `page_number INTEGER` - Optional page numbering for reports

#### Indexes Created
- `idx_project_estimates_project_id` - Fast project lookups
- `idx_project_estimates_section_id` - Fast section filtering
- `idx_project_estimates_boq_import_id` - Fast import lookups
- `idx_project_estimates_item_number` - Fast item number searches
- `idx_boq_imports_project_id` - Fast import batch lookups

## API Endpoints

### 1. Preview BoQ Import

**Endpoint:** `POST /api/v1/projects/:projectId/boq-import/preview`

Preview BoQ data without saving to database.

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@Prelims_BoQ.csv" \
  http://localhost:3000/api/v1/projects/1/boq-import/preview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preview": {
      "totalSections": 1,
      "totalItems": 8,
      "grandTotal": 15440,
      "sections": [
        {
          "sectionId": 1,
          "sectionNumber": "1",
          "sectionTitle": "Preliminaries",
          "itemCount": 8,
          "sectionTotal": 15440
        }
      ]
    }
  }
}
```

### 2. Import BoQ to Project

**Endpoint:** `POST /api/v1/projects/:projectId/boq-import`

Import BoQ data and save as project line items.

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@Prelims_BoQ.csv" \
  -F "importName=Preliminaries BoQ" \
  http://localhost:3000/api/v1/projects/1/boq-import
```

**Response:**
```json
{
  "success": true,
  "data": {
    "boq_import_id": 1,
    "import_name": "Preliminaries BoQ",
    "total_items": 8,
    "total_value": 15440,
    "sections_count": 1
  }
}
```

### 3. Get BoQ Imports

**Endpoint:** `GET /api/v1/projects/:projectId/boq-imports`

List all BoQ imports for a project.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "import_name": "Preliminaries BoQ",
      "total_items": 8,
      "total_value": 15440,
      "created_by": 1,
      "created_at": "2024-02-10T10:30:00Z"
    }
  ]
}
```

### 4. Delete BoQ Import

**Endpoint:** `DELETE /api/v1/projects/:projectId/boq-imports/:importId`

Delete a BoQ import and mark associated items as inactive.

**Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/projects/1/boq-imports/1
```

### 5. Export BoQ as PDF (Original)

**Endpoint:** `GET /api/v1/projects/:projectId/estimates/export-pdf`

Generate PDF from all project estimates.

### 6. Export BoQ as PDF (New Multi-Page)

**Endpoint:** `GET /api/v1/projects/:projectId/estimates/export-boq-pdf?boqImportId=1`

Generate professional multi-page BoQ PDF with:
- Title page with project summary
- Section pages with line items and page totals
- Section summary pages
- Final summary page
- Automatic pagination with page numbering

**Query Parameters:**
- `boqImportId` (optional) - Filter to specific import

## CSV Format

### Expected Columns

The CSV file must contain the following columns (case-insensitive):

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Item No. | String | Hierarchical item number | 1.1.1 |
| Description | String | Item description | Contract preliminaries |
| Unit | String | Unit of measurement | item, week, m², nr |
| Quantity | Number | Item quantity | 1, 24 |
| Rate (£) | Number | Unit rate | 8500, 95 |
| Amount (£) | Number | Total amount | 8500, 2280 |
| Notes | String | Optional notes | Based on mid-market rates |

### Sample CSV Structure

```csv
Item No.,Description,Unit,Quantity,Rate (£),Amount (£),Notes
1.1.1,"Contract preliminaries: Provide all preliminaries necessary for the proper execution of the works...",item,1,8500,8500,"Based on mid-market UK preliminaries norms for small residential projects"
1.2.1,"Site establishment: Mobilisation to site including delivery, installation, and commissioning...",item,1,2200,2200,"Includes delivery and setup of welfare cabin"
1.2.2,"Temporary accommodation: Welfare cabin (canteen, drying room, WC) for duration of works.",week,24,95,2280,"Based on weekly hire of standard welfare cabin"
1.2.3,Temporary storage: Secure lockable container for tools and materials.,week,24,35,840,"Standard 20ft container hire"
```

### Item Number Hierarchy

Item numbers follow a hierarchical structure:

- **1st digit**: Section number (e.g., 1, 2, 3)
- **2nd digit**: Subsection (e.g., 1.1, 1.2)
- **3rd digit**: Item number (e.g., 1.1.1, 1.1.2)

**Section Headers:**
- Items with numbers like "1.0" or "1.0.0" are treated as section headers
- Their descriptions become the section title
- They are NOT included in the final line items list

## Services

### BoQ Import Service

**File:** `server/src/services/boqImportService.ts`

Main functions:

#### `parseBoQCSV(csvContent: string): BoQImportData`

Parses CSV content and extracts structured BoQ data.

**Features:**
- Handles quoted fields with escaped quotes
- Extracts section numbers from item numbers
- Groups items by section
- Calculates section totals

#### `validateBoQData(data: BoQImportData): string[]`

Validates BoQ data structure and returns error list.

#### `calculatePagination(sections: BoQSection[], itemsPerPage: number = 20)`

Calculates page breaks for sections based on items per page.

#### `extractSectionId(itemNumber: string): number`

Extracts section ID from item number.

#### `formatCurrency(amount: number): string`

Formats numbers as GBP currency.

#### `parseNumericValue(value: string | number | undefined): number`

Safely parses numeric values from CSV fields (handles £, commas, etc.).

### BoQ PDF Generator Service

**File:** `server/src/services/boqPdfGenerator.ts`

Generates professional multi-page PDFs with automatic pagination.

**Features:**
- Title page with project summary
- Section pages with organized line items
- Page numbering within sections
- Section summary pages with cost breakdowns
- Final summary page with all totals
- Automatic page breaks based on content
- Professional table formatting

#### `generateBoQPDF(sections: BoQSection[], options: BoQPdfOptions): PDFDocument`

Main function to generate PDF document.

**Options:**
```typescript
interface BoQPdfOptions {
  projectName: string;
  projectClient?: string;
  projectAddress?: string;
  projectStartDate?: string;
  companyName?: string;
  generatedDate?: Date;
  itemsPerPage?: number; // Default: 20
}
```

## Routes

### File: `server/src/routes/v1/boqImport.ts`

Handles all BoQ import operations.

**Middleware:**
- `verifyAuth` - Requires authentication
- `authorize('admin', 'estimator')` - For import/delete operations
- `multer` - File upload handling

**Features:**
- CSV file validation
- Batch transaction processing
- Error handling with detailed messages
- Automatic file cleanup after processing

## Frontend Components (To Be Implemented)

Recommended components for the React frontend:

### 1. BoQ Import Dialog

```typescript
interface BoQImportDialogProps {
  projectId: number;
  onSuccess: (boqImportId: number) => void;
}

// Component features:
// - Drag-drop CSV file upload
// - Preview before import
// - Progress indicator
// - Error display
```

### 2. BoQ Management Table

```typescript
interface BoQManagementTableProps {
  projectId: number;
}

// Component features:
// - List all BoQ imports
// - Delete import functionality
// - View line items by import
// - Export to PDF
```

### 3. PDF Export Options

```typescript
interface BoQPdfExportProps {
  projectId: number;
  boqImportId?: number;
}

// Component features:
// - Filter by import
// - Download PDF
// - Preview mode
```

## Usage Workflow

### 1. Upload BoQ File

```bash
POST /api/v1/projects/1/boq-import
Content-Type: multipart/form-data

file: [Prelims_BoQ.csv]
importName: "Preliminaries BoQ"
```

### 2. Verify Import

```bash
GET /api/v1/projects/1/boq-imports
```

### 3. View Line Items

```bash
GET /api/v1/projects/1/estimates
```

### 4. Export PDF

```bash
GET /api/v1/projects/1/estimates/export-boq-pdf?boqImportId=1
```

## Data Flow

```
CSV File
   ↓
[Parse CSV]
   ↓
[Validate Data]
   ↓
[Group by Section]
   ↓
[Create boq_imports record]
   ↓
[Insert project_estimates records]
   ↓
[Link via boq_import_id]
   ↓
Database: project_estimates + boq_imports
   ↓
[Calculate Pagination]
   ↓
[Generate PDF with sections/pages]
   ↓
PDF Report
```

## Validation Rules

### CSV Validation
- All required columns present
- Item numbers not empty
- Quantity and rate are valid numbers
- Amount is numeric or calculated from Quantity × Rate

### BoQ Data Validation
- At least one section required
- Each section has at least one item
- Item numbers are properly formatted
- Quantities are positive numbers
- Rates are non-negative numbers

## Error Handling

### Common Errors

**Missing Required Columns**
```json
{
  "success": false,
  "error": "Missing required columns: Amount (£)",
  "errors": [...]
}
```

**Invalid Numeric Data**
```json
{
  "success": false,
  "error": "Row 5: Invalid quantity value 'abc'"
}
```

**No Valid Items**
```json
{
  "success": false,
  "error": "No valid items found in CSV"
}
```

**Invalid File Type**
```json
{
  "success": false,
  "error": "Only CSV files are allowed"
}
```

## Performance Considerations

### CSV Parsing
- Handles files up to 10MB
- Custom parser (no external CSV library dependency)
- Line-by-line processing for memory efficiency

### Database
- Indexes on frequently queried columns
- Transaction-based import for consistency
- Soft delete for archived items

### PDF Generation
- Buffered page rendering
- Automatic page breaks
- Efficient text measurement

## Security

### File Upload
- MIME type validation
- File size limits (10MB)
- Filename sanitization
- Upload directory isolation

### Access Control
- Authentication required for all endpoints
- Authorization checks for admins/estimators
- Project ownership verification

### Data Validation
- Input sanitization
- Type checking with Zod
- SQL injection prevention via prepared statements

## Testing Recommendations

### Unit Tests
- CSV parsing with various formats
- Numeric value parsing
- Section extraction
- Pagination calculation

### Integration Tests
- File upload flow
- Database transaction rollback
- Permission checks
- PDF generation

### Sample Test CSV Files

**Valid BoQ:**
```csv
Item No.,Description,Unit,Quantity,Rate (£),Amount (£),Notes
1.1.1,Item One,item,1,100,100,Notes
1.1.2,Item Two,week,4,50,200,Notes
```

**Edge Cases:**
- Items with very long descriptions
- Large quantities (e.g., 10000+)
- High rates (e.g., £50,000+)
- Special characters in descriptions
- Multiple section levels
- Mixed item types

## Future Enhancements

1. **Templates** - Save BoQ structures as reusable templates
2. **Merge** - Combine multiple BoQ imports
3. **Comparison** - Compare BoQs from different imports
4. **Versioning** - Track changes to BoQ over time
5. **Custom Sections** - User-defined section headers
6. **Calculations** - Add contingency percentages to sections
7. **Export Formats** - Excel, Word, JSON exports
8. **Integration** - NRM2, BCIS classification alignment
9. **Workflow** - Approval chains for BoQ imports
10. **Analytics** - Cost trends and benchmarking

## File Structure

```
server/src/
├── database/
│   └── migrations/
│       └── 013_add_boq_import_fields.sql
├── services/
│   ├── boqImportService.ts
│   └── boqPdfGenerator.ts
├── routes/
│   └── v1/
│       └── boqImport.ts
├── repositories/
│   └── projectRepository.ts (enhanced)
└── routes/
    └── v1/
        └── projectEstimates.ts (enhanced)
```

## Running the Migration

The migration runs automatically on server startup via:

```typescript
// server/src/index.ts
runMigrations(db);
```

To manually run:

```bash
npm run dev:server
```

The database will auto-initialize with the new schema.

## Example Workflow

### Step 1: Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

### Step 2: Create Project
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Renovations",
    "client_id": 1,
    "start_date": "2024-03-01"
  }'
```

### Step 3: Preview BoQ Import
```bash
curl -X POST http://localhost:3000/api/v1/projects/1/boq-import/preview \
  -H "Authorization: Bearer <token>" \
  -F "file=@BoQ.csv"
```

### Step 4: Import BoQ
```bash
curl -X POST http://localhost:3000/api/v1/projects/1/boq-import \
  -H "Authorization: Bearer <token>" \
  -F "file=@BoQ.csv" \
  -F "importName=Main BoQ"
```

### Step 5: Export PDF
```bash
curl -X GET http://localhost:3000/api/v1/projects/1/estimates/export-boq-pdf \
  -H "Authorization: Bearer <token>" \
  -o output.pdf
```

## Troubleshooting

### CSV Not Parsing
- Check column names match exactly (case-insensitive)
- Verify no extra spaces in headers
- Ensure numeric fields don't contain text

### Import Fails
- Verify project exists
- Check user has estimator+ role
- Review error messages for specific issues

### PDF Not Generating
- Ensure estimates exist for project
- Check items have section_id values
- Verify custom_description and custom_unit are populated

### Performance Issues
- For large BoQs (1000+ items), increase itemsPerPage
- Ensure database indexes are created
- Consider splitting into multiple imports

---

**Version:** 1.0.0
**Last Updated:** 2024-02-10
**Status:** Production Ready
