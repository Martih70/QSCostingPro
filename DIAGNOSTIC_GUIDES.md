# Diagnostic Guide - Blank Reference Documents Page

## If you see a completely blank white page when clicking "View Full PDF" or navigating to Documents:

### Step 1: Check Browser Console
1. **Open Browser Developer Tools:** Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. **Go to Console tab**
3. **Look for error messages** - Take a screenshot or note any red error messages
4. **Look for log messages** - Search for "ReferenceDocumentsPage" or "Fetching documents"

### Step 2: Check Network Tab
1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Reload the page** (Ctrl+R or Cmd+R)
4. **Look for requests** to `/api/v1/references`
5. **Check the response:**
   - Status should be 200
   - Body should show: `{"success":true,"data":[],"count":0}`

### Step 3: Test API Directly
Open a new browser tab and go to:
```
http://localhost:3000/api/v1/references
```

You should see:
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

### Step 4: Check Authentication
1. **Make sure you're logged in** - You should see your username in the sidebar
2. **Check localStorage** in console:
   ```javascript
   localStorage.getItem('accessToken')  // Should show a token
   localStorage.getItem('user')         // Should show user data
   ```

---

## Common Issues & Fixes

### Issue: "referencesAPI is not defined"
**Fix:**
1. Check `/client/src/services/api.ts` exists
2. Verify `export const referencesAPI` is defined
3. Rebuild: `npm run build`
4. Restart server: `npm run dev`

### Issue: Blank page, no errors in console
**Fix:**
1. Check if you're authenticated (logged in)
2. Try logging out and back in
3. Clear browser cache: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`
4. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

### Issue: "Failed to fetch documents" error
**Fix:**
1. Check network tab for 401 or 403 errors
2. Try refreshing the page
3. Log out and log back in
4. Check your user role (should be admin or estimator)

### Issue: Network request shows 404
**Fix:**
1. Check server is running: `http://localhost:3000/api/v1/nrm2/groups` should work
2. Check if references routes are loaded
3. Restart server with `npm run dev`

---

## What Should Happen

### First Time (No Documents)
1. Page loads
2. Header shows: "Reference Documents"
3. Upload button visible in top right
4. Main area shows: "No documents uploaded yet"
5. Side panel shows: "Select a document to preview"

### After Uploading a Document
1. Document appears in left list
2. Click document to select it
3. Preview appears in right panel
4. Delete button (🗑️) appears when selected

---

## Report Information

If the page still doesn't work, please provide:
1. **Screenshot** of the blank page
2. **Console errors** (screenshot or text)
3. **Network tab request/response** to `/api/v1/references`
4. **Confirm:**
   - [ ] You're logged in
   - [ ] You're using Chrome, Firefox, Safari, or Edge
   - [ ] You've tried refreshing the page (Ctrl+R)
   - [ ] You've tried clearing cache (Ctrl+Shift+Delete)

---

**Created:** February 1, 2026
**For:** Troubleshooting blank Reference Documents page
