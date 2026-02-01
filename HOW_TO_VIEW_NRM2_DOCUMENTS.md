# How to View NRM 2 Documents & Reference Materials

## Current Status

The Reference Documents page is now **working correctly**. If you're seeing a white/blank page, it's displaying the **empty state** - meaning no documents have been uploaded yet.

---

## What You're Seeing

### Empty State (First Time)
When you click "View Full PDF" or navigate to Reference Documents for the first time, you see:
- 📋 Icon
- Message: "No documents uploaded yet"
- Instructions to upload PDFs or reference documents

**This is normal!** No documents have been uploaded to the system yet.

---

## How to Upload and View Documents

### Step 1: Navigate to Reference Documents
1. Log in to QSCostingPro
2. In the sidebar, expand **"Reference Library"** (📚)
3. Click **"Documents"** (📄)

### Step 2: Upload a Document
1. Click the **"⬆️ Upload Document"** button in the top right
2. Select a file from your computer:
   - **Supported formats:** PDF, PNG, JPG
   - **Max file size:** 50MB
3. The document uploads and appears in the list

### Step 3: View a Document
1. Click on any document in the list (left side)
2. The document preview appears in the right panel
3. For PDFs: Full PDF viewer with zoom and scrolling
4. For images: Full-size preview

### Step 4: Manage Documents
- **Delete:** Click the 🗑️ trash icon on a selected document
- **Download:** For unsupported formats, a download link appears
- **Filter by category:** Use the category dropdown at the top

---

## Example Workflow

1. **Go to NRM 2 Reference Page** → Sidebar → Reference Library → NRM 2 Codes
   - Browse the hierarchical structure
   - Click "View Full PDF" button

2. **If no documents exist yet:**
   - System shows "No documents uploaded yet"
   - Go back to Reference Library → Documents
   - Click "Upload Document"
   - Select your NRM 2 PDF file
   - Document appears in the list
   - Click to preview it

3. **Once uploaded:**
   - The document is available for preview
   - You can share it with team members
   - It appears every time you visit the Documents page

---

## Troubleshooting

### "White blank page" with no content?
✅ **Solution:** This is the empty state. Upload a document first.

### Upload button not working?
✅ **Check:**
- File is under 50MB
- File format is PDF, PNG, or JPG
- You have admin or estimator role

### Can't see PDF preview?
✅ **Check:**
- File uploaded successfully (appears in list)
- Browser supports PDF viewing (all modern browsers do)
- Try zooming in/out on the page

### Document disappeared after upload?
✅ **Check:**
- Refresh the page to see it
- Check the category filter - might be filtering it out

---

## API Endpoints (For Reference)

| Endpoint | Purpose |
|----------|---------|
| GET /api/v1/references | List all documents |
| POST /api/v1/references/upload | Upload new document |
| GET /api/v1/references/:id/download | Download/view document |
| DELETE /api/v1/references/:id | Delete document |

All endpoints are working correctly.

---

## Next Steps

1. **Upload NRM 2 PDF:** Add your official NRM 2 specification PDF
2. **Add Reference Materials:** Upload any other construction standards or guides
3. **Organize Documents:** Use categories to keep documents organized
4. **Share with Team:** All team members can view uploaded documents

---

## Features

✅ PDF preview with browser's native viewer
✅ Image preview with full-size display
✅ Document management (upload, delete)
✅ File size and upload date tracking
✅ Category organization
✅ 50MB file size limit
✅ Security: Authenticated uploads only

---

**Created:** February 1, 2026
**Updated:** After NRM 2 Integration Fixes
