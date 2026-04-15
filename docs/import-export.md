# Import & Export

## Formats

| Format        | Import | Export | Scope                              |
|---------------|--------|--------|------------------------------------|
| JSON (native) | Yes    | Yes    | Workspace or selected projects     |
| Kanri         | Yes    | Yes    | Workspace (mapped to Kanri boards) |
| CSV           | Yes    | Yes    | Single project                     |

---

## Export

Code in `src/lib/exports/`.

### JSON (`json-exporter.ts`)

Produces a file with structure:

```
{ version: 1, exportedAt, workspace?, projects: [...], images? }
```

- Can export entire workspace or selected projects
- Optionally embeds images (logos/backgrounds) as base64
- UI: `sync/export-tab-content.tsx` with project selection dialog

### Kanri (`kanri-exporter.ts`)

Maps projects to Kanri board format. Preserves columns, cards, backgrounds, and theme.

### CSV (`csv-exporter.ts`)

Flat spreadsheet export of tasks for a single project.

### Download

`download.ts` triggers file save via Tauri's file dialog or browser download.

---

## Import

Code in `src/lib/imports/`.

### JSON (`json-import.ts`)

- Validates input with Zod schema (`json-schema.ts`)
- Extracts embedded base64 images and saves to OPFS
- Returns stats: project count, task count, columns, images imported
- UI: `sync/import-tab-content.tsx` with result dialog

### Kanri (`kanri-import.ts`, `kanri-converter.ts`)

- Converts Kanri workspace/board structure to native format
- Validates with `kanri-schema.ts`
- Supports backgrounds and theme mapping

### CSV (`csv-import.ts`)

- Parses CSV files matching the export format (same column headers)
- Requires a `Title` column; all other columns are optional
- Creates a new project named after the file
- Columns, tags, and tasks are reconstructed from row data
- Handles quoted fields with commas, newlines, and escaped quotes
- Returns stats: task count, columns created, tags created

---

## Image Handling

- **Export:** `loadImageAsDataUrl()` reads from OPFS, encodes as base64
- **Import:** `saveImage()` writes file to OPFS with a new UUID
- Images are referenced by version strings in project fields (`backgroundVersion`, `logoVersion`)

---

## UI

All import/export UI lives in `src/components/sync/`:

- `SyncView` — tabbed container (Sync / Import / Export)
- `ImportTabContent` — file picker, format selection, result dialog
- `ExportTabContent` — format selection, project picker, download
