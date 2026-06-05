# Implementation Plan — Phase 12: Fix Create Idea Modal & AI Assistant

We will fix the critical bugs in the Create Idea modal and AI Assistant. We will connect all data creation, updates, and uploads to MongoDB, implement proper validations, loading states, close confirmations, and show success toasts.

## User Review Required

> [!IMPORTANT]
> - **MongoDB Integration**: All content board ideas will be loaded and saved directly to the database rather than `localStorage`.
> - **Settings Removal**: The tags and settings panel will be completely deleted from the modal. The status column is determined by clicking "Save Idea" (Ideas column) or "Create Post" (Drafts column).
> - **AI Assistant result actions**: Once the prompt is generated, a result panel inside the sidebar will offer `Insert Into Idea`, `Copy`, and `Regenerate` actions.

## Proposed Changes

### Database & Backend

#### [NEW] [idea.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/lib/models/idea.ts) *(Already created)*
- Declares the Mongoose Schema for `ideas` tracking fields: `userId`, `workspaceId`, `title`, `content`, `platform`, `media`, and `status`.

#### [NEW] [route.ts](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/api/ideas/route.ts) *(Already created)*
- Connects REST API handlers for GET (list), POST (create), PUT (update), and DELETE (remove) for MongoDB records.

### Frontend Pages

#### [MODIFY] [page.tsx](file:///c:/Users/xzaka/Desktop/social-media-management-with-ai/app/free-user/create/page.tsx)
- **Database Load/Sync**: Fetch all user ideas from `/api/ideas` on mount. Save, drag-and-drop, and post conversions will update database records using API calls.
- **AI Assistant Drawer (Bug 1 & 6 & 9)**:
  - Add primary `[ Generate Content ]` button in AI sidebar panel, disabled when input prompt is empty.
  - Show spinner and text "Generating content..." during API call.
  - Implement the **AI Result Panel** inside the drawer featuring `Insert Into Idea` (filling Title & Description fields), `Copy` (clipboard), and `Regenerate`.
- **Remove Settings (Bug 2)**: Completely delete tags input, content notes, status select, and setting accordion menus from the modal.
- **Image Upload (Bug 3)**:
  - Support hidden file picker.
  - Handle `dragover`, `drop`, and `click` to trigger real upload to `/api/upload` (supports PNG, JPG, JPEG, WEBP, GIF, and MP4 up to 50MB).
  - Preview thumbnail, size, name, and show Remove / Replace button actions.
- **Save Idea & Create Post (Bug 4 & 5)**:
  - Save Idea: validates title/content, saves to MongoDB with status `"idea"`.
  - Create Post: validates title/content, saves to MongoDB with status `"draft"`, automatically moving it to the Drafts column.
- **Modal Discard Check (Bug 7)**:
  - Show warning modal *"Discard Changes? Cancel / Discard"* if user has typed text in the fields before closing.
- **Form Validation (Bug 8)**: Prevents saving empty fields, uploading wrong types, or exceeding 50MB.
- **Success Toasts (Bug 10)**: Create a floating checkmark banner that displays:
  - `✓ Idea Saved`
  - `✓ Media Uploaded`
  - `✓ Content Generated`
  - `✓ Post Created`

## Verification Plan

### TypeScript & Compile Checks
- Run `npm run build` to confirm Next.js compiles all routes and Mongoose schemas successfully.

### Manual Functional Checks
1. Try saving empty fields to verify validation alerts.
2. Drag and drop a card on the Kanban board, refresh the page, and check if it maintains its new status column (verifying MongoDB persistence).
3. Open a file picker, select a file > 50MB or an unsupported type to test validation. Upload a valid image to verify the thumbnail preview card and DB record.
4. Prompt the AI Assistant sidebar, verify "Generating..." state, check results, click "Insert Into Idea" and check if form fields auto-populate.
5. Close the composer modal with typed text to verify discard warning.
