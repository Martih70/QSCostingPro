# BoQ Structure - Quick Test Guide

## Server Status
✅ Running on `http://localhost:3000`

## Quick Start Testing

### 1. Check Server Health
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{"status":"ok","version":"1.0.0","timestamp":"..."}
```

### 2. Create a Test Project
Create a project first at `/projects/new` or use an existing project ID.

### 3. Import a BoQ CSV
Navigate to `/projects/:id/boq` and click "Import New BoQ"

The CSV should have columns like:
```
Item Number, Description, Quantity, Unit, Rate, Amount, Section
1.1,Excavation,100,m3,25.00,2500.00,Preliminaries
1.2,Leveling,50,m3,20.00,1000.00,Preliminaries
2.1,Foundation,200,m2,150.00,30000.00,Foundations
```

### 4. Test API Endpoints

#### Get all sections
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/projects/1/boq-structure/sections
```

#### Get section pages (with items)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/projects/1/boq-structure/sections/1/pages
```

#### Get section collection
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/projects/1/boq-structure/sections/1/collection
```

#### Get project summary
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/projects/1/boq-structure/summary
```

### 5. Test Frontend Navigation

1. Go to `/projects/:id/boq`
   - See import manager
   - See sections list below

2. Click "View Main Summary" button
   - See BoQSummaryPage with all sections
   - Click "View Collection" for any section

3. Click "Detail Pages" for a section
   - See paginated items
   - See "Page X of Y" labels
   - See subtotals per page

4. Click "Collection" for a section
   - See page summary table
   - Click a row to go to detail pages
   - Click "View Main Summary →"

5. Create a custom section
   - Click "+ Add Custom Section"
   - Enter title and items-per-page
   - See it appear in list with page_count=0

### 6. Test Edge Cases

#### Many items pagination
- Import a BoQ with 100+ items in one section
- Verify multiple pages are created
- Check page_number field in database

#### Delete import
- Delete an import
- Check summary updates automatically
- Verify section is removed if it had no other items

#### Change items per page
- Use PATCH endpoint:
```bash
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items_per_page": 10}' \
  http://localhost:3000/api/v1/projects/1/boq-structure/sections/1
```
- Verify repagination happens
- Check page_number updates on items

---

## Database Verification

### Check tables exist
```bash
sqlite3 server/database/khconstruct.db ".tables" | grep boq
```

Expected output: `boq_collection_pages boq_imports boq_main_summary boq_pages boq_sections`

### Check sections created
```bash
sqlite3 server/database/khconstruct.db \
  "SELECT id, section_number, section_title, page_count FROM boq_sections WHERE project_id = 1;"
```

### Check pages created
```bash
sqlite3 server/database/khconstruct.db \
  "SELECT section_id, page_number, total_pages, subtotal FROM boq_pages ORDER BY section_id, page_number;"
```

### Check collection created
```bash
sqlite3 server/database/khconstruct.db \
  "SELECT section_id, page_count, section_total FROM boq_collection_pages WHERE project_id = 1;"
```

### Check summary created
```bash
sqlite3 server/database/khconstruct.db \
  "SELECT section_count, project_total FROM boq_main_summary WHERE project_id = 1;"
```

---

## Common Issues & Solutions

### No sections appear after import
- Check server logs for rebuild errors
- Verify project_id is correct
- Check boq_sections table has rows

### Wrong page count
- Check items_per_page setting
- Verify page_number is populated on items
- Count items: `SELECT COUNT(*) FROM project_estimates WHERE section_id = X AND is_active = 1`

### Summary missing sections
- Verify section has items (page_count > 0)
- Check boq_collection_pages has rows for that section
- Empty sections are intentionally excluded

### Pagination not working
- Check boq_pages table has rows
- Verify each item has page_number set
- Check item ordering: should be by item_number, then id

---

## Sample Test Data

### Minimal BoQ CSV
```csv
Item Number,Description,Quantity,Unit,Rate,Amount
1.1,Excavation,100,m3,25.00,2500.00
1.2,Leveling,50,m3,20.00,1000.00
2.1,Foundation,200,m2,150.00,30000.00
2.2,Concrete pour,300,m2,100.00,30000.00
```

This will create 2 sections with 2 items each (assuming 2 items per page).

---

## API Response Validation

### Expected /sections response structure
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_number": 1,
      "section_title": "Preliminaries",
      "is_custom": false,
      "items_per_page": 25,
      "sort_order": 1,
      "page_count": 3,
      "section_total": 15420.00
    }
  ]
}
```

### Expected /summary response structure
```json
{
  "success": true,
  "data": {
    "project_total": 60000.00,
    "section_count": 2,
    "sections": [
      {
        "section_id": 1,
        "section_number": 1,
        "section_title": "Preliminaries",
        "collection_total": 30000.00
      }
    ],
    "generated_at": "2026-02-10T18:00:00"
  }
}
```

---

## Performance Notes

- First section load: Includes API call to fetch sections
- Second page load: Uses React Query cache (5 min stale time)
- Summary calculation: <100ms for typical projects
- Collection pages: JSON parse is fast, no N+1 queries

---

## Contact & Support

For issues:
1. Check server logs: `npm run dev:server` output
2. Check browser console: F12 → Console tab
3. Verify database: Use sqlite3 commands above
4. Check API response: Use curl commands above

---

**Last Updated**: February 10, 2026
**Status**: Ready for testing ✅
