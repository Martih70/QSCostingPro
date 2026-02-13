# Bill of Quantities (BoQ) Import System

Complete React frontend for importing Bill of Quantities files into QSCostingPro.

## Overview

The BoQ import system allows users to upload and import Bill of Quantities data from various file formats (PDF, Excel, CSV) directly into project estimates. The system provides:

- Multi-step file upload workflow
- Preview of imported items before confirmation
- Support for sections and line items
- Currency formatting and calculations
- Error handling and validation
- PDF export of imports
- Import management (list, delete, export)

## Architecture

```
BoQImportForm (Main Component)
├── File Upload Step (drag-drop + file input)
├── Preview Step (BoQPreviewTable)
└── Confirm Step (summary + action)

BoQImportModal (Modal Wrapper)
└── BoQImportForm

BoQImportsManager (Project-level Management)
├── Import list display
├── Delete functionality
├── Export PDF functionality
└── BoQImportModal (nested)

useBoQImport (Custom Hook)
├── previewImport() - POST /api/v1/boq/preview
├── importBoQ() - POST /api/v1/boq/import
├── exportPDF() - GET /api/v1/boq/imports/:id/export
├── getImports() - GET /api/v1/boq/projects/:projectId/imports
└── deleteImport() - DELETE /api/v1/boq/imports/:id
```

## File Structure

```
client/src/
├── components/boq/
│   ├── BoQImportForm.tsx       # Main import form with 3-step workflow
│   ├── BoQImportModal.tsx      # Modal wrapper component
│   ├── BoQPreviewTable.tsx     # Displays imported items in table format
│   ├── BoQImportsManager.tsx   # Manages imports for a project
│   ├── BOQBrowserModal.tsx     # Existing NRM2 BOQ browser
│   ├── index.ts                # Barrel export
│   └── BOQ_IMPORT_README.md    # This file
├── hooks/
│   └── useBoQImport.ts         # Custom hook for API calls
├── types/
│   └── boq.ts                  # TypeScript interfaces
└── pages/
    └── BoQPage.tsx             # Dedicated BoQ management page
```

## Components

### 1. BoQImportForm

Main component handling the 3-step import workflow.

#### Props
```typescript
interface BoQImportFormProps {
  projectId: number
  onImportSuccess?: () => void
}
```

#### Features
- **Upload Step**: Drag-and-drop file upload
  - Accept PDF, Excel, CSV files
  - Max 10MB file size
  - Visual feedback for drag-over state
  - File type and size validation

- **Preview Step**: Shows table of imported items
  - Items grouped by section
  - Section totals and grand total
  - Summary statistics (items count, sections count, total quantity)

- **Confirm Step**: Final confirmation before import
  - Summary of what will be imported
  - Number of items and total amount
  - Informational note about editing after import

#### States
```typescript
type FormStep = 'upload' | 'preview' | 'confirm'

const [step, setStep] = useState<FormStep>('upload')
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [items, setItems] = useState<BoQItem[]>([])
const [sections, setItems] = useState<BoQSection[]>([])
const [totalAmount, setTotalAmount] = useState(0)
const [isDragging, setIsDragging] = useState(false)
const [isConfirming, setIsConfirming] = useState(false)
```

#### Usage
```tsx
import { BoQImportForm } from '../components/boq'

<BoQImportForm
  projectId={projectId}
  onImportSuccess={() => {
    // Refresh project data
    fetchProjects()
  }}
/>
```

### 2. BoQImportModal

Modal wrapper around BoQImportForm for use in dialogs.

#### Props
```typescript
interface BoQImportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
  onImportSuccess?: () => void
}
```

#### Usage
```tsx
import { BoQImportModal } from '../components/boq'

const [showImportModal, setShowImportModal] = useState(false)

<button onClick={() => setShowImportModal(true)}>
  Import BoQ
</button>

<BoQImportModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  projectId={projectId}
  onImportSuccess={() => setShowImportModal(false)}
/>
```

### 3. BoQPreviewTable

Displays imported items in a formatted table with sections and totals.

#### Props
```typescript
interface BoQPreviewTableProps {
  items: BoQItem[]
  sections: BoQSection[]
  totalAmount: number
}
```

#### Features
- Section grouping with section headers
- Column headers: Item No., Description, Unit, Quantity, Rate (£), Amount (£), Notes
- Per-section totals
- Grand total highlighted
- Summary stats (total items, total sections, total quantity)
- Responsive table with horizontal scrolling on mobile
- Hover effects on rows

#### Usage
```tsx
import { BoQPreviewTable } from '../components/boq'

<BoQPreviewTable
  items={items}
  sections={sections}
  totalAmount={totalAmount}
/>
```

### 4. BoQImportsManager

Manages all imports for a project, with list, delete, and export functionality.

#### Props
```typescript
interface BoQImportsManagerProps {
  projectId: number
}
```

#### Features
- List of all imports with file info
- Import statistics (items count, total amount)
- Delete import button with confirmation
- Export PDF button
- Empty state with helpful message
- Loading states with spinners

#### Usage
```tsx
import { BoQImportsManager } from '../components/boq'

<BoQImportsManager projectId={projectId} />
```

## Hooks

### useBoQImport

Custom React hook for managing BoQ import API calls and state.

#### Return Value
```typescript
{
  isLoading: boolean
  error: string | null
  previewImport: (file: File) => Promise<BoQImportState | null>
  importBoQ: (file: File, projectId: number) => Promise<BoQImportState | null>
  exportPDF: (importId: number) => Promise<void>
  getImports: (projectId: number) => Promise<any[] | null>
  deleteImport: (importId: number) => Promise<void>
  clearError: () => void
}
```

#### Methods

**previewImport(file: File)**
- POST to `/api/v1/boq/preview`
- Returns parsed items without saving
- Useful for showing user what will be imported

**importBoQ(file: File, projectId: number)**
- POST to `/api/v1/boq/import`
- Saves imported items to project
- Returns imported data

**exportPDF(importId: number)**
- GET from `/api/v1/boq/imports/:id/export`
- Downloads PDF of import
- Triggers browser download

**getImports(projectId: number)**
- GET from `/api/v1/boq/projects/:projectId/imports`
- Fetches list of imports for project
- Returns array of import objects

**deleteImport(importId: number)**
- DELETE to `/api/v1/boq/imports/:id`
- Removes import from project
- No return value

#### Usage
```tsx
import { useBoQImport } from '../hooks/useBoQImport'

function MyComponent() {
  const { isLoading, error, previewImport, importBoQ } = useBoQImport()

  const handleUpload = async (file: File) => {
    try {
      const result = await previewImport(file)
      // Show preview to user
    } catch (err) {
      // Handle error
    }
  }

  return (
    // Component JSX
  )
}
```

## Types

All TypeScript types are defined in `types/boq.ts`:

### BoQItem
```typescript
export interface BoQItem {
  itemNumber: string
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  notes?: string
  sectionNumber?: number
}
```

### BoQSection
```typescript
export interface BoQSection {
  sectionNumber: number
  sectionTitle?: string
  items: BoQItem[]
  sectionTotal: number
  pages?: any[]
}
```

### BoQImportResponse
```typescript
export interface BoQImportResponse {
  success: boolean
  data?: {
    imported_items: BoQItem[]
    sections: BoQSection[]
    total_amount: number
  }
  error?: string
}
```

### BoQImportState
```typescript
export interface BoQImportState {
  items: BoQItem[]
  sections: BoQSection[]
  totalAmount: number
}
```

## Integration Points

### ProjectEstimatesPage Integration

The BoQ import modal is integrated into the ProjectEstimatesPage with a dedicated button:

```tsx
<button
  onClick={() => setShowBoQImport(true)}
  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm"
  title="Import from BoQ file (PDF, Excel, CSV)"
>
  📄 Import File
</button>

<BoQImportModal
  isOpen={showBoQImport}
  onClose={() => setShowBoQImport(false)}
  projectId={projectId}
  onImportSuccess={() => {
    fetchBCISGroupedData()
    fetchProjects()
  }}
/>
```

### BoQPage Route

A dedicated page is available at `/projects/:id/boq` for managing all BoQ imports:

```tsx
// App.tsx
<Route path="/projects/:id/boq" element={<BoQPage />} />
```

## Styling & Design

The components use:
- **Tailwind CSS** for styling
- **KHC brand colors** (primary: `khc-primary`, secondary: `khc-secondary`)
- **Responsive design** for mobile and desktop
- **Loading spinners** for async operations
- **Toast notifications** for feedback (via useToast hook)
- **Modal dialogs** for overlay UI

### Color Scheme
- Primary: `khc-primary` (KHC brand primary)
- Secondary: `khc-secondary` (KHC brand secondary)
- Success: `green-600` for confirm actions
- Warning: `teal-600` for BoQ imports
- Error: `red-600` for delete actions
- Info: `blue-500` for informational buttons
- Neutral: `gray-*` for backgrounds and borders

### Responsive Breakpoints
- Mobile: `< 768px` (single column)
- Tablet: `768px - 1024px` (flexible)
- Desktop: `> 1024px` (multi-column grids)

## Error Handling

All components handle errors gracefully:

1. **File Validation**
   - File type check (PDF, Excel, CSV only)
   - File size check (max 10MB)
   - Visual error messages

2. **API Errors**
   - Try-catch blocks around all async operations
   - Error state in hooks
   - User-friendly error messages via toast

3. **Data Validation**
   - Empty item check before operations
   - File selection validation
   - Project ID validation

## Loading States

Components show appropriate loading indicators:
- Upload step: Loading spinner overlay
- Confirm step: Disabled button with spinner
- Delete/Export: Inline spinners in action buttons

## Accessibility

- Semantic HTML (proper headings, labels)
- ARIA attributes on modals
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Focus management in modals

## Performance Considerations

1. **File Upload**
   - Client-side validation before upload
   - No automatic retry on failure
   - Clear user feedback on errors

2. **State Management**
   - Hook-based state (no Redux needed)
   - Minimal re-renders
   - Proper useEffect cleanup

3. **API Calls**
   - No polling or continuous requests
   - Single request per operation
   - Bearer token auth via localStorage

## Testing Guide

### Unit Testing Components
```typescript
// Example test for BoQImportForm
import { render, screen } from '@testing-library/react'
import BoQImportForm from './BoQImportForm'

describe('BoQImportForm', () => {
  it('renders upload step initially', () => {
    render(<BoQImportForm projectId={1} />)
    expect(screen.getByText(/Upload BoQ File/i)).toBeInTheDocument()
  })
})
```

### Integration Testing
- Mock API responses
- Test file upload flow
- Test multi-step navigation
- Test error handling

### E2E Testing
- Upload test file
- Preview items
- Confirm import
- Verify data saved to project

## Troubleshooting

### File upload fails
- Check file type (must be PDF, Excel, or CSV)
- Check file size (max 10MB)
- Check authentication token
- Check API endpoint availability

### Preview shows no items
- File format may not be supported by backend parser
- File structure may not match expected format
- Check backend logs for parse errors

### Import modal doesn't close
- Check `onImportSuccess` callback is firing
- Verify `onClose` is properly bound
- Check for console errors

### Toast notifications not showing
- Ensure ToastContainer is in parent layout
- Check useToast hook is imported correctly
- Verify localStorage is not disabled

## Future Enhancements

- [ ] Batch file uploads
- [ ] Template-based parsing for custom formats
- [ ] Import history and rollback
- [ ] Duplicate item detection
- [ ] Rate validation and suggestions
- [ ] Integration with quote management
- [ ] Real-time parsing progress
- [ ] Support for additional file formats

## API Contract

The frontend expects these backend endpoints:

### POST /api/v1/boq/preview
Preview BoQ file without saving
- Request: FormData with file
- Response: `BoQImportResponse`

### POST /api/v1/boq/import
Import BoQ file and save to project
- Request: FormData with file and project_id
- Response: `BoQImportResponse`

### GET /api/v1/boq/projects/:projectId/imports
List all imports for a project
- Response: Array of import objects

### DELETE /api/v1/boq/imports/:id
Delete an import
- Response: Success message

### GET /api/v1/boq/imports/:id/export
Export import as PDF
- Response: PDF binary file

## Support

For issues or questions:
1. Check component props and usage
2. Review error messages in console
3. Check backend API logs
4. Verify authentication token
5. Check network requests in DevTools
