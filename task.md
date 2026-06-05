# Task List — Phase 12: Fix Create Idea Modal & AI Assistant

- [x] AI Assistant Sidebar: Add visible primary Generate button, spinner loading state, and result panel with Insert/Copy/Regenerate actions.
- [x] Modal Cleanups: Remove all tag configurations, settings accordions, notes, and extra dropdowns. Only keep title, description, file upload, platform dropdown, emoji, AI button, Create Post, and Save Idea.
- [x] File Upload: Connect to real `/api/upload` endpoint with PNG/JPG/MP4 validations up to 50MB. Render upload preview card with Remove/Replace.
- [x] MongoDB CRUD Integration:
    - [x] Load ideas from `/api/ideas` GET endpoint on mount.
    - [x] Save Idea: call `/api/ideas` POST/PUT to save to MongoDB as `"idea"` status.
    - [x] Create Post: call `/api/ideas` POST/PUT to save to MongoDB as `"draft"` status.
    - [x] Drag & Drop: call `/api/ideas` PUT to update database status on column change.
    - [x] Delete Idea: call `/api/ideas` DELETE to remove from MongoDB.
- [x] Form Validation: Prevent empty title/content, unsupported file, or file > 50MB.
- [x] Discard warning: Show warning modal "Discard Changes?" if form has typed content.
- [x] Success Toasts: Render floating notifications for saved, uploaded, generated, and created events.
- [x] Build & Verify: Compiles and builds Next.js production build cleanly.
